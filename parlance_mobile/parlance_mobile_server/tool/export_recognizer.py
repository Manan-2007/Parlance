"""Exports Parlance's sign recogniser for the Dart port in lib/src/recognition.

Writes to assets/recognition/:
  transformer.bin   float32 little-endian weights of every ensemble member
  transformer.json  the shipped model's metadata (labels, gates, timings) plus
                    the members' shapes and a tensor index into transformer.bin
  forest.bin/.json  the temporal forest, copied unchanged
And to test/fixtures/recognition_model.json: synthetic windows with the
reference ensemble probabilities, so the Dart forward pass can be checked.

The weights come from the training checkpoints, which are first checked to
produce the same logits as the shipped backend/models/isl-transformer.onnx.

  python3 parlance_mobile/parlance_mobile_server/tool/export_recognizer.py   (from the repo root)
"""
import hashlib
import json
import shutil
import sys
from pathlib import Path

import numpy as np
import onnxruntime
import torch

ISL = Path.cwd()
sys.path.insert(0, str(ISL))
from training.train_isl_transformer import load_model  # noqa: E402

SERVER = Path(__file__).resolve().parent.parent
OUT = SERVER / 'assets' / 'recognition'
MODELS = ISL / 'backend' / 'models'
RUN = ISL / '.research-cache' / 'isl-transformer' / 'incens'


def main():
    meta = json.loads((MODELS / 'isl-transformer.json').read_text())
    onnx = (MODELS / 'isl-transformer.onnx').read_bytes()
    assert hashlib.sha256(onnx).hexdigest() == meta['sha256'], 'shipped model changed'
    model, checkpoint = load_model(torch.device('cpu'), RUN)
    assert checkpoint['classes'] == meta['labels'], 'checkpoint labels differ from the shipped model'

    session = onnxruntime.InferenceSession(onnx, providers=['CPUExecutionProvider'])
    rng = np.random.default_rng(7)
    windows = []
    for length in (5, 9, 20, 33, 48):
        features = rng.normal(scale=0.6, size=(1, length, 135)).astype(np.float32)
        mask = np.ones((1, length), np.float32)
        ours = model(torch.from_numpy(features), torch.from_numpy(mask)).detach().numpy()
        shipped = session.run(['logits'], {'features': features, 'mask': mask})[0]
        assert np.abs(ours - shipped).max() < 1e-4, 'checkpoints do not match the shipped model'
        logits = shipped[0] / meta['temperature']
        probs = np.exp(logits - logits.max())
        probs /= probs.sum()
        windows.append({'features': features[0].round(6).tolist(), 'probabilities': probs.astype(float).tolist()})

    members, tensors, blobs, offset = [], [], [], 0
    for index, member in enumerate(model.members):
        state = member.state_dict()
        dim = state['stem.0.weight'].shape[0]
        depth = len([k for k in state if k.endswith('.qkv.weight')])
        members.append({'dim': dim, 'depth': depth, 'heads': member.layers[2].heads})
        for name, value in state.items():
            array = value.detach().numpy().astype('<f4').ravel()
            tensors.append({'member': index, 'name': name, 'shape': list(value.shape), 'offset': offset})
            blobs.append(array.tobytes())
            offset += array.size

    OUT.mkdir(parents=True, exist_ok=True)
    binary = b''.join(blobs)
    (OUT / 'transformer.bin').write_bytes(binary)
    exported = {key: value for key, value in meta.items() if key not in ('evaluation', 'training')}
    exported.update(members=members, tensors=tensors, weightsSha256=hashlib.sha256(binary).hexdigest(),
                    layerNormEps=1e-5, convKernel=11, source='parlance-isl/backend/models/isl-transformer.onnx')
    (OUT / 'transformer.json').write_text(json.dumps(exported))
    shutil.copy(MODELS / 'isl-temporal-forest.bin', OUT / 'forest.bin')
    shutil.copy(MODELS / 'isl-temporal-model.json', OUT / 'forest.json')

    fixtures = SERVER / 'test' / 'fixtures'
    fixtures.mkdir(parents=True, exist_ok=True)
    (fixtures / 'recognition_model.json').write_text(json.dumps({'windows': windows}))
    print(json.dumps({'members': members, 'weights': offset, 'bytes': len(binary)}))


if __name__ == '__main__':
    main()
