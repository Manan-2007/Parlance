"""Inference for the original project's exported temporal forest.

Feature extraction matches lib/sign/temporal-features.ts in Yap & Render.
The shipped model and source attribution are in models/README.md.
"""

import hashlib
import json
from pathlib import Path

import numpy as np

FRAME_SIZE = 135
FEATURE_SIZE = FRAME_SIZE * 16
WINDOWS_MS = (600, 1000, 1600, 2400, 3800)


def gloss_key(label: str) -> str:
    return label.lower().replace("_", "")


def frame_features(vector: list[float]) -> np.ndarray:
    hands = np.asarray(vector[:126], dtype=np.float64).reshape(2, 21, 3)
    hands = hands[np.any(hands != 0, axis=(1, 2))]
    hands = hands[np.argsort(hands[:, 0, 0])]
    result = np.zeros(FRAME_SIZE, dtype=np.float64)
    scales = []
    for index, hand in enumerate(hands):
        relative = hand - hand[0]
        scale = np.linalg.norm(relative, axis=1).max()
        if scale < 1e-6:
            continue
        result[index * 63:(index + 1) * 63] = (relative / scale).reshape(-1)
        result[126 + index] = 1
        result[128 + index * 2:130 + index * 2] = hand[0, :2]
        scales.append(scale)
    if len(hands) == 2 and len(scales) == 2:
        result[132:135] = np.clip((hands[1, 0] - hands[0, 0]) / np.mean(scales), -12, 12)
    return result


def temporal_embedding(frames: list[np.ndarray]) -> np.ndarray:
    values = np.asarray(frames, dtype=np.float64)
    positions = np.linspace(0, len(values) - 1, 12)
    low, high = np.floor(positions).astype(int), np.ceil(positions).astype(int)
    mix = (positions - low)[:, None]
    samples = values[low] * (1 - mix) + values[high] * mix
    return np.concatenate((values.mean(axis=0), values.std(axis=0), values.min(axis=0), values.max(axis=0), samples.reshape(-1))).astype(np.float32)


def movement(previous: np.ndarray, current: np.ndarray) -> float:
    shape = np.mean((previous[:126] - current[:126]) ** 2)
    wrists = np.sum((previous[128:132] - current[128:132]) ** 2) * 4
    return float(np.sqrt(shape + wrists))


class TemporalForest:
    def __init__(self, directory: Path):
        self.meta = json.loads((directory / "isl-temporal-model.json").read_text())
        binary = (directory / "isl-temporal-forest.bin").read_bytes()
        if hashlib.sha256(binary).hexdigest() != self.meta["sha256"]:
            raise ValueError("Recognition model checksum does not match its metadata")
        if self.meta["features"] != "hand-temporal-stats-v1" or self.meta["featureLength"] != FEATURE_SIZE or self.meta["nodeWidth"] != 10:
            raise ValueError("Unsupported recognition model format")
        self.nodes = np.frombuffer(binary, dtype="<f4").reshape(-1, 10)
        if self.nodes.shape[0] != self.meta["nodeCount"] or not np.isfinite(self.nodes).all():
            raise ValueError("Invalid recognition model nodes")
        self.roots = np.asarray(self.meta["roots"], dtype=int)
        self.labels = self.meta["labels"]
        self.automatic = set(self.meta["autoAccept"])
        self.threshold = self.meta["threshold"]
        self.margin = self.meta["margin"]

    def predict(self, windows: list[np.ndarray], threshold: float) -> dict:
        features = np.asarray(windows, dtype=np.float32)
        indices = np.tile(self.roots, (len(features), 1))
        owners = np.broadcast_to(np.arange(len(features))[:, None], indices.shape)
        for _ in range(100):
            nodes = self.nodes[indices]
            active = nodes[:, :, 0] >= 0
            if not active.any():
                break
            columns = nodes[:, :, 0][active].astype(int)
            right = features[owners[active], columns] > nodes[:, :, 1][active]
            indices[active] = nodes[active, 2 + right.astype(int)].astype(int)
        else:
            raise ValueError("Recognition model traversal did not finish")
        leaves = self.nodes[indices]
        scores = np.zeros((len(features), len(self.labels)), dtype=np.float64)
        for slot in (4, 6, 8):
            np.add.at(scores, (owners, leaves[:, :, slot].astype(int)), leaves[:, :, slot + 1] / len(self.roots))
        results = []
        for row in scores:
            ranked = sorted(range(len(row)), key=lambda index: (-row[index], index))
            best, second = ranked[:2]
            label, confidence = self.labels[best], float(row[best])
            reason = "unstable"
            if label == "__NONE__":
                reason = "resting"
            elif label not in self.automatic:
                reason = "unverified"
            elif confidence < max(threshold, self.threshold) or confidence - row[second] < self.margin:
                reason = "low-confidence"
            candidates = [
                {"word": gloss_key(self.labels[index]), "confidence": float(row[index])}
                for index in ranked if self.labels[index] != "__NONE__" and row[index] >= 0.12
            ][:3]
            results.append({"candidate": gloss_key(label), "confidence": confidence, "reason": reason, "eligible": reason == "unstable", "candidates": candidates})
        whole = results[-1]["candidate"]
        accepted = [result for result in results if result["eligible"] and result["candidate"] == whole]
        if accepted:
            return max(accepted, key=lambda result: result["confidence"])
        result = max(results, key=lambda item: item["confidence"])
        return {**result, "eligible": False}

    def capabilities(self) -> dict:
        return {
            "name": "Parlance temporal forest",
            "modelSha256": self.meta["sha256"],
            "classes": len(self.labels) - 1,
            "automatic": [gloss_key(label) for label in self.meta["autoAccept"]],
            "threshold": self.threshold,
            "margin": self.margin,
            "license": self.meta["license"],
        }
