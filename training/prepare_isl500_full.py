"""Download every ISL500 publisher MediaPipe hand track and pack them for training.

ISL500 publishes MediaPipe hand landmarks (T, 2, 21, 3) at 30 fps for 500 words
signed by 15 publisher users. Earlier Parlance experiments used 40 of those
words. This packs all of them into one array so `train_isl_transformer.py` can
train a 500-word recognizer with a signer-disjoint split.

Output: .research-cache/isl500-full/{tracks.npy, index.json}
  tracks.npy  float16 (total_frames, 2, 21, 3), clips concatenated
  index.json  one record per clip: label, signer, offset, length, file

The file list comes from `.research-cache/ISL500-files.json` (pinned revision).
Downloads run concurrently and resume; files are fetched round-robin across
words and signers so a partial download is still balanced.

ISL500 is licensed for research and academic use; derived weights inherit that.

Run: python3 -m training.prepare_isl500_full [--pack-only] [--concurrency 96]
"""
import argparse
import asyncio
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
import itertools
import json
import os
from pathlib import Path
import shutil
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.research-cache'
sys.path.insert(0, str(CACHE / 'python'))
import h5py
import numpy as np

REVISION = 'bf1fc5a65ce5ccccdd25eba01f55558db2ccbf32'
OUT = CACHE / 'isl500-full'
RAW = OUT / 'h5'
PREFIX = 'Landmarks/MediaPipe/'


def planned_files():
    listing = json.loads((CACHE / 'ISL500-files.json').read_text())
    if listing['commit'] != REVISION:
        raise ValueError('File listing revision does not match')
    # `_mnt_..._R2_...` entries are a second export of clips under scratch-path
    # names; Yap & Render's original pipeline excluded them, and so do we.
    files = [f for f in listing['files'] if f['name'].startswith(PREFIX) and f['name'].endswith('.h5')
             and '/_mnt_' not in f['name']]
    groups = defaultdict(list)
    for f in files:
        name = f['name'].split('/')
        groups[(name[2], name[3].split('__')[0])].append(f)
    # round-robin: one clip from every (signer, word) group before the next
    ordered = [f for batch in itertools.zip_longest(*groups.values()) for f in batch if f]
    return ordered


def target(name):
    return RAW / name[len(PREFIX):]


async def download(files, concurrency):
    import aiohttp
    from huggingface_hub import get_token
    snapshot = CACHE / 'huggingface/datasets--ISL500--ISL-DATA/snapshots' / REVISION
    pending = []
    for f in files:
        path = target(f['name'])
        if path.exists() and path.stat().st_size == f['size']:
            continue
        cached = snapshot / f['name']
        if cached.exists() and cached.stat().st_size == f['size']:
            path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(cached, path)
            continue
        pending.append(f)
    print(f'DOWNLOAD {len(pending)} of {len(files)} files remaining', flush=True)
    headers = {'Authorization': f'Bearer {get_token()}'} if get_token() else {}
    queue = asyncio.Queue()
    for f in pending:
        queue.put_nowait(f)
    done, failed, started = 0, [], time.time()
    # HF allows 5000 "resolver" requests per 5 minutes; pace just under it.
    interval, next_slot = 300 / 4900, [time.monotonic()]

    async def paced():
        now = time.monotonic()
        slot = max(now, next_slot[0])
        next_slot[0] = slot + interval
        await asyncio.sleep(slot - now)

    async def worker(session):
        nonlocal done
        while True:
            try:
                f = queue.get_nowait()
            except asyncio.QueueEmpty:
                return
            url = f'https://huggingface.co/datasets/ISL500/ISL-DATA/resolve/{REVISION}/{f["name"]}'
            attempt = 0
            while attempt < 8:
                try:
                    await paced()
                    async with session.get(url, headers=headers) as response:
                        if response.status == 429:   # quota window: wait it out, not an error
                            await asyncio.sleep(float(response.headers.get('Retry-After', 60)))
                            continue
                        if response.status >= 500:
                            attempt += 1
                            await asyncio.sleep(min(60, 2 ** attempt))
                            continue
                        response.raise_for_status()
                        body = await response.read()
                    if len(body) != f['size']:
                        raise ValueError('size mismatch')
                    path = target(f['name'])
                    path.parent.mkdir(parents=True, exist_ok=True)
                    path.with_suffix('.partial').write_bytes(body)
                    path.with_suffix('.partial').replace(path)
                    break
                except Exception as error:  # network hiccup; retry with backoff
                    attempt += 1
                    if attempt == 8:
                        failed.append({'file': f['name'], 'reason': str(error)})
                    await asyncio.sleep(min(30, 2 ** attempt))
            done += 1
            if done % 1000 == 0:
                rate = done / (time.time() - started)
                print(f'DOWNLOADED {done}/{len(pending)} ({rate:.1f}/s, failed {len(failed)})', flush=True)

    timeout = aiohttp.ClientTimeout(total=120)
    async with aiohttp.ClientSession(timeout=timeout, connector=aiohttp.TCPConnector(limit=concurrency)) as session:
        await asyncio.gather(*(worker(session) for _ in range(concurrency)))
    print(f'DOWNLOAD finished, failed {len(failed)}', flush=True)
    return failed


def load(path):
    try:
        with h5py.File(path, 'r') as handle:
            points = handle['intermediate'][()]
    except Exception as error:  # corrupt or partial file
        return path, None, str(error)
    if points.ndim != 4 or points.shape[1:] != (2, 21, 3) or not np.isfinite(points).all():
        return path, None, 'unexpected shape'
    present = np.any(points != 0, axis=(1, 2, 3))
    valid = np.flatnonzero(present)
    if len(valid) < 5:
        return path, None, 'fewer than five hand frames'
    return path, points[valid[0]:valid[-1] + 1].astype(np.float16), None


def pack(files, failed):
    paths = sorted(target(f['name']) for f in files if target(f['name']).exists())
    print(f'PACKING {len(paths)} files', flush=True)
    chunks, records, rejected, offset = [], [], list(failed), 0
    with ThreadPoolExecutor(max_workers=8) as pool:
        for count, (path, points, error) in enumerate(pool.map(load, paths), 1):
            signer = path.parent.name.replace('ISL_DATA_', '')
            label = path.name.split('__')[0]
            if points is None:
                rejected.append({'file': f'{path.parent.name}/{path.name}', 'reason': error})
            else:
                chunks.append(points)
                records.append({'label': label, 'signer': signer, 'offset': offset,
                                'length': len(points), 'file': f'{path.parent.name}/{path.name}'})
                offset += len(points)
            if count % 10000 == 0:
                print(f'PACKED {count}/{len(paths)}', flush=True)
    with open(OUT / 'tracks.partial.npy', 'wb') as handle:
        np.save(handle, np.concatenate(chunks))
    os.replace(OUT / 'tracks.partial.npy', OUT / 'tracks.npy')
    (OUT / 'index.json').write_text(json.dumps({
        'revision': REVISION, 'fps': 30, 'planned': len(files), 'records': records, 'rejected': rejected,
        'license': 'ISL500 / ISL-DATA: research and academic use only'}))
    print(f'DONE clips={len(records)} rejected={len(rejected)} frames={offset}', flush=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--pack-only', action='store_true')
    parser.add_argument('--concurrency', type=int, default=32)
    args = parser.parse_args()
    OUT.mkdir(exist_ok=True)
    files = planned_files()
    failed = [] if args.pack_only else asyncio.run(download(files, args.concurrency))
    pack(files, failed)


if __name__ == '__main__':
    main()
