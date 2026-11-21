// The web sign camera, used by the Flutter web build (iPhone teammates open the
// app in Safari). Matches the web app's recogniser input
// (parlance-isl/src/engine/workers/mediapipe.worker.ts): the same MediaPipe
// release and hand model, two hands, confidence 0.3, VIDEO mode on the CPU,
// and detection on the raw (un-mirrored) camera frame. Only the preview is
// mirrored, with CSS.
import { FilesetResolver, HandLandmarker } from './mediapipe/vision_bundle.mjs';

let landmarker = null;
let loading = null;
let stream = null;
let video = null;
let running = false;
let last = -1;

function asset(path) {
  return new URL(path, document.baseURI).href;
}

async function detector() {
  if (landmarker) return landmarker;
  loading ??= (async () => {
    const fileset = await FilesetResolver.forVisionTasks(asset('mediapipe/wasm'));
    landmarker = await HandLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: asset('assets/assets/models/hand_landmarker.task'), delegate: 'CPU' },
      numHands: 2,
      runningMode: 'VIDEO',
      minHandDetectionConfidence: 0.3,
      minHandPresenceConfidence: 0.3,
      minTrackingConfidence: 0.3,
    });
    return landmarker;
  })();
  return loading;
}

async function start(element, onFrame) {
  stop();
  video = element;
  running = true;
  if (!navigator.mediaDevices?.getUserMedia) {
    onFrame({ error: 'This browser cannot use the camera here. Open the link in Safari or Chrome.' });
    return;
  }
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
    });
  } catch (error) {
    const denied = error && (error.name === 'NotAllowedError' || error.name === 'SecurityError');
    onFrame({
      error: denied
        ? 'Allow the camera to sign. Video stays on this phone; only hand positions are sent.'
        : 'The camera could not start. Close other apps using it and try again.',
    });
    return;
  }
  if (!running) return stop();
  video.srcObject = stream;
  await video.play().catch(() => {});
  let tracker;
  try {
    tracker = await detector();
  } catch (error) {
    console.error(error);
    onFrame({ error: 'Hand tracking could not load. Check your internet connection and try again.' });
    return;
  }
  const loop = () => {
    if (!running || video !== element) return;
    if (video.readyState >= 2 && video.videoWidth) {
      let now = performance.now();
      if (now <= last) now = last + 1;
      last = now;
      try {
        const result = tracker.detectForVideo(video, now);
        const hands = (result.landmarks || []).map((points, i) => ({
          label: result.handedness?.[i]?.[0]?.categoryName ?? '',
          score: result.handedness?.[i]?.[0]?.score ?? 0,
          points: points.flatMap((p) => [p.x, p.y, p.z]),
        }));
        onFrame({ w: video.videoWidth, h: video.videoHeight, hands });
      } catch (error) {
        console.error(error);
      }
    }
    if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(loop);
    else requestAnimationFrame(loop);
  };
  loop();
}

function stop() {
  running = false;
  stream?.getTracks().forEach((track) => track.stop());
  stream = null;
  if (video) video.srcObject = null;
  video = null;
}

window.parlanceSignCamera = { start, stop };
// Start loading the model early, so the camera is ready when it is opened.
if ('requestIdleCallback' in window) requestIdleCallback(() => detector().catch(() => {}));
