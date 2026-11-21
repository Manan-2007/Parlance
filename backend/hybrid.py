"""Transformer first, forest for the words only the forest knows.

The ISL transformer (500-word ISL500 vocabulary) decides and is the only model
allowed to commit a word automatically. ISL500 lacks 80 of the forest's 150
words, including everyday ones (sorry, want, understand, name, come, stop), so
when the transformer is not confident the forest may add up to two suggestions
for those words. They always need the signer's tap, as they did before.
"""

import numpy as np

from .model import TemporalForest, gloss_key, temporal_embedding
from .transformer import TransformerRecognizer

FOREST_SUGGESTION_MIN = 0.2


class HybridRecognizer:
    def __init__(self, transformer: TransformerRecognizer, forest: TemporalForest):
        self.transformer = transformer
        self.forest = forest
        known = {gloss_key(label) for label in transformer.labels}
        self.forest_only = {gloss_key(label) for label in forest.labels if label != "__NONE__"} - known
        self.threshold = transformer.threshold
        self.automatic = transformer.automatic

    @property
    def release_ms(self):
        return self.transformer.release_ms

    @property
    def rejoin_ms(self):
        return self.transformer.rejoin_ms

    @property
    def settle_ms(self):
        return self.transformer.settle_ms

    @property
    def restart_ms(self):
        return self.transformer.restart_ms

    @property
    def commit_on_release(self):
        return self.transformer.commit_on_release

    @commit_on_release.setter
    def commit_on_release(self, value):
        self.transformer.commit_on_release = value

    def window(self, frames: list[np.ndarray]):
        return self.transformer.window(frames), temporal_embedding(frames)

    def predict(self, windows, threshold: float) -> dict:
        decision = self.transformer.predict([w[0] for w in windows], threshold)
        if decision["eligible"]:
            return decision
        forest = self.forest.predict([w[1] for w in windows], threshold)
        extra = [c for c in forest["candidates"]
                 if c["word"] in self.forest_only and c["confidence"] >= FOREST_SUGGESTION_MIN][:2]
        if not extra:
            return decision
        merged = {**decision, "candidates": decision["candidates"][:3] + extra}
        if decision["reason"] == "resting":
            # The transformer saw no known sign; show the forest's word as a suggestion.
            merged.update(candidate=extra[0]["word"], confidence=extra[0]["confidence"], reason="unverified")
        return merged

    def capabilities(self) -> dict:
        info = self.transformer.capabilities()
        return {**info, "name": "Parlance ISL transformer + forest suggestions",
                "classes": info["classes"] + len(self.forest_only),
                "suggestOnly": sorted(self.forest_only)}
