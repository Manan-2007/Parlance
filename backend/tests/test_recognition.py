from pathlib import Path
import json
import unittest

import numpy as np

from backend.model import TemporalForest, frame_features, temporal_embedding
from backend.recognition import RecognitionSession


def tracked_frame():
    vector = [0.0] * 141
    for joint in range(21):
        vector[joint * 3:joint * 3 + 3] = [0.4 + joint * 0.003, 0.5 - joint * 0.005, joint * 0.001]
    return vector


class FixedPredictionModel:
    threshold = 0.56

    def __init__(self, eligible=True):
        self.eligible = eligible

    def predict(self, windows, threshold):
        eligible = self.eligible and threshold <= 0.9
        return {"candidate": "hello", "confidence": 0.9, "eligible": eligible,
                "reason": "unstable" if eligible else "low-confidence",
                "candidates": [{"word": "hello", "confidence": 0.9}]}


class RecognitionTests(unittest.TestCase):
    def test_feature_adapter_preserves_hand_shapes_and_camera_wrist_locations(self):
        vector = tracked_frame()
        first = frame_features(vector)
        self.assertEqual(first.shape, (135,))
        self.assertEqual(first[126], 1)
        self.assertEqual(first[127], 0)
        np.testing.assert_allclose(first[128:130], [0.4, 0.5])
        shifted = vector.copy()
        for joint in range(21):
            shifted[joint * 3] += 0.1
        second = frame_features(shifted)
        np.testing.assert_allclose(first[:126], second[:126], atol=1e-12)
        self.assertAlmostEqual(second[128] - first[128], 0.1)

    def test_background_is_rejected_by_the_real_shipped_model(self):
        model = TemporalForest(Path(__file__).parents[1] / "models")
        window = temporal_embedding([np.zeros(135)] * 5)
        result = model.predict([window], model.threshold)
        self.assertFalse(result["eligible"])
        self.assertEqual(result["reason"], "resting")
        self.assertEqual(len(model.automatic), 52)

    def test_held_out_source_recordings_match_their_labels_with_review_when_needed(self):
        model = TemporalForest(Path(__file__).parents[1] / "models")
        fixture = json.loads((Path(__file__).parent / "fixtures/recordings.json").read_text())
        for recording in fixture["recordings"]:
            with self.subTest(word=recording["label"]):
                session = RecognitionSession(model)
                frames = recording["frames"] + [[0] * 141] * 4
                results = [session.feed(frame, 1000 + index * 100) for index, frame in enumerate(frames)]
                accepted = [result["word"] for result in results if "word" in result]
                # These short source clips have no observed hold. Release must
                # preserve their correct suggestions without auto-acceptance.
                self.assertEqual(accepted, [])
                result = next(result for result in reversed(results) if result.get("suggestions"))
                self.assertEqual(result["suggestions"][0]["word"], recording["label"])
                self.assertEqual(session.confirm(recording["label"], result["revision"])["word"], recording["label"])

    def test_real_model_still_accepts_you_with_an_observed_hold(self):
        model = TemporalForest(Path(__file__).parents[1] / 'models')
        fixture = json.loads((Path(__file__).parent / 'fixtures/recordings.json').read_text())
        source = next(r['frames'] for r in fixture['recordings'] if r['label'] == 'you')
        # Synthetic hold extension verifies the gate; it is not a new recorded
        # accuracy sample or evidence of general signer performance.
        frames = source + [source[-1]] * 6 + [[0] * 141] * 4
        session = RecognitionSession(model)
        results = [session.feed(frame, 1000 + index * 100) for index, frame in enumerate(frames)]
        self.assertEqual([r['word'] for r in results if 'word' in r], ['you'])

    def test_one_word_is_emitted_once_until_the_hands_are_lowered(self):
        session = RecognitionSession(FixedPredictionModel())
        frame = tracked_frame()
        results = [session.feed(frame, now) for now in range(1000, 2300, 100)]
        self.assertEqual([item["word"] for item in results if "word" in item], ["hello"])
        self.assertEqual(session.feed(frame, 2300)["reason"], "already-emitted")
        session.feed([0] * 141, 2600)
        results = [session.feed(frame, now) for now in range(2700, 4000, 100)]
        self.assertEqual([item["word"] for item in results if "word" in item], ["hello"])

    def test_uncertain_words_require_confirmation_and_cannot_be_confirmed_twice(self):
        session = RecognitionSession(FixedPredictionModel(eligible=False))
        results = [session.feed(tracked_frame(), now) for now in range(1000, 2000, 100)]
        self.assertFalse(any("word" in result for result in results))
        result = results[-1]
        self.assertEqual(result["suggestions"][0]["word"], "hello")
        confirmed = session.confirm("hello", result["revision"])
        self.assertEqual(confirmed["word"], "hello")
        self.assertTrue(confirmed["confirmed"])
        self.assertIn("error", session.confirm("hello", result["revision"]))

    def test_hand_disappearance_does_not_turn_movement_into_a_held_sign(self):
        session = RecognitionSession(FixedPredictionModel())
        results = []
        for step, now in enumerate(range(1000, 2000, 100)):
            frame = tracked_frame()
            for joint in range(21):
                frame[joint * 3] += step * .03
            results.append(session.feed(frame, now))
        # High-scoring agreement during movement must not be auto-accepted
        # merely because the hand then leaves view for more than 250 ms.
        results.append(session.feed([0] * 141, 2300))
        self.assertFalse(any('word' in result for result in results))
        released = results[-1]
        self.assertGreaterEqual(released['stable_for'], 2)
        self.assertEqual(released['suggestions'][0]['word'], 'hello')
        self.assertEqual(session.confirm('hello', released['revision'])['word'], 'hello')

    def test_release_preserves_acceptance_after_an_observed_hold(self):
        model = FixedPredictionModel(eligible=False)
        session = RecognitionSession(model)
        for step, now in enumerate(range(1000, 1600, 100)):
            frame = tracked_frame()
            for joint in range(21):
                frame[joint * 3] += step * .03
            session.feed(frame, now)
        model.eligible = True
        first_vote = session.feed(frame, 1700)
        self.assertEqual(first_vote['stable_for'], 1)
        session.feed(frame, 1800)
        # Hands were visibly stationary for 300 ms before disappearing.
        released = session.feed([0] * 141, 2050)
        self.assertEqual(released['word'], 'hello')

    def test_a_short_tracking_gap_continues_the_same_sign_only_if_nothing_was_written(self):
        def gap(model, back_at):
            session = RecognitionSession(model)
            for now in range(1000, 1500, 100):
                session.feed(tracked_frame(), now)
            session.feed([0] * 141, 1500)
            session.feed([0] * 141, 1650)          # released: 250 ms without hands
            session.feed(tracked_frame(), back_at)
            return session

        unsure = FixedPredictionModel(eligible=False)
        unsure.rejoin_ms = 500
        self.assertEqual(len(gap(unsure, 1800).frames), 6)   # back 400 ms after the last hand: same sign
        self.assertEqual(len(gap(unsure, 2000).frames), 1)   # back 600 ms later: a new sign
        unsure.rejoin_ms = 0
        self.assertEqual(len(gap(unsure, 1800).frames), 1)

        sure = FixedPredictionModel()
        sure.rejoin_ms, sure.commit_on_release = 500, True
        session = RecognitionSession(sure)
        for now in range(1000, 1500, 100):
            session.feed(tracked_frame(), now)
        self.assertEqual(session.feed([0] * 141, 1650)["word"], "hello")
        session.feed(tracked_frame(), 1800)
        self.assertIsNone(session.committed)              # a written word always ends the sign

    def test_signs_end_and_restart_while_the_hands_stay_in_view(self):
        def moved(step):
            vector = tracked_frame()
            for joint in range(21):
                vector[joint * 3] += 0.03 * (step % 4)
            return vector

        model = FixedPredictionModel()
        model.commit_on_release, model.settle_ms, model.restart_ms = True, 450, 700
        session = RecognitionSession(model)
        now, words = 1000, []

        def feed(vector):
            nonlocal now
            now += 100
            result = session.feed(vector, now)
            if "word" in result:
                words.append(result["word"])
            return result

        for _ in range(10):                      # hands resting in view: no sign, idle frames dropped later
            feed(tracked_frame())
        for step in range(1, 8):                 # the sign
            feed(moved(step))
        self.assertLessEqual(len(session.frames), 8)
        for _ in range(6):                       # hands settle in view: the sign ends
            feed(moved(7))
        self.assertEqual(words, ["hello"])
        for _ in range(9):                       # resting after the word
            feed(moved(7))
        for step in range(1, 8):                 # a second sign, hands never left
            feed(moved(step))
        for _ in range(6):
            feed(moved(7))
        self.assertEqual(words, ["hello", "hello"])

    def test_a_finished_sign_reports_its_time_span(self):
        model = FixedPredictionModel(eligible=False)
        model.commit_on_release = True
        session = RecognitionSession(model)
        for now in range(1000, 1600, 100):
            self.assertNotIn("span", session.feed(tracked_frame(), now))
        released = session.feed([0] * 141, 1800)
        self.assertEqual(released["span"], [1000, 1500])

    def test_a_short_pause_inside_a_sign_does_not_start_a_new_sign(self):
        model = FixedPredictionModel(eligible=False)
        model.commit_on_release, model.settle_ms, model.restart_ms = True, 450, 700
        session = RecognitionSession(model)
        positions = [0, 1, 2, 0, 1, 2, 2, 2, 2, 0, 1, 2]   # still for 300 ms in the middle
        for step, offset in enumerate(positions):
            vector = tracked_frame()
            for joint in range(21):
                vector[joint * 3] += 0.03 * offset
            session.feed(vector, 1100 + step * 100)
        self.assertEqual(len(session.frames), len(positions))

    def test_pause_reset_and_tracking_stalls_discard_old_evidence(self):
        session = RecognitionSession(FixedPredictionModel())
        for now in range(1000, 1500, 100):
            session.feed(tracked_frame(), now)
        session.reset()
        self.assertEqual(session.feed(tracked_frame(), 1500)["buffered"], 1)
        self.assertEqual(session.feed(tracked_frame(), 3500)["buffered"], 1)
        self.assertIn("error", session.feed(tracked_frame(), 3400))


if __name__ == "__main__":
    unittest.main()
