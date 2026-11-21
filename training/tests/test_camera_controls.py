import unittest
import numpy as np
from training.evaluate_camera_controls import decoded_timing


class CameraControlTimingTests(unittest.TestCase):
    def test_browser_variable_frame_timing_uses_pts_and_final_frame_interval(self):
        # 30 FPS-style PTS with dropped/late frames and a nonzero stream origin.
        timing = decoded_timing([400, 433, 467, 505, 600])
        self.assertAlmostEqual(timing['durationSeconds'], .236)
        self.assertEqual(timing['lastFrameIntervalMs'], 36)
        # A decoder's 1000 FPS timebase must not shrink a 20-second clip.
        pts = np.arange(600) * (1000 / 30)
        self.assertAlmostEqual(decoded_timing(pts)['durationSeconds'], 20)

    def test_ambiguous_timing_is_rejected_instead_of_fabricated(self):
        for values in ([], [0], [0, 0], [10, 5], [0, np.nan], [-1, 0]):
            with self.assertRaises(ValueError):
                decoded_timing(values)


if __name__ == '__main__':
    unittest.main()
