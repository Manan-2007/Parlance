import unittest
import numpy as np

from training.benchmark_local_candidates import summarize
from training.pose_templates import mirror_tracks, template_features, dtw_distance
from training.openhands_candidate import normalize_tracks


class CandidateBenchmarkTests(unittest.TestCase):
    def test_summary_penalizes_wrong_acceptances_and_does_not_reward_rejecting_everything(self):
        records = [
            {'id': 'a', 'expected': 'book', 'kind': 'known', 'split': 'challenge'},
            {'id': 'b', 'expected': 'chair', 'kind': 'known', 'split': 'challenge'},
            {'id': 'c', 'expected': 'red', 'kind': 'unknown', 'split': 'challenge'},
        ]
        predictions = [{'id': 'a', 'prediction': 'book', 'clipInferenceMs': 1},
                       {'id': 'b', 'prediction': 'book', 'clipInferenceMs': 2},
                       {'id': 'c', 'prediction': 'book', 'clipInferenceMs': 3}]
        metrics = summarize(records, predictions)['challenge']
        self.assertEqual(metrics['knownAccuracy'], .5)
        self.assertAlmostEqual(metrics['acceptedPrecision'], 1/3)
        rejected = [{**item, 'prediction': 'UNKNOWN'} for item in predictions]
        metrics = summarize(records, rejected)['challenge']
        self.assertEqual(metrics['knownAccuracy'], 0)
        self.assertIsNone(metrics['acceptedPrecision'])

    def test_dtw_handles_timing_repetition_without_inventing_similarity(self):
        sequence = np.asarray([[0, 0], [1, 2], [3, 1]], dtype=np.float32)
        self.assertEqual(dtw_distance(sequence, np.repeat(sequence, 2, axis=0)), 0)
        self.assertGreater(dtw_distance(sequence, sequence + 2), 0)
        with self.assertRaises(ValueError):
            dtw_distance(sequence[:0], sequence)

    def test_mirroring_twice_preserves_tracks_and_confidences(self):
        rng = np.random.default_rng(4)
        points, scores = rng.random((4, 75, 3)), rng.random((4, 75))
        mirror, mirrored_scores = mirror_tracks(points, scores)
        restored, restored_scores = mirror_tracks(mirror, mirrored_scores)
        np.testing.assert_allclose(points, restored)
        np.testing.assert_array_equal(scores, restored_scores)

    def test_template_geometry_is_independent_of_image_aspect(self):
        rng = np.random.default_rng(8)
        points = rng.uniform(.3, .7, (5, 75, 3)).astype(np.float32)
        points[:, 11, :2], points[:, 12, :2] = (.6, .4), (.3, .4)
        scores = np.ones((5, 75), dtype=np.float32)
        wide = points.copy()
        wide[:, :, [0, 2]] /= 16/9
        np.testing.assert_allclose(template_features(points, scores, 1), template_features(wide, scores, 16/9), atol=2e-6)

    def test_publisher_model_adapter_reproduces_verified_swapped_pixel_convention(self):
        rng = np.random.default_rng(9)
        normalized = rng.uniform(.3, .7, (6, 75, 3)).astype(np.float32)
        normalized[:, 11, :2], normalized[:, 12, :2] = (.6, .4), (.3, .4)
        stored = normalized.copy()
        stored[:, :, :2] *= [1080, 1920]
        np.testing.assert_allclose(normalize_tracks(stored).numpy(), normalize_tracks(normalized, aspect=16/9).numpy(), atol=2e-6)


if __name__ == '__main__':
    unittest.main()
