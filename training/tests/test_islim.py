"""Check adapter equivalence against the inspected public preprocessing source."""
import ast
from pathlib import Path
import unittest
import numpy as np
import torch
from training.benchmark_islim import fill_and_normalize, CACHE


class ISLiMCompatibilityTests(unittest.TestCase):
    def test_rejects_corrupt_or_empty_features(self):
        for values in (np.empty((0, 94, 4)), np.full((3, 94, 4), np.nan), np.zeros((3, 95, 4))):
            with self.assertRaises(ValueError):
                fill_and_normalize(values)

    def test_publisher_preprocessing_equivalence(self):
        source = CACHE / 'islim-source'
        if not source.exists():
            self.skipTest('Optional publisher source cache unavailable')
        namespace = {'np': np, 'torch': torch, 'MAX_MISSING_CONSECUTIVE': 5}
        for path, name in (('scripts/preprocess/extract_keypoints.py', 'interpolate_keypoints'),
                           ('src/data/dataset.py', '_normalize_keypoints')):
            tree = ast.parse((source / path).read_text())
            function = next(node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name == name)
            # Only the inspected pure preprocessing function, no repo imports.
            exec(compile(ast.Module(body=[function], type_ignores=[]), str(source / path), 'exec'), namespace)
        random = np.random.default_rng(29)
        for count in (19, 128, 155):
            raw = random.random((count, 94, 4), dtype=np.float32)
            raw[:, :, 3] = (raw[:, :, 3] > .2).astype(np.float32)
            raw[:3, :10] = 0
            raw[6:13, 20:30] = 0
            expected = namespace['interpolate_keypoints'](raw.copy()).astype(np.float16).astype(np.float32)
            expected, frames = namespace['_normalize_keypoints'](expected, 128)
            actual, actual_frames = fill_and_normalize(raw)
            np.testing.assert_allclose(actual, expected, atol=1e-7)
            self.assertEqual(actual_frames, frames)


if __name__ == '__main__':
    unittest.main()
