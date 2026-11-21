import unittest

import numpy as np
import torch

from training.adapt_motion import mask_coordinates, masked_loss, MotionModel


class AdaptationTests(unittest.TestCase):
    def test_masking_preserves_visibility_and_masks_global_and_local_hand_coordinates(self):
        rng = np.random.default_rng(7)
        frames = rng.normal(size=(64, 369)).astype(np.float32)
        points = frames[:, :285].reshape(64, 95, 3)
        points[:, :, 2] = 1
        points[:, 53] = 0
        original = frames.copy()
        corrupted, target, weights = mask_coordinates(frames, np.random.default_rng(2))
        np.testing.assert_array_equal(target, original)
        np.testing.assert_array_equal(frames, original)
        np.testing.assert_array_equal(corrupted[:, 2:285:3], original[:, 2:285:3])
        self.assertFalse(weights[:, 2:285:3].any())
        self.assertFalse(weights[:, 53 * 3:53 * 3 + 3].any())
        self.assertTrue(np.all(corrupted[weights > 0] == 0))
        self.assertGreater(float(weights.sum()), 0)
        global_hand_mask = weights[:, :285].reshape(64, 95, 3)[:, 53:74, 0] > 0
        local_hand_mask = weights[:, 285:327].reshape(64, 21, 2)[:, :, 0] > 0
        np.testing.assert_array_equal(global_hand_mask, local_hand_mask)

    def test_joint_loss_updates_encoder_and_both_heads(self):
        torch.set_num_threads(2)
        torch.manual_seed(4)
        model = MotionModel(5)
        frames = torch.randn(2, 16, 369)
        target = torch.randn_like(frames)
        weights = torch.ones_like(frames)
        loss = masked_loss(model.masked_prediction(frames), target, weights)
        loss = loss + torch.nn.CrossEntropyLoss()(model(frames), torch.tensor([1, 3]))
        loss.backward()
        for parameter in [model.encoder.project[0].weight, model.reconstruct.weight, model.classifier.weight]:
            self.assertTrue(torch.isfinite(parameter.grad).all())
            self.assertGreater(float(parameter.grad.abs().sum()), 0)


if __name__ == '__main__':
    unittest.main()
