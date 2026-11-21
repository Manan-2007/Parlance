"""Verify one approved iSign pose without downloading the multipart archive."""
import json
from pathlib import Path
import struct
import sys
import zipfile
import zlib

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.research-cache'
sys.path.insert(0, str(CACHE / 'python'))
sys.path.insert(0, str(ROOT))

from huggingface_hub import get_hf_file_metadata, hf_hub_url, get_token
from pose_format import Pose
from training.archive import HTTPRangeReader, read_member


def main():
    manifest = json.loads((CACHE / 'iSign-files.json').read_text())
    member = next(item for item in json.loads((CACHE / 'iSign-pose-members.json').read_text())
                  if item['name'].endswith('.pose'))
    part = next(item for item in manifest['files'] if item['name'] == 'iSign-poses_v1.1_part_aa')
    if member['offset'] + member['compressed'] + 4096 >= part['size']:
        raise ValueError('Inspection sample must fit in the first publisher part')
    output = CACHE / 'iSign-samples'
    output.mkdir(exist_ok=True)
    target = output / Path(member['name']).name
    if not target.exists():
        # Existing approved HF login is used only in memory. Do not log signed URLs.
        metadata = get_hf_file_metadata(hf_hub_url('Exploration-Lab/iSign', part['name'],
                    repo_type='dataset', revision=manifest['commit']), token=get_token())
        reader = HTTPRangeReader(metadata.location, part['size'])
        fields = struct.unpack('<4s5H3L2H', reader.read_at(member['offset'], 30))
        info = zipfile.ZipInfo(member['name'])
        info.header_offset = member['offset']
        info.flag_bits, info.compress_type = fields[2:4]
        info.file_size, info.compress_size, info.CRC = member['size'], member['compressed'], member['crc32']
        payload = read_member(reader, info)
        temporary = target.with_suffix('.partial')
        temporary.write_bytes(payload)
        temporary.replace(target)
    payload = target.read_bytes()
    if len(payload) != member['size'] or zlib.crc32(payload) & 0xffffffff != member['crc32']:
        raise ValueError('Pose sample checksum mismatch')
    pose = Pose.read(payload)
    report = {'file': target.name, 'publisherRevision': manifest['commit'],
              'dimensions': [pose.header.dimensions.width, pose.header.dimensions.height],
              'components': [{'name': c.name, 'points': len(c.points), 'format': c.format}
                             for c in pose.header.components],
              'dataShape': list(pose.body.data.shape), 'confidenceShape': list(pose.body.confidence.shape),
              'fps': float(pose.body.fps),
              'xyRanges': [[float(pose.body.data[..., i].min()), float(pose.body.data[..., i].max())]
                           for i in range(2)]}
    (output / 'inspection.json').write_text(json.dumps(report, indent=2))
    print(json.dumps(report), flush=True)


if __name__ == '__main__':
    main()
