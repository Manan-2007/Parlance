/**
 * The 141-float frame contract — the browser half.
 *
 * Raw image-space coordinates sent to backend/model.py. The backend sorts the
 * two hands by camera wrist x and builds the original model's 135-value hand
 * features. The final 15 pose values support compatibility and framing hints.
 *
 * Layout, per frame:
 *
 *     [  0 : 63 ]  Left  hand: 21 landmarks x (x, y, z)
 *     [ 63 :126 ]  Right hand: 21 landmarks x (x, y, z)
 *     [126 :141 ]  Pose: nose, L shoulder, R shoulder, L elbow, R elbow
 *
 *   - Landmarks stay in MediaPipe's own order (0 = wrist ... 20 = pinky tip)
 *     and in its normalized coordinate space. These are `result.landmarks`
 *     (normalized image coordinates), NOT `result.worldLandmarks`.
 *   - "Left" / "Right" is the `categoryName` MediaPipe reports for that hand,
 *     never a guess from screen position.
 *   - An absent hand's 63 slots are zeros; absent pose is 15 zeros.
 *   - If both detected hands carry the same label, the higher-score one wins
 *     that block and the other is dropped.
 *
 * Normalization happens server-side in backend/model.py. Preview smoothing
 * and aspect corrections must not change the recognition input.
 *
 * Feed the detector the raw, un-mirrored video frame. The preview is mirrored
 * with CSS only.
 */

export const HAND_ORDER = ["Left", "Right"] as const;
export const LANDMARKS_PER_HAND = 21;
export const COORDS_PER_LANDMARK = 3;
export const FEATURES_PER_HAND = LANDMARKS_PER_HAND * COORDS_PER_LANDMARK; // 63
export const HANDS_DIM = FEATURES_PER_HAND * HAND_ORDER.length; // 126

/** MediaPipe pose landmark indices kept, in this order. */
export const POSE_LANDMARK_INDICES = [0, 11, 12, 13, 14] as const; // nose, L/R shoulder, L/R elbow
export const POSE_POINTS = POSE_LANDMARK_INDICES.length;
export const POSE_DIM = POSE_POINTS * COORDS_PER_LANDMARK; // 15

export const FEATURE_DIM = HANDS_DIM + POSE_DIM; // 141

/** Structural subset of MediaPipe's types, so this stays unit-testable. */
export interface LandmarkLike {
  x: number;
  y: number;
  z: number;
}
export interface CategoryLike {
  categoryName: string;
  score: number;
}
export interface HandResultLike {
  landmarks: LandmarkLike[][];
  handedness: CategoryLike[][];
}
export interface PoseResultLike {
  landmarks: LandmarkLike[][];
}

/**
 * Flatten one HandLandmarker (+ PoseLandmarker) result into the 141-float
 * frame vector in a transferable Float32Array.
 */
export function buildFrameVector(
  result: HandResultLike,
  pose?: PoseResultLike | null,
): Float32Array {
  const vec = new Float32Array(FEATURE_DIM);

  const poseLandmarks = pose?.landmarks?.[0];
  if (poseLandmarks) {
    POSE_LANDMARK_INDICES.forEach((index, slot) => {
      const lm = poseLandmarks[index];
      if (!lm) return;
      const base = HANDS_DIM + slot * COORDS_PER_LANDMARK;
      vec[base] = lm.x;
      vec[base + 1] = lm.y;
      vec[base + 2] = lm.z;
    });
  }

  if (!result?.landmarks?.length) return vec;

  // Resolve one detection per block first, so a duplicated handedness label
  // can't let a second hand overwrite the first non-deterministically.
  const best = new Map<string, { score: number; landmarks: LandmarkLike[] }>();
  for (let i = 0; i < result.landmarks.length; i += 1) {
    const categories = result.handedness[i];
    if (!categories?.length) continue;
    const { categoryName: label, score } = categories[0];
    if (!(HAND_ORDER as readonly string[]).includes(label)) continue;
    const current = best.get(label);
    // Strictly greater, so the first detection wins ties — same as Python.
    if (!current || score > current.score) {
      best.set(label, { score, landmarks: result.landmarks[i] });
    }
  }

  HAND_ORDER.forEach((label, block) => {
    const entry = best.get(label);
    if (!entry) return; // absent hand keeps its 63 zeros
    const offset = block * FEATURES_PER_HAND;
    const count = Math.min(LANDMARKS_PER_HAND, entry.landmarks.length);
    for (let i = 0; i < count; i += 1) {
      const base = offset + i * COORDS_PER_LANDMARK;
      const lm = entry.landmarks[i];
      vec[base] = lm.x;
      vec[base + 1] = lm.y;
      vec[base + 2] = lm.z;
    }
  });

  return vec;
}
