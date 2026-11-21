"""Prototype motion features with palm depth and explicit handedness views."""
import numpy as np


def mirror_tracks(points, confidence):
    mirrored, scores = points.copy(), confidence.copy()
    mirrored[:, :, 0] = 1 - mirrored[:, :, 0]
    for left, right in [(11, 12), (13, 14), (15, 16)]:
        mirrored[:, [left, right]] = mirrored[:, [right, left]]
        scores[:, [left, right]] = scores[:, [right, left]]
    mirrored[:, 33:54], mirrored[:, 54:75] = mirrored[:, 54:75].copy(), mirrored[:, 33:54].copy()
    scores[:, 33:54], scores[:, 54:75] = scores[:, 54:75].copy(), scores[:, 33:54].copy()
    return mirrored, scores


def template_features(points, confidence, aspect):
    frames = []
    for raw, scores in zip(points, confidence):
        values = raw.copy().astype(np.float32)
        values[:, [0, 2]] *= aspect
        present = (scores >= .4) & np.isfinite(values).all(axis=1)
        output = np.zeros(138, dtype=np.float32)
        scale = np.linalg.norm(values[11, :2] - values[12, :2])
        if present[11] and present[12] and scale > .01:
            center = (values[11, :2] + values[12, :2]) / 2
            for slot, index in enumerate([0, 13, 14]):
                if present[index]:
                    output[slot * 2:slot * 2 + 2] = np.clip((values[index, :2] - center) / scale, -6, 6) * .25
            for start, offset in [(33, 6), (54, 72)]:
                if present[start:start + 21].sum() >= 15:
                    hand = values[start:start + 21] - values[start]
                    hand_scale = np.linalg.norm(hand[:, :2], axis=1).max()
                    if hand_scale > .001:
                        output[offset] = 1
                        output[offset + 1:offset + 3] = np.clip((values[start, :2] - center) / scale, -6, 6)
                        local = np.clip(hand / hand_scale, -2, 2)
                        local[~present[start:start + 21]] = 0
                        local[:, 2] *= .5  # Depth is useful but noisier than image xy.
                        output[offset + 3:offset + 66] = local.reshape(-1)
        frames.append(output)
    frames = np.asarray(frames)
    indices = np.linspace(0, len(frames) - 1, min(len(frames), 48)).round().astype(int)
    return frames[indices]


def dtw_distance(first, second):
    from scipy.spatial.distance import cdist
    if len(first) == 0 or len(second) == 0 or first.shape[1] != second.shape[1]:
        raise ValueError('DTW needs nonempty sequences with matching feature dimensions')
    cost = cdist(first, second, metric='sqeuclidean') / first.shape[1]
    previous = np.full(len(second) + 1, np.inf)
    previous[0] = 0
    for row in cost:
        current = np.full(len(second) + 1, np.inf)
        for j, value in enumerate(row, 1):
            current[j] = value + min(previous[j - 1], previous[j], current[j - 1])
        previous = current
    return float(previous[-1] / (len(first) + len(second)))
