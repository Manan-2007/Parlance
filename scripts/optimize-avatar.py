"""Resize and deduplicate embedded GLB textures without changing skin/joint data."""
import argparse
import hashlib
import io
import json
from pathlib import Path
import struct
from PIL import Image

parser=argparse.ArgumentParser()
parser.add_argument('source',type=Path);parser.add_argument('destination',type=Path)
parser.add_argument('--non-pbr',action='store_true');args=parser.parse_args()
source=args.source.read_bytes()
if source[:4]!=b'glTF':raise ValueError('Expected a binary glTF')
json_length=struct.unpack_from('<I',source,12)[0]
data=json.loads(source[20:20+json_length]);original=source[28+json_length:]
images={image['bufferView']:image for image in data.get('images',[])}
converted={};packed={};buffer=bytearray()
for index,view in enumerate(data['bufferViews']):
    offset=view.get('byteOffset',0);payload=original[offset:offset+view['byteLength']]
    image=images.get(index)
    if image is not None:
        fingerprint=hashlib.sha256(payload).digest()
        if fingerprint not in converted:
            pixels=Image.open(io.BytesIO(payload)).convert('RGBA')
            pixels.thumbnail((1024,1024),Image.Resampling.LANCZOS)
            out=io.BytesIO()
            if pixels.getchannel('A').getextrema()[0]==255:
                pixels.convert('RGB').save(out,'JPEG',quality=92,subsampling=0,optimize=True)
                mime='image/jpeg'
            else:
                pixels.save(out,'PNG',optimize=True);mime='image/png'
            converted[fingerprint]=(out.getvalue(),mime)
        payload,mime=converted[fingerprint];image['mimeType']=mime
        if fingerprint in packed:
            view['byteOffset'],view['byteLength']=packed[fingerprint];continue
    buffer.extend(b'\0'*(-len(buffer)%4));view['byteOffset']=len(buffer);view['byteLength']=len(payload)
    buffer.extend(payload)
    if image is not None:packed[fingerprint]=(view['byteOffset'],view['byteLength'])
if args.non_pbr:
    for material in data.get('materials',[]):
        pbr=material.setdefault('pbrMetallicRoughness',{})
        pbr['metallicFactor']=0
        pbr['roughnessFactor']=.8
buffer.extend(b'\0'*(-len(buffer)%4));data['buffers'][0]['byteLength']=len(buffer)
encoded=json.dumps(data,separators=(',',':')).encode();encoded+=b' '*(-len(encoded)%4)
result=struct.pack('<4sII',b'glTF',2,28+len(encoded)+len(buffer))
result+=struct.pack('<I4s',len(encoded),b'JSON')+encoded
result+=struct.pack('<I4s',len(buffer),b'BIN\0')+buffer
args.destination.parent.mkdir(parents=True,exist_ok=True);args.destination.write_bytes(result)
print(f'Avatar packaged: {len(source):,} -> {len(result):,} bytes')
