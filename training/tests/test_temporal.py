import unittest
from types import SimpleNamespace

import numpy as np
import torch

from training.decoding import collapse_ctc, corpus_metrics, edit_counts
from training.features import normalize_frame, isign_frames, include_frames
from training.network import ContinuousRecognizer


class TemporalTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        torch.set_num_threads(2)

    def test_future_frames_cannot_change_emitted_prefix(self):
        torch.manual_seed(3)
        model = ContinuousRecognizer(7).eval()
        frames = torch.randn(1, 45, 369)
        with torch.inference_mode():
            prefix = model(frames[:, :23])
            full = model(frames)
        torch.testing.assert_close(prefix, full[:, :23], atol=1e-6, rtol=1e-5)

    def test_ctc_loss_has_finite_encoder_gradients(self):
        model = ContinuousRecognizer(4)
        frames = torch.randn(2, 12, 369)
        targets = torch.tensor([1, 2, 2, 2, 3])
        logits = model(frames).log_softmax(-1).transpose(0, 1)
        loss = torch.nn.CTCLoss()(logits, targets, torch.tensor([12, 9]), torch.tensor([2, 3]))
        loss.backward()
        gradient = model.encoder.project[0].weight.grad
        self.assertTrue(torch.isfinite(loss))
        self.assertTrue(torch.isfinite(gradient).all())
        self.assertGreater(float(gradient.abs().sum()), 0)

    def test_ctc_blank_separates_repeated_words(self):
        self.assertEqual(collapse_ctc([0, 2, 2, 0, 2, 3, 3, 0]), [2, 2, 3])
        self.assertEqual(collapse_ctc([0, 0]), [])

    def test_error_accounting_handles_insertions_deletions_repetitions(self):
        self.assertEqual(edit_counts(['I', 'NEED', 'WATER'], ['I', 'WANT', 'WATER']), (1, 0, 0))
        self.assertEqual(edit_counts(['YOU', 'YOU'], ['YOU']), (0, 1, 0))
        self.assertEqual(edit_counts([], ['HELLO']), (0, 0, 1))
        metrics = corpus_metrics([[1, 2], [3]], [[1], [3, 4]])
        self.assertAlmostEqual(metrics['wordErrorRate'], 2 / 3)
        self.assertEqual(metrics['sequenceAccuracy'], 0)

    def test_normalization_is_translation_and_scale_invariant(self):
        rng = np.random.default_rng(9)
        raw = np.column_stack((rng.uniform(.3, .6, (95, 2)), np.ones(95))).astype(np.float32)
        raw[11, :2], raw[12, :2] = (.4, .4), (.6, .4)
        transformed = raw.copy()
        transformed[:, :2] = raw[:, :2] * .7 + .1
        np.testing.assert_allclose(normalize_frame(raw, 16/9), normalize_frame(transformed, 16/9), atol=2e-6)

    def test_missing_shoulders_never_create_fake_motion(self):
        raw = np.ones((95, 3), dtype=np.float32)
        raw[11, 2] = 0
        self.assertFalse(normalize_frame(raw, 16/9).any())

    def test_include_publisher_pixel_scaling_matches_live_camera_geometry(self):
        rng = np.random.default_rng(20)
        normalized = rng.uniform(.25, .75, (75, 3)).astype(np.float32)
        normalized[11, :2], normalized[12, :2] = (.6, .4), (.4, .4)
        height, width = 1080, 1920
        stored = normalized.copy()
        stored[:, :2] *= [height, width]  # Verified publisher convention.
        scores = np.ones((1, 75), dtype=np.float32)
        raw = np.zeros((95, 3), dtype=np.float32)
        raw[:33, :2] = normalized[:33, :2]
        raw[:33, 2] = 1
        raw[53:95, :2] = normalized[33:75, :2]
        raw[53:95, 2] = 1
        actual = include_frames(stored[None], scores, (height, width))[0]
        expected = normalize_frame(raw, width / height)
        np.testing.assert_allclose(actual, expected, atol=2e-6)

    def test_isign_pixel_coordinates_match_live_normalization_and_keep_timestamps(self):
        rng = np.random.default_rng(4)
        raw = np.column_stack((rng.uniform(.3, .6, (95, 2)), np.ones(95))).astype(np.float32)
        raw[11, :2], raw[12, :2] = (.4, .4), (.6, .4)
        data = np.zeros((3, 1, 576, 3), dtype=np.float32)
        scores = np.ones((3, 1, 576), dtype=np.float32)
        from training.features import FACE_POINTS
        for source, positions in ((slice(0, 33), np.arange(33)),
                                  (slice(33, 53), np.asarray(FACE_POINTS) + 33),
                                  (slice(53, 74), np.arange(501, 522)),
                                  (slice(74, 95), np.arange(522, 543))):
            data[:, 0, positions, :2] = raw[source, :2] * np.asarray([640, 360])
        data[:, :, 543:, :] = 99999  # World-coordinate component must be ignored.
        pose = SimpleNamespace(
            header=SimpleNamespace(dimensions=SimpleNamespace(width=640, height=360), components=[
                SimpleNamespace(name=name, points=list(range(size))) for name, size in
                [('POSE_LANDMARKS', 33), ('FACE_LANDMARKS', 468), ('LEFT_HAND_LANDMARKS', 21),
                 ('RIGHT_HAND_LANDMARKS', 21), ('POSE_WORLD_LANDMARKS', 33)]]),
            body=SimpleNamespace(data=data, confidence=scores, fps=25))
        frames, timestamps = isign_frames(pose, max_frames=2)
        np.testing.assert_allclose(frames[0], normalize_frame(raw, 640/360), atol=2e-6)
        np.testing.assert_array_equal(timestamps, [0, 80])
        pose.body.fps = 0
        with self.assertRaises(ValueError):
            isign_frames(pose)


if __name__ == '__main__':
    unittest.main()
