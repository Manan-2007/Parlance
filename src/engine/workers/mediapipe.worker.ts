/**
 * On-device hand tracking. Detection runs in this worker so camera processing
 * cannot block typing, transcript updates or animation controls.
 *
 * The forest uses raw image-space hands. Body detection is unnecessary for
 * this model. A smoothed copy is used only for the preview overlay.
 */
/// <reference lib="webworker" />
import { FilesetResolver, HandLandmarker, PoseLandmarker } from "@mediapipe/tasks-vision";
import { POSE_LANDMARK_INDICES } from "../landmarks";
import { assembleAvatarPose, assembleFrame, FrameSmoother, HandAssigner, POSE_VISIBILITY } from "../tracking";

export interface InitMessage {
  type: "init";
  wasmPath: string;
  modelPath: string;
  /** Opt-in body anchor for Learn; regular recognition remains hand-only. */
  poseModelPath?: string;
}
export interface FrameMessage {
  type: "frame";
  bitmap: ImageBitmap;
  timestamp: number;
}
export type WorkerInMessage = InitMessage | FrameMessage | { type: "reset" } | { type: "close" };

export interface ResultMessage {
  type: "result";
  timestamp: number;
  inferMs: number;
  /** Raw hands plus 15 reserved pose coordinates, matching the API contract. */
  vector: Float32Array;
  world: Float32Array;
  pose: Float32Array;
  aspect: number;
  body: boolean;
  hands: number;
  gaps: [number, number];
  landmarks: { x: number; y: number }[][];
  blocks: number[];
}
export type WorkerOutMessage = ResultMessage
  | { type: "ready"; delegate: "CPU" }
  | { type: "error"; message: string };

let landmarker: HandLandmarker | null = null;
let poseLandmarker: PoseLandmarker | null = null;
const smoother = new FrameSmoother();
const assigner = new HandAssigner();
const post = (msg: WorkerOutMessage, transfer: Transferable[] = []) =>
  (self as unknown as DedicatedWorkerGlobalScope).postMessage(msg, transfer);

async function init(msg: InitMessage) {
  const fileset = await FilesetResolver.forVisionTasks(msg.wasmPath);
  // MediaPipe's loader uses importScripts. Fetch and prime its module factory
  // explicitly because Vite serves this as an ES module worker.
  const response = await fetch(fileset.wasmLoaderPath);
  if (!response.ok) throw new Error("The hand tracker runtime could not be loaded.");
  const loaderSource = await response.text();
  (0, eval)(loaderSource);
  landmarker = await HandLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: msg.modelPath, delegate: "CPU" },
    numHands: 2,
    runningMode: "VIDEO",
    minHandDetectionConfidence: 0.3,
    minHandPresenceConfidence: 0.3,
    minTrackingConfidence: 0.3,
  });
  if (msg.poseModelPath) {
    // Each task consumes its own loader factory in an ES module worker.
    delete (self as unknown as Record<string, unknown>).ModuleFactory;
    (0, eval)(loaderSource);
    poseLandmarker = await PoseLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: msg.poseModelPath, delegate: "CPU" },
      runningMode: "VIDEO", numPoses: 1,
      minPoseDetectionConfidence: 0.3, minPosePresenceConfidence: 0.3, minTrackingConfidence: 0.3,
    });
  }
  post({ type: "ready", delegate: "CPU" });
}

function detect(msg: FrameMessage) {
  const started = performance.now();
  try {
    if (!landmarker) return;
    const result = landmarker.detectForVideo(msg.bitmap, msg.timestamp);
    const pose = poseLandmarker?.detectForVideo(msg.bitmap, msg.timestamp).landmarks[0];
    const assigned = assigner.assign(result.landmarks ?? [], result.handedness ?? [], result.worldLandmarks ?? []);
    // Keep the recogniser contract hand-only even when Learn requests body anchors.
    const vector = assembleFrame(assigned, null, POSE_LANDMARK_INDICES);
    const aspect = msg.bitmap.width / msg.bitmap.height;
    const avatarPose = assembleAvatarPose(pose, aspect).block;
    const world = new Float32Array(126);
    for (let block = 0; block < 2; block++) {
      assigned.world[block]?.forEach((point, index) => {
        world.set([point.x, point.y, point.z], block * 63 + index * 3);
      });
    }
    const preview = smoother.smooth(vector, msg.timestamp);
    const landmarks: { x: number; y: number }[][] = [];
    const blocks: number[] = [];
    for (let block = 0; block < 2; block += 1) {
      if (!assigned.image[block]) continue;
      const base = block * 63;
      landmarks.push(Array.from({ length: 21 }, (_, index) => ({
        x: preview[base + index * 3], y: preview[base + index * 3 + 1],
      })));
      blocks.push(block);
    }
    post({
      type: "result", timestamp: msg.timestamp, inferMs: performance.now() - started,
      vector, world, pose: avatarPose, aspect,
      body: !!pose && (pose[11]?.visibility ?? 0) >= POSE_VISIBILITY && (pose[12]?.visibility ?? 0) >= POSE_VISIBILITY,
      hands: landmarks.length,
      gaps: [assigner.gapFor(0), assigner.gapFor(1)], landmarks, blocks,
    }, [vector.buffer, world.buffer, avatarPose.buffer]);
  } finally {
    msg.bitmap.close();
  }
}

self.onmessage = (event: MessageEvent<WorkerInMessage>) => {
  const msg = event.data;
  try {
    if (msg.type === "init") {
      void init(msg).catch((error) => post({ type: "error", message: String(error) }));
    } else if (msg.type === "frame") {
      detect(msg);
    } else if (msg.type === "reset") {
      smoother.reset();
      assigner.reset();
    } else if (msg.type === "close") {
      landmarker?.close();
      landmarker = null;
      poseLandmarker?.close();
      poseLandmarker = null;
    }
  } catch (error) {
    post({ type: "error", message: String(error) });
  }
};
