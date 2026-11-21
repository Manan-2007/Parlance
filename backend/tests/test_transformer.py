"""The ISL transformer and the hybrid recognizer, when onnxruntime is installed."""
from pathlib import Path
import unittest

import numpy as np

from backend.model import TemporalForest
from backend.recognition import RecognitionSession

MODELS = Path(__file__).parents[1] / "models"
try:
    from backend.hybrid import HybridRecognizer
    from backend.transformer import TransformerRecognizer, available
    INSTALLED = available(MODELS)
except ImportError:  # onnxruntime missing
    INSTALLED = False


@unittest.skipUnless(INSTALLED, "onnxruntime or the transformer model is not installed")
class TransformerTests(unittest.TestCase):
    def setUp(self):
        self.model = TransformerRecognizer(MODELS)

    def test_reserves_class_zero_for_no_sign_and_scores_padded_batches(self):
        self.assertEqual(self.model.labels[0], "__NONE__")
        rng = np.random.default_rng(0)
        windows = [rng.normal(size=(n, 135)).astype(np.float32) for n in (5, 9, 17)]
        together = self.model.scores(windows)
        alone = np.stack([self.model.scores([w])[0] for w in windows])
        np.testing.assert_allclose(together, alone, atol=1e-5)
        np.testing.assert_allclose(together.sum(1), 1, atol=1e-5)

    def test_decides_on_the_longest_window(self):
        rng = np.random.default_rng(1)
        windows = [rng.normal(size=(n, 135)).astype(np.float32) for n in (5, 12, 30)]
        longest = self.model.predict(windows[-1:], self.model.threshold)
        self.assertEqual(self.model.predict(windows, self.model.threshold)["candidate"], longest["candidate"])

    def test_tampered_weights_are_refused(self):
        import json, shutil, tempfile
        with tempfile.TemporaryDirectory() as folder:
            for name in ("isl-transformer.onnx", "isl-transformer.json"):
                shutil.copy(MODELS / name, Path(folder) / name)
            meta = json.loads((Path(folder) / "isl-transformer.json").read_text())
            meta["sha256"] = "0" * 64
            (Path(folder) / "isl-transformer.json").write_text(json.dumps(meta))
            with self.assertRaises(ValueError):
                TransformerRecognizer(Path(folder))

    def test_hybrid_never_auto_commits_forest_only_words(self):
        hybrid = HybridRecognizer(self.model, TemporalForest(MODELS))
        self.assertIn("sorry", hybrid.forest_only)
        self.assertFalse(hybrid.forest_only & {w for w in hybrid.automatic})
        session = RecognitionSession(hybrid)
        vector = [0.0] * 141
        for joint in range(21):
            vector[joint * 3:joint * 3 + 3] = [0.4 + joint * 0.003, 0.5 - joint * 0.005, joint * 0.001]
        now = 0.0
        for _ in range(20):
            now += 100
            result = session.feed(vector, now)
            if "word" in result:
                self.assertNotIn(result["word"], hybrid.forest_only)


if __name__ == "__main__":
    unittest.main()
