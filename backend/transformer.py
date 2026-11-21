"""ONNX inference for the 500-word ISL landmark transformer.

Trained by training/train_isl_transformer.py on every ISL500 publisher hand
track (signer-disjoint split) plus recorded non-signing controls. Input is the
same 135-value `frame_features` the forest uses, one frame per ~90 ms, so the
browser and the WebSocket contract are unchanged.

The result dictionary matches TemporalForest.predict, so RecognitionSession's
agreement, hold and release rules apply to either model.
"""

import hashlib
import json
from pathlib import Path

import numpy as np

from .model import FRAME_SIZE, gloss_key

NONE_LABEL = "__NONE__"


def available(directory: Path) -> bool:
    try:
        import onnxruntime  # noqa: F401
    except ImportError:
        return False
    return (directory / "isl-transformer.onnx").exists() and (directory / "isl-transformer.json").exists()


class TransformerRecognizer:
    def __init__(self, directory: Path):
        import onnxruntime

        self.meta = json.loads((directory / "isl-transformer.json").read_text())
        binary = (directory / "isl-transformer.onnx").read_bytes()
        if hashlib.sha256(binary).hexdigest() != self.meta["sha256"]:
            raise ValueError("Recognition model checksum does not match its metadata")
        if self.meta["format"] != "isl-transformer-v1" or self.meta["frameSize"] != FRAME_SIZE:
            raise ValueError("Unsupported recognition model format")
        options = onnxruntime.SessionOptions()
        options.intra_op_num_threads = 2
        self.session = onnxruntime.InferenceSession(binary, options, providers=["CPUExecutionProvider"])
        self.labels = self.meta["labels"]
        if self.labels[0] != NONE_LABEL:
            raise ValueError("Recognition model must reserve class 0 for no sign")
        self.automatic = set(self.meta["autoAccept"])
        self.threshold = self.meta["threshold"]
        self.margin = self.meta["margin"]
        self.temperature = self.meta["temperature"]
        self.max_frames = self.meta["maxFrames"]
        self.commit_on_release = bool(self.meta.get("commitOnRelease", False))
        self.release_ms = float(self.meta.get("releaseMs", 220))
        self.rejoin_ms = float(self.meta.get("rejoinMs", 0))
        self.settle_ms = float(self.meta.get("settleMs", 0))
        self.restart_ms = float(self.meta.get("restartMs", 0))

    def window(self, frames: list[np.ndarray]) -> np.ndarray:
        """The model reads the frames themselves, not summary statistics."""
        return np.asarray(frames[-self.max_frames:], dtype=np.float32)

    def scores(self, windows: list[np.ndarray]) -> np.ndarray:
        length = max(len(w) for w in windows)
        features = np.zeros((len(windows), length, FRAME_SIZE), dtype=np.float32)
        mask = np.zeros((len(windows), length), dtype=np.float32)
        for index, window in enumerate(windows):
            features[index, :len(window)] = window
            mask[index, :len(window)] = 1
        logits = self.session.run(["logits"], {"features": features, "mask": mask})[0] / self.temperature
        logits -= logits.max(axis=1, keepdims=True)
        probabilities = np.exp(logits)
        return probabilities / probabilities.sum(axis=1, keepdims=True)

    def predict(self, windows: list[np.ndarray], threshold: float) -> dict:
        results = []
        for row in self.scores(windows):
            ranked = np.argsort(-row, kind="stable")
            best, second = int(ranked[0]), int(ranked[1])
            label, confidence = self.labels[best], float(row[best])
            reason = "unstable"
            if label == NONE_LABEL:
                reason = "resting"
            elif label not in self.automatic:
                reason = "unverified"
            elif confidence < max(threshold, self.threshold) or confidence - float(row[second]) < self.margin:
                reason = "low-confidence"
            candidates = [
                {"word": gloss_key(self.labels[i]), "confidence": float(row[i])}
                for i in ranked[:4] if self.labels[i] != NONE_LABEL and row[i] >= 0.12
            ][:3]
            results.append({"candidate": gloss_key(label), "confidence": confidence, "reason": reason,
                            "eligible": reason == "unstable", "candidates": candidates})
        # Decide on the longest window: the whole sign since the hands rose. Short
        # windows only see part of a sign and win with confident wrong answers
        # (replayed on held-out signers: 91.8% vs 86.9% usable, fewer insertions).
        return results[-1]

    def capabilities(self) -> dict:
        return {
            "name": "Parlance ISL transformer",
            "modelSha256": self.meta["sha256"],
            "classes": len(self.labels) - 1,
            "automatic": [gloss_key(label) for label in self.meta["autoAccept"]],
            "threshold": self.threshold,
            "margin": self.margin,
            "license": self.meta["license"],
        }
