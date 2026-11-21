"""Training/camera contract for body, facial and hand motion.

Raw points are (normalized image x, normalized image y, visibility). The
camera aspect ratio converts these to square units before normalization.
"""
import numpy as np

FACE_POINTS = (33, 133, 362, 263, 70, 63, 105, 300, 293, 334, 61, 291, 0, 17, 13, 14, 78, 308, 1, 4)
POINTS = 95
FEATURE_SIZE = POINTS * 3 + 84
FEATURE_VERSION = 'holistic-95-xy-v1'
INCLUDE_ADAPTER_VERSION = 'include-swapped-hw-pixels-v2'


def normalize_frame(raw, aspect):
    points = np.asarray(raw, dtype=np.float32).reshape(POINTS, 3)
    present = (points[:, 2] >= 0.4) & np.isfinite(points).all(axis=1)
    if not (present[11] and present[12]):
        return np.zeros(FEATURE_SIZE, dtype=np.float32)
    xy = points[:, :2].copy()
    xy[:, 0] *= aspect
    center = (xy[11] + xy[12]) / 2
    scale = np.linalg.norm(xy[11] - xy[12])
    if scale < 0.01:
        return np.zeros(FEATURE_SIZE, dtype=np.float32)
    body = np.clip((xy - center) / scale, -8, 8)
    body[~present] = 0
    output = [np.column_stack((body, present.astype(np.float32))).reshape(-1)]
    for start in (53, 74):
        hand = xy[start:start + 21]
        mask = present[start:start + 21]
        local = np.zeros((21, 2), dtype=np.float32)
        if mask[0] and mask.sum() >= 15:
            distances = np.linalg.norm(hand[mask] - hand[0], axis=1)
            hand_scale = distances.max()
            if hand_scale > 0.001:
                local[mask] = np.clip((hand[mask] - hand[0]) / hand_scale, -2, 2)
        output.append(local.reshape(-1))
    return np.concatenate(output).astype(np.float32)


def holistic_frame(result):
    output = np.zeros((POINTS, 3), dtype=np.float32)
    blocks = ((result.pose_landmarks, range(33), 0),
              (result.face_landmarks, FACE_POINTS, 33),
              (result.left_hand_landmarks, range(21), 53),
              (result.right_hand_landmarks, range(21), 74))
    for landmarks, indices, start in blocks:
        if not landmarks:
            continue
        for slot, index in enumerate(indices):
            point = landmarks[index]
            confidence = point.visibility if start == 0 and point.visibility is not None else 1
            output[start + slot] = (point.x, point.y, confidence)
    return output


def include_frames(keypoints, confidences, image_shape):
    """INCLUDE publisher pickles store x*height and y*width, not normalized xy.

    Convention verified against an original, frame-matched source video. Undo
    that scaling before using the same aspect-correct camera normalization.
    """
    height, width = image_shape[:2]
    if height <= 0 or width <= 0:
        raise ValueError('Invalid INCLUDE image dimensions')
    frames = []
    for points, scores in zip(keypoints, confidences):
        points = np.asarray(points).copy()
        points[:, :2] /= np.asarray([height, width])
        raw = np.zeros((POINTS, 3), dtype=np.float32)
        raw[:33, :2] = points[:33, :2]
        raw[:33, 2] = scores[:33]
        raw[53:74, :2] = points[33:54, :2]
        raw[53:74, 2] = scores[33:54]
        raw[74:95, :2] = points[54:75, :2]
        raw[74:95, 2] = scores[54:75]
        frames.append(normalize_frame(raw, width / height))
    return np.asarray(frames)


def isign_frames(pose, max_frames=400):
    """Adapt publisher pixel-coordinate poses, keeping real source timestamps.

    POSE_WORLD_LANDMARKS use different units and are deliberately not selected.
    Caption text is not used to invent gloss labels or frame alignments.
    """
    width, height = pose.header.dimensions.width, pose.header.dimensions.height
    fps = float(pose.body.fps)
    values = np.ma.filled(pose.body.data, 0)
    scores = np.asarray(pose.body.confidence)
    if values.ndim != 4 or values.shape[1] != 1 or width <= 0 or height <= 0 or fps <= 0:
        raise ValueError('Unsupported iSign pose dimensions, person count or FPS')
    count = len(values)
    if count < 2:
        raise ValueError('Pose has insufficient temporal data')
    selected = np.linspace(0, count - 1, min(count, max_frames)).round().astype(int)
    raw = np.zeros((len(selected), POINTS, 3), dtype=np.float32)
    components, offset = {}, 0
    for component in pose.header.components:
        components[component.name] = (offset, len(component.points))
        offset += len(component.points)
    for name, indices, target in (
        ('POSE_LANDMARKS', tuple(range(33)), 0),
        ('FACE_LANDMARKS', FACE_POINTS, 33),
        ('LEFT_HAND_LANDMARKS', tuple(range(21)), 53),
        ('RIGHT_HAND_LANDMARKS', tuple(range(21)), 74),
    ):
        if name not in components:
            raise ValueError(f'Missing pose component {name}')
        start, size = components[name]
        if max(indices) >= size:
            raise ValueError(f'Unexpected point count for {name}')
        positions = np.asarray(indices) + start
        raw[:, target:target + len(indices), :2] = values[selected, 0][:, positions, :2] / np.asarray([width, height])
        raw[:, target:target + len(indices), 2] = scores[selected, 0][:, positions]
    frames = np.asarray([normalize_frame(frame, width / height) for frame in raw])
    timestamps = selected.astype(np.float64) / fps * 1000
    return frames, timestamps


def forest_frame(result):
    """Raw hand coordinates for evaluating the previous word recognizer."""
    output = np.zeros(141, dtype=np.float32)
    for start, landmarks in ((0, result.left_hand_landmarks), (63, result.right_hand_landmarks)):
        for index, point in enumerate(landmarks[:21]):
            output[start + index * 3:start + index * 3 + 3] = (point.x, point.y, point.z)
    for slot, index in enumerate((0, 11, 12, 13, 14)):
        if result.pose_landmarks:
            point = result.pose_landmarks[index]
            output[126 + slot * 3:129 + slot * 3] = (point.x, point.y, point.z)
    return output
