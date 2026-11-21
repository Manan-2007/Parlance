"""Resume the author's public checkpoint with validated bounded HTTP ranges."""
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import json
from pathlib import Path
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from training.archive import HTTPRangeReader

CACHE = ROOT / '.research-cache/islim-model'
URL = 'https://drive.usercontent.google.com/download?id=1mZtXateoZn_3T1T4Lc3yowMvB0jWm9EX&export=download&confirm=t'
SIZE = 899966348
BLOCK = 16 * 1024 * 1024


def fetch(index):
    target = CACHE / 'parts' / f'{index:04}'
    start = index * BLOCK
    length = min(BLOCK, SIZE - start)
    if target.exists() and target.stat().st_size == length:
        return target
    data = HTTPRangeReader(URL, SIZE).read_exact_at(start, length)
    temporary = target.with_suffix('.partial')
    temporary.write_bytes(data)
    temporary.replace(target)
    return target


def main():
    CACHE.mkdir(exist_ok=True)
    target = CACHE / 'ISLiM_full_posestitch_pre_processed.pt'
    if target.exists() and target.stat().st_size == SIZE:
        print('CHECKPOINT_ALREADY_CACHED', flush=True)
        return
    (CACHE / 'parts').mkdir(exist_ok=True)
    count = (SIZE + BLOCK - 1) // BLOCK
    print(f'CHECKPOINT_DOWNLOAD_STARTED bytes={SIZE} parts={count}', flush=True)
    with ThreadPoolExecutor(max_workers=3) as pool:
        done = 0
        for future in as_completed([pool.submit(fetch, index) for index in range(count)]):
            future.result()
            done += 1
            if done % 5 == 0 or done == count:
                print(f'CHECKPOINT_PARTS {done}/{count}', flush=True)
    digest = hashlib.sha256()
    temporary = target.with_suffix('.partial')
    with temporary.open('wb') as output:
        for index in range(count):
            with (CACHE / 'parts' / f'{index:04}').open('rb') as part:
                while chunk := part.read(1024 * 1024):
                    output.write(chunk)
                    digest.update(chunk)
    if temporary.stat().st_size != SIZE:
        raise ValueError('Checkpoint size mismatch')
    with zipfile.ZipFile(temporary) as archive:
        if archive.testzip() is not None:
            raise ValueError('Checkpoint ZIP checksum mismatch')
    temporary.replace(target)
    (CACHE / 'provenance.json').write_text(json.dumps({'publisher': 'https://github.com/ahmedshoaib/ISLiM',
        'download': URL, 'size': SIZE, 'sha256': digest.hexdigest(), 'zipCRCValidated': True,
        'checksumScope': 'Locally computed content hash; publisher did not supply a SHA256'}, indent=2))
    for part in (CACHE / 'parts').iterdir():
        part.unlink()
    (CACHE / 'parts').rmdir()
    print('CHECKPOINT_DOWNLOAD_COMPLETE sha256=' + digest.hexdigest(), flush=True)


if __name__ == '__main__':
    main()
