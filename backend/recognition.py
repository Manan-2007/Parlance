"""Per-camera word segmentation, confidence gates and repeat suppression."""

import math

from .model import WINDOWS_MS, frame_features, movement, temporal_embedding


class RecognitionSession:
    def __init__(self, model):
        self.model = model
        self.threshold = model.threshold
        # A calibrated model may commit when the hands are lowered after a sign,
        # instead of waiting for a still hold the sign may never have.
        self.commit_on_release = bool(getattr(model, "commit_on_release", False))
        # Hands missing this long counts as "lowered" (end of a sign).
        self.release_ms = float(getattr(model, "release_ms", 220))
        # Tracking often drops a fast-moving hand for a few frames. If the hands
        # come back this soon after a release that committed nothing, it was a
        # dropout, not the end of the sign: keep the frames and continue.
        self.rejoin_ms = float(getattr(model, "rejoin_ms", 0))
        # Hands often stay in view between signs. Then a sign ends when the hands
        # settle (still this long after moving), and a new one starts when they
        # move again after resting this long. 0 disables (hands must leave view).
        self.settle_ms = float(getattr(model, "settle_ms", 0))
        self.restart_ms = float(getattr(model, "restart_ms", 0))
        self.revision = 0
        self.reset()

    def reset(self):
        self.frames = []
        self.last_time = -math.inf
        self.last_present = -math.inf
        self.last_sample = -math.inf
        self.last_query = -math.inf
        self.last_moving = -math.inf
        self.previous = None
        self.agreement = ("", 0)
        self.committed = None
        self.released = False
        self.decided = False
        self.suggestions = []
        self.revision += 1
        self.result = {"status": "listening", "reason": "resting"}

    def start_sign(self):
        """Hands moved again after a rest, still in view: begin a new sign."""
        self.frames = self.frames[-1:]
        self.committed = None
        self.decided = False
        self.agreement = ("", 0)
        self.suggestions = []
        self.last_query = -math.inf
        self.revision += 1
        self.result = {"status": "listening", "reason": "resting"}

    def confirm(self, word, revision):
        candidate = next((candidate for candidate in self.suggestions if candidate["word"] == word), None)
        if self.committed or revision != self.revision or not candidate:
            return {"error": "That suggestion has expired. Sign the word again."}
        self.committed = candidate["word"]
        self.suggestions = []
        return {**candidate, "confirmed": True}

    def predict(self, now, final=False):
        windows, sizes = [], set()
        # The forest scores summary statistics; the transformer reads frames.
        encode = getattr(self.model, "window", temporal_embedding)
        for duration in WINDOWS_MS:
            frames = [frame for timestamp, frame in self.frames if timestamp >= self.frames[-1][0] - duration]
            if len(frames) >= 5 and len(frames) not in sizes:
                windows.append(encode(frames))
                sizes.add(len(frames))
        if not windows:
            return {"status": "listening", "buffered": len(self.frames), "needed": 5}
        self.last_query = now
        result = self.model.predict(windows, self.threshold)
        word = result["candidate"]
        same = self.agreement[0] == word
        count = self.agreement[1] + 1 if same and result["eligible"] else int(result["eligible"])
        self.agreement = (word, count)
        # Lost tracking is not evidence of a held sign. Apply the same hold
        # requirement at release, using only time when hands were observed.
        settled = count >= 2 and self.last_present - self.last_moving >= 250
        if self.settle_ms:
            # A sign must move and then settle (or the hands drop); a hand simply
            # resting in view is never read as a held sign.
            settled = False
        if final and self.commit_on_release:
            settled = True
        # Where the finished sign lies in the client's timestamps, so a client can
        # send that stretch of video to a second recognizer.
        span = {"span": [self.frames[0][0], self.frames[-1][0]]} if final else {}
        if result["eligible"] and settled:
            self.committed = word
            self.suggestions = []
            return {"word": word, "confidence": result["confidence"], "confirmed": False, **span}
        self.revision += 1
        self.suggestions = result["candidates"] if final or now - self.last_moving >= 250 else []
        self.result = {
            "status": "listening", "candidate": word,
            "confidence": result["confidence"], "reason": result["reason"],
            "stable_for": count, "suggestions": self.suggestions,
            "revision": self.revision,
            # Mid-sign guesses are not answers; only show a word once the sign is over.
            "final": bool(final or not self.settle_ms),
            **span,
        }
        return self.result

    def feed(self, vector, now):
        if now <= self.last_time:
            return {"error": "Frame timestamps must increase."}
        if now - self.last_time > 1200:
            self.reset()
        self.last_time = now
        present = any(vector[:126])
        if not present:
            if not self.released and now - self.last_present >= self.release_ms:
                self.released = True
                if len(self.frames) >= 5 and not self.committed and not self.decided:
                    return self.predict(now, final=True)
            return {"status": "listening", "reason": "resting"}
        if self.released:
            if not self.committed and now - self.last_present <= self.rejoin_ms:
                self.released = False          # a tracking dropout: continue the same sign
            else:
                self.reset()
                self.last_time = now
        self.last_present = now
        if now - self.last_sample >= 90:
            features = frame_features(vector)
            moving = self.previous is not None and movement(self.previous, features) > 0.025
            if moving:
                rested = now - self.last_moving >= self.restart_ms
                if self.restart_ms and rested and (self.committed or self.decided or len(self.frames) > 1):
                    self.start_sign()            # also drops idle frames from before the sign
                self.last_moving = now
                self.decided = False
            self.previous = features
            self.last_sample = now
            if not self.committed:
                self.frames.append((now, features))
                self.frames = [frame for frame in self.frames if frame[0] >= now - 4000]
        if self.committed:
            return {"status": "listening", "candidate": self.committed, "reason": "already-emitted", "confidence": 1, "stable_for": 0}
        if len(self.frames) < 5:
            return {"status": "listening", "buffered": len(self.frames), "needed": 5}
        if (self.settle_ms and not self.decided and self.last_moving > -math.inf
                and now - self.last_moving >= self.settle_ms):
            self.decided = True                  # hands settled in view: the sign is over
            return self.predict(now, final=True)
        if self.decided:
            return self.result                   # keep showing the decision until the hands move
        if now - self.last_query >= 250:
            return self.predict(now)
        return self.result
