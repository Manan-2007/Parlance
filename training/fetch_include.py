"""Fetch the official INCLUDE pose archive with resumable HTTP ranges.

The publisher identifies this archive by MD5. The complete archive is checked
before any training data is read. Downloads stay in the ignored research cache.
"""
import concurrent.futures
import hashlib
from pathlib import Path
import time

import httpx

URL = 'https://zenodo.org/records/6674324/files/INCLUDE.zip?download=1'
SIZE = 662887244
MD5 = 'f99f6f3ea50d5d94e0ffae44130a6672'
ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.research-cache'


def checksum(path):
    digest = hashlib.md5()
    with path.open('rb') as source:
        while chunk := source.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def main():
    CACHE.mkdir(exist_ok=True)
    target = CACHE / 'INCLUDE.zip'
    if target.exists() and target.stat().st_size == SIZE:
        if checksum(target) != MD5:
            raise RuntimeError('The existing archive checksum is invalid')
        print('INCLUDE archive verified', flush=True)
        return
    prefix_size = target.stat().st_size if target.exists() else 0
    parts = []
    block = 16 * 1024 * 1024
    for start in range(prefix_size, SIZE, block):
        end = min(SIZE, start + block) - 1
        parts.append((start, end, CACHE / f'include-range-{start}-{end}.part'))

    def fetch(part):
        start, end, path = part
        expected = end - start + 1
        if path.exists() and path.stat().st_size == expected:
            return
        temporary = path.with_suffix('.downloading')
        with httpx.Client(follow_redirects=True, timeout=90) as client:
            for attempt in range(4):
                try:
                    with client.stream('GET', URL, headers={'Range': f'bytes={start}-{end}'}) as response:
                        if response.status_code == 429:
                            time.sleep(min(30, float(response.headers.get('Retry-After', '10'))))
                            continue
                        response.raise_for_status()
                        if response.status_code != 206 or not response.headers.get('Content-Range', '').startswith(f'bytes {start}-{end}/'):
                            raise RuntimeError('Dataset server returned an unexpected byte range')
                        with temporary.open('wb') as output:
                            for chunk in response.iter_bytes(1024 * 1024):
                                output.write(chunk)
                    if temporary.stat().st_size != expected:
                        raise RuntimeError('Dataset range was truncated')
                    temporary.replace(path)
                    return
                except (httpx.HTTPError, OSError):
                    if attempt == 3:
                        raise
                    time.sleep(2 ** attempt)
        raise RuntimeError('Dataset server is rate limiting downloads. Retry later.')

    print(f'Fetching {len(parts)} ranges, {round((SIZE-prefix_size)/1e6)} MB remaining', flush=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        for index, _ in enumerate(executor.map(fetch, parts), 1):
            if index % 4 == 0 or index == len(parts):
                print(f'Verified transfer sizes for {index}/{len(parts)} ranges', flush=True)
    with target.open('ab') as output:
        for _, _, path in parts:
            with path.open('rb') as source:
                while chunk := source.read(1024 * 1024):
                    output.write(chunk)
    if target.stat().st_size != SIZE or checksum(target) != MD5:
        raise RuntimeError('Downloaded archive failed the publisher checksum')
    for _, _, path in parts:
        path.unlink()
    print('INCLUDE pose archive downloaded and publisher checksum verified', flush=True)


if __name__ == '__main__':
    main()
