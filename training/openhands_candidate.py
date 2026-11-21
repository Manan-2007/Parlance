"""Inference adapter for the publisher's Apache-2.0 OpenHands SL-GCN model.

Loads only the inference modules from the recorded research checkout, avoiding
an unrelated training-framework install. Publisher model code is not modified.
"""
import csv
import hashlib
import importlib.util
from pathlib import Path
import re
import sys
import types

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.research-cache'
sys.path.insert(0, str(CACHE / 'python'))

import numpy as np
import torch
from torch import nn
from omegaconf import OmegaConf

SELECT = [0, 2, 5, 11, 12, 13, 14, 33, 37, 38, 41, 42, 45, 46, 49, 50, 53, 54, 58, 59, 62, 63, 66, 67, 70, 71, 74]
EDGES = [[2,0],[1,0],[0,3],[0,4],[3,5],[4,6],[5,7],[6,17],[7,8],[7,9],[9,10],[7,11],[11,12],
         [7,13],[13,14],[7,15],[15,16],[17,18],[17,19],[19,20],[17,21],[21,22],[17,23],[23,24],[17,25],[25,26]]


def word_key(word):
    return re.sub('[^a-z0-9]', '', word.lower())


def load_publisher_model(source):
    source = Path(source)
    package = 'parlance_openhands_eval'
    graph = source / 'openhands/models/encoder/graph'
    module = types.ModuleType(package)
    module.__path__ = [str(graph)]
    sys.modules[package] = module
    spec = importlib.util.spec_from_file_location(package + '.decoupled_gcn', graph / 'decoupled_gcn.py')
    code = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = code
    spec.loader.exec_module(code)
    return code.DecoupledGCN


def normalize_tracks(keypoints, aspect=None):
    points = np.asarray(keypoints, dtype=np.float32)[:, SELECT, :2].copy()
    if aspect is not None:
        # Source pickles multiply normalized x by H and y by W. Reproduce their
        # resulting anisotropy after matching the native camera aspect ratio.
        # Constant letterbox translation vanishes in the clip centering below.
        points[:, :, 0] *= aspect / (16 / 9) ** 2
    center = ((points[:, 3] + points[:, 4]) / 2).mean(axis=0)
    distance = np.linalg.norm(points[:, 3] - points[:, 4], axis=1).mean()
    if distance > 1e-8:
        points = (points - center) / distance
    return torch.from_numpy(points.transpose(2, 0, 1).copy()).unsqueeze(0)


class OpenHandsCandidate(nn.Module):
    def __init__(self, source):
        super().__init__()
        source = Path(source)
        if not (source / 'LICENSE.txt').exists():
            raise ValueError('Publisher license is missing')
        with (CACHE / 'openhands/Train_Test_Split/train_include.csv').open() as file:
            rows = list(csv.DictReader(file))
        original_labels = sorted({row['Word'] for row in rows})
        self.labels = [re.sub(r'^\d+\.\s*', '', label).strip() for label in original_labels]
        self.source_label_index = {(word_key(row['Category']), word_key(re.sub(r'^\d+\.\s*', '', row['Word']))): original_labels.index(row['Word']) for row in rows}
        model_type = load_publisher_model(source)
        self.encoder = model_type(2, OmegaConf.create({'num_nodes': 27, 'inward_edges': EDGES}))
        self.classifier = nn.Linear(256, len(self.labels))
        checkpoint = CACHE / 'openhands/include/sl_gcn/state_dict.pt'
        state = torch.load(checkpoint, weights_only=True, map_location='cpu')
        self.encoder.load_state_dict({key.removeprefix('model.encoder.'): value for key, value in state.items() if key.startswith('model.encoder.')})
        self.classifier.load_state_dict({key.removeprefix('model.decoder.classifier.'): value for key, value in state.items() if key.startswith('model.decoder.classifier.')})
        self.provenance = {'publisher': 'https://github.com/AI4Bharat/OpenHands', 'license': 'Apache-2.0',
            'checkpointSha256': hashlib.sha256(checkpoint.read_bytes()).hexdigest(),
            'inferenceSourceSha256': hashlib.sha256((source / 'openhands/models/encoder/graph/decoupled_gcn.py').read_bytes()).hexdigest()}
        self.eval()

    def forward(self, frames):
        return self.classifier(self.encoder(frames))
