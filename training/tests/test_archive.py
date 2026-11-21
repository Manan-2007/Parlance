import io
import unittest
import zipfile
from unittest.mock import patch
from urllib.error import HTTPError

from training.archive import HTTPRangeReader, MultipartRangeReader, read_indexed_member


class Response(io.BytesIO):
    status = 206

    def __init__(self, data, content_range):
        super().__init__(data)
        self.headers = {'Content-Range': content_range}

    def geturl(self):
        return 'https://files.example/dataset.zip'


class ArchiveTests(unittest.TestCase):
    @patch('training.archive.time.sleep')
    @patch('training.archive.urlopen')
    def test_timeout_retries_without_losing_requested_range(self, open_url, _sleep):
        open_url.side_effect = [TimeoutError(), Response(b'data', 'bytes 0-3/4')]
        reader = HTTPRangeReader('https://publisher.example/download', 4)
        self.assertEqual(reader.read(), b'data')
        self.assertEqual(open_url.call_count, 2)
        for call in open_url.call_args_list:
            self.assertEqual(call.args[0].get_header('Range'), 'bytes=0-3')

    @patch('training.archive.urlopen')
    def test_resolved_url_is_reused_and_expiry_refreshes_publisher_route(self, open_url):
        publisher = 'https://publisher.example/download'
        resolved = 'https://files.example/dataset.zip'
        open_url.side_effect = [Response(b'abc', 'bytes 0-2/6'),
                                HTTPError(resolved, 403, 'Expired', {}, None),
                                Response(b'def', 'bytes 3-5/6')]
        reader = HTTPRangeReader(publisher, 6)
        reader.block_size = 3
        self.assertEqual(reader.read(), b'abcdef')
        self.assertEqual([call.args[0].full_url for call in open_url.call_args_list],
                         [publisher, resolved, publisher])

    @patch('training.archive.urlopen')
    def test_wrong_range_is_rejected_before_cache_is_updated(self, open_url):
        open_url.return_value = Response(b'data', 'bytes 4-7/8')
        reader = HTTPRangeReader('https://publisher.example/download', 4)
        with self.assertRaisesRegex(ValueError, 'unexpected byte range'):
            reader.read()
        self.assertFalse(reader.cache)

    @patch('training.archive.urlopen')
    def test_expired_signed_source_uses_authenticated_refresh_callback(self, open_url):
        expired = 'https://files.example/expired'
        fresh = 'https://files.example/fresh'
        open_url.side_effect = [HTTPError(expired, 403, 'Expired', {}, None),
                                Response(b'data', 'bytes 0-3/4')]
        from unittest.mock import Mock
        refresh = Mock(return_value=fresh)
        reader = HTTPRangeReader(expired, 4, refresh_url=refresh)
        self.assertEqual(reader.read(), b'data')
        refresh.assert_called_once_with()
        self.assertEqual(open_url.call_args.args[0].full_url, fresh)

    @patch('training.archive.urlopen')
    def test_exact_read_crosses_archive_parts_without_block_overfetch(self, open_url):
        open_url.side_effect = [Response(b'cd', 'bytes 2-3/4'), Response(b'ef', 'bytes 0-1/4')]
        reader = MultipartRangeReader([HTTPRangeReader('https://files.example/aa', 4),
                                       HTTPRangeReader('https://files.example/ab', 4)])
        self.assertEqual(reader.read_exact_at(2, 4), b'cdef')
        self.assertEqual([call.args[0].get_header('Range') for call in open_url.call_args_list],
                         ['bytes=2-3', 'bytes=0-1'])

    def test_indexed_member_preserves_decompression_and_crc_validation(self):
        archive = io.BytesIO()
        data = b'pose coordinates' * 100
        with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED) as output:
            output.writestr('source/sample.pose', data)
        archive.seek(0)
        with zipfile.ZipFile(archive) as source:
            info = source.infolist()[0]
        member = {'name': info.filename, 'offset': info.header_offset, 'size': info.file_size,
                  'compressed': info.compress_size, 'crc32': info.CRC}
        payload = archive.getvalue()

        class Reader:
            def read_exact_at(self, position, length):
                return payload[position:position + length]

        self.assertEqual(read_indexed_member(Reader(), member), data)
        member['crc32'] ^= 1
        with self.assertRaisesRegex(ValueError, 'checksum'):
            read_indexed_member(Reader(), member)


if __name__ == '__main__':
    unittest.main()
