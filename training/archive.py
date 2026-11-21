"""Read selected files from public dataset ZIPs using standard HTTP ranges."""
from collections import OrderedDict
import io
from bisect import bisect_right
import struct
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
import zipfile
import zlib


class HTTPRangeReader(io.RawIOBase):
    def __init__(self, url, size, offset=0, refresh_url=None):
        self.url = url
        self.source_url = url
        self.refresh_url = refresh_url
        self.size = size
        self.offset = offset
        self.position = 0
        self.cache = OrderedDict()
        self.block_size = 4 * 1024 * 1024

    def seekable(self):
        return True

    def readable(self):
        return True

    def tell(self):
        return self.position

    def seek(self, offset, whence=0):
        origin = (0, self.position, self.size)[whence]
        position = origin + offset
        if position < 0:
            raise ValueError('Negative dataset archive offset')
        self.position = position
        return position

    def block(self, index):
        if index in self.cache:
            self.cache.move_to_end(index)
            return self.cache[index]
        start = index * self.block_size
        end = min(self.size, start + self.block_size) - 1
        data = self.fetch_range(start, end)
        self.cache[index] = data
        if len(self.cache) > 4:
            self.cache.popitem(last=False)
        return data

    def fetch_range(self, start, end):
        for attempt in range(4):
            try:
                request = Request(self.url, headers={
                    'Range': f'bytes={self.offset+start}-{self.offset+end}',
                    'User-Agent': 'Parlance-DatasetResearch/1.0',
                })
                with urlopen(request, timeout=20) as response:
                    expected = f'bytes {self.offset+start}-{self.offset+end}/'
                    if response.status != 206 or not response.headers.get('Content-Range', '').startswith(expected):
                        raise ValueError('Dataset host returned an unexpected byte range')
                    data = response.read(end - start + 2)
                    # Reuse the publisher's resolved download URL in memory.
                    # It can be signed; never persist it or include it in logs.
                    resolved_url = response.geturl()
                if len(data) != end - start + 1:
                    raise ValueError('Dataset range was truncated')
                self.url = resolved_url
                return data
            except HTTPError as error:
                if error.code == 403 and self.refresh_url is not None and attempt < 3:
                    self.source_url = self.url = self.refresh_url()
                    continue
                if error.code == 403 and self.url != self.source_url and attempt < 3:
                    self.url = self.source_url
                    continue
                if error.code not in (429, 500, 502, 503, 504) or attempt == 3:
                    raise
                time.sleep(min(30, float(error.headers.get('Retry-After', 2 ** attempt))))
            except (TimeoutError, ConnectionError, URLError):
                if attempt == 3:
                    raise
                self.url = self.source_url
                time.sleep(2 ** attempt)
        raise RuntimeError('Dataset host did not complete the range request')

    def read_exact_at(self, position, length):
        if position < 0 or length < 0:
            raise ValueError('Negative dataset range')
        count = min(length, max(0, self.size - position))
        return self.fetch_range(position, position + count - 1) if count else b''

    def read_at(self, position, length):
        remaining = min(length, max(0, self.size - position))
        output = []
        while remaining:
            index, within = divmod(position, self.block_size)
            data = self.block(index)
            chunk = data[within:within + remaining]
            if not chunk:
                raise ValueError('Invalid dataset range')
            output.append(chunk)
            position += len(chunk)
            remaining -= len(chunk)
        return b''.join(output)

    def read(self, size=-1):
        if size < 0:
            size = self.size - self.position
        data = self.read_at(self.position, size)
        self.position += len(data)
        return data


def read_member(reader, info):
    if info.flag_bits & 1:
        raise ValueError('Encrypted dataset members require their publisher access mechanism')
    header = reader.read_at(info.header_offset, 30)
    fields = struct.unpack('<4s5H3L2H', header)
    if fields[0] != b'PK\x03\x04':
        raise ValueError('Invalid dataset member header')
    start = info.header_offset + 30 + fields[-2] + fields[-1]
    data = reader.read_at(start, info.compress_size)
    if info.compress_type == zipfile.ZIP_DEFLATED:
        data = zlib.decompress(data, -15)
    elif info.compress_type != zipfile.ZIP_STORED:
        raise ValueError('Unsupported dataset ZIP compression')
    if len(data) != info.file_size or zlib.crc32(data) & 0xffffffff != info.CRC:
        raise ValueError('Dataset member checksum did not match')
    return data


class MultipartRangeReader(io.RawIOBase):
    """Seek over a ZIP the publisher split into consecutive download parts."""

    def __init__(self, readers):
        self.readers = readers
        self.starts = [0]
        for reader in readers:
            self.starts.append(self.starts[-1] + reader.size)
        self.size = self.starts[-1]
        self.position = 0

    def seekable(self):
        return True

    def readable(self):
        return True

    def tell(self):
        return self.position

    def seek(self, offset, whence=0):
        position = (0, self.position, self.size)[whence] + offset
        if position < 0:
            raise ValueError('Negative dataset archive offset')
        self.position = position
        return position

    def read_at(self, position, length):
        return self._read_at(position, length, exact=False)

    def read_exact_at(self, position, length):
        return self._read_at(position, length, exact=True)

    def _read_at(self, position, length, exact):
        if position < 0 or length < 0:
            raise ValueError('Negative dataset range')
        remaining = min(length, max(0, self.size - position))
        result = []
        while remaining:
            index = bisect_right(self.starts, position) - 1
            within = position - self.starts[index]
            count = min(remaining, self.readers[index].size - within)
            source = self.readers[index]
            result.append((source.read_exact_at if exact else source.read_at)(within, count))
            remaining -= count
            position += count
        return b''.join(result)

    def read(self, size=-1):
        if size < 0:
            size = self.size - self.position
        data = self.read_at(self.position, size)
        self.position += len(data)
        return data


def read_indexed_member(reader, member):
    """Fetch a small indexed member without overfetching entire 4 MB blocks.

    Local ZIP extra fields are at most 65,535 bytes. This bounds the one-range
    read even though the cached central index did not retain their lengths.
    """
    limit = 30 + len(member['name'].encode('utf-8')) + 65535 + member['compressed']
    payload = reader.read_exact_at(member['offset'], limit)
    fields = struct.unpack('<4s5H3L2H', payload[:30])
    info = zipfile.ZipInfo(member['name'])
    info.header_offset = 0
    info.flag_bits, info.compress_type = fields[2:4]
    info.file_size, info.compress_size, info.CRC = member['size'], member['compressed'], member['crc32']

    class MemberBuffer:
        def read_at(self, position, length):
            return payload[position:position + length]

    return read_member(MemberBuffer(), info)
