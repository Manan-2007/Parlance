import sys
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / '.research-cache' / 'python'))
sys.path.insert(0, str(ROOT))
import numpy as np
import torch

from backend.model import frame_features
from training.isl_transformer import SignTransformer, torch_frame_features


def random_frame(rng, hands):
    points = np.zeros((2, 21, 3), dtype=np.float32)
    for slot in hands:
        wrist = rng.uniform(0.2, 0.8, size=3) * [1, 1, 0]
        points[slot] = wrist + rng.normal(0, 0.05, size=(21, 3))
        points[slot, 0] = wrist
    return points


class FeatureParity(unittest.TestCase):
    def test_matches_backend_frame_features(self):
        rng = np.random.default_rng(3)
        frames = [random_frame(rng, hands) for hands in ([0], [1], [0, 1], [], [1, 0]) for _ in range(20)]
        expected = np.stack([frame_features(np.concatenate((f.reshape(-1), np.zeros(15)))) for f in frames])
        actual = torch_frame_features(torch.from_numpy(np.stack(frames))).numpy()
        np.testing.assert_allclose(actual, expected, atol=1e-5)

    def test_padding_does_not_change_logits(self):
        torch.manual_seed(0)
        model = SignTransformer(7).eval()
        features = torch.randn(1, 12, 135)
        mask = torch.ones(1, 12)
        padded = torch.cat((features, torch.randn(1, 8, 135)), 1)
        padded_mask = torch.cat((mask, torch.zeros(1, 8)), 1)
        with torch.no_grad():
            np.testing.assert_allclose(model(features, mask).numpy(), model(padded, padded_mask).numpy(), atol=1e-4)


if __name__ == '__main__':
    unittest.main()
