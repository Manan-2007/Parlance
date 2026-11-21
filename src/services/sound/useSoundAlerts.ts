/**
 * On-device sound alerts: the microphone feeds MediaPipe's YAMNet audio
 * classifier (public/models/yamnet.tflite) about once a second. Audio never
 * leaves the device and nothing is recorded.
 *
 * The engine lives at module level so listening carries on while the person
 * uses the rest of Parlance; <SoundAlertLayer> in the app shell shows alerts
 * on any page, and the header shows that the microphone is on.
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AudioClassifier } from "@mediapipe/tasks-audio";
import { DEFAULT_GROUPS, SOUND_GROUPS, matchGroups, topSound, type Category, type Sensitivity } from "@/lib/soundAlerts";

interface SoundSettings {
  enabled: string[];
  sensitivity: Sensitivity;
  notify: boolean;
  vibrate: boolean;
  set: (patch: Partial<Omit<SoundSettings, "set">>) => void;
}

export const useSoundSettings = create<SoundSettings>()(
  persist(
    (set) => ({
      enabled: DEFAULT_GROUPS,
      sensitivity: "normal",
      notify: false,
      vibrate: true,
      set: (patch) => set(patch),
    }),
    {
      name: "parlance.sound.v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ enabled, sensitivity, notify, vibrate }) => ({ enabled, sensitivity, notify, vibrate }),
    },
  ),
);

export type SoundStatus = "idle" | "loading" | "listening" | "error";
export type SoundError = "denied" | "no-microphone" | "model" | "unsupported";

export const SOUND_ERRORS: Record<SoundError, string> = {
  denied: "Microphone access is blocked. Allow it in your browser's site settings, then press Start listening again.",
  "no-microphone": "No microphone was found. Connect one and press Start listening again.",
  model: "The sound model couldn't load. Open this page once with a connection; after that it works offline.",
  unsupported: "This browser can't listen for sounds. Try Chrome, Edge or Safari.",
};

export interface Alert {
  id: string;
  group: string;
  score: number;
  at: number;
  /** A test alert from the page, not a real sound. */
  test?: boolean;
}

interface SoundRuntime {
  status: SoundStatus;
  error: SoundError | null;
  heard: Category | null;
  level: number;
  /** Alert on screen now. */
  current: Alert | null;
  /** This session's alerts, newest first. */
  log: Alert[];
  start: () => Promise<void>;
  stop: () => void;
  dismiss: () => void;
  test: (group: string) => void;
}

const COOLDOWN_MS = 12_000;
let classifierPromise: Promise<AudioClassifier> | null = null;
let teardown: () => void = () => {};
const lastAlert = new Map<string, number>();

function loadClassifier(): Promise<AudioClassifier> {
  classifierPromise ??= import("@mediapipe/tasks-audio")
    .then(async ({ AudioClassifier, FilesetResolver }) => {
      const files = await FilesetResolver.forAudioTasks(`${import.meta.env?.BASE_URL ?? "/"}mediapipe/audio-wasm`);
      return AudioClassifier.createFromOptions(files, {
        baseOptions: { modelAssetPath: `${import.meta.env?.BASE_URL ?? "/"}models/yamnet.tflite` },
        maxResults: 25,
        scoreThreshold: 0.05,
      });
    })
    .catch((error: unknown) => {
      classifierPromise = null;
      throw error;
    });
  return classifierPromise;
}

function raise(alert: Alert) {
  useSoundRuntime.setState((s) => ({ current: alert, log: [alert, ...s.log].slice(0, 30) }));
  const settings = useSoundSettings.getState();
  const group = SOUND_GROUPS.find((g) => g.id === alert.group);
  if (settings.vibrate && "vibrate" in navigator) navigator.vibrate(group?.urgent ? [400, 150, 400, 150, 400, 150, 400] : [300, 120, 300]);
  if (settings.notify && document.visibilityState === "hidden" && "Notification" in window && Notification.permission === "granted" && group) {
    try {
      new Notification(group.alert, { body: `${group.hi} · Parlance heard: ${group.label.toLowerCase()}`, tag: `sound-${group.id}`, icon: `${import.meta.env?.BASE_URL ?? "/"}icons/icon-192.png` });
    } catch {
      // Some browsers only allow notifications from a service worker.
    }
  }
}

export const useSoundRuntime = create<SoundRuntime>()((set, get) => ({
  status: "idle",
  error: null,
  heard: null,
  level: 0,
  current: null,
  log: [],
  dismiss: () => set({ current: null }),
  test: (group) => raise({ id: `test-${Date.now()}`, group, score: 1, at: Date.now(), test: true }),
  stop: () => {
    teardown();
    teardown = () => {};
    set({ status: "idle", heard: null, level: 0 });
  },
  start: async () => {
    if (get().status === "listening" || get().status === "loading") return;
    if (!navigator.mediaDevices?.getUserMedia || typeof AudioContext === "undefined") {
      set({ status: "error", error: "unsupported" });
      return;
    }
    set({ status: "loading", error: null });
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: true } });
    } catch (e) {
      const name = e instanceof DOMException ? e.name : "";
      set({ status: "error", error: name === "NotFoundError" || name === "OverconstrainedError" ? "no-microphone" : "denied" });
      return;
    }
    let classifier: AudioClassifier;
    try {
      classifier = await loadClassifier();
    } catch {
      stream.getTracks().forEach((t) => t.stop());
      set({ status: "error", error: "model" });
      return;
    }

    const context = new AudioContext({ sampleRate: 16000 });
    const source = context.createMediaStreamSource(stream);
    // About a second of audio per classification: YAMNet's own window.
    const processor = context.createScriptProcessor(16384, 1, 1);
    const silent = context.createGain();
    silent.gain.value = 0;
    processor.onaudioprocess = (event) => {
      const samples = event.inputBuffer.getChannelData(0);
      let sum = 0;
      for (let i = 0; i < samples.length; i += 16) sum += samples[i]! * samples[i]!;
      const level = Math.min(1, Math.sqrt(sum / (samples.length / 16)) * 6);
      let categories: Category[];
      try {
        const best = new Map<string, number>();
        for (const result of classifier.classify(samples, context.sampleRate)) {
          for (const c of result.classifications[0]?.categories ?? []) {
            if (c.categoryName) best.set(c.categoryName, Math.max(best.get(c.categoryName) ?? 0, c.score));
          }
        }
        categories = [...best].map(([categoryName, score]) => ({ categoryName, score }));
      } catch {
        return;
      }
      set({ heard: topSound(categories), level });
      const settings = useSoundSettings.getState();
      const now = Date.now();
      for (const hit of matchGroups(categories, new Set(settings.enabled), settings.sensitivity)) {
        if (now - (lastAlert.get(hit.id) ?? 0) < COOLDOWN_MS) continue;
        lastAlert.set(hit.id, now);
        raise({ id: `${hit.id}-${now}`, group: hit.id, score: hit.score, at: now });
      }
    };
    source.connect(processor);
    processor.connect(silent);
    silent.connect(context.destination);
    void context.resume();

    let lock: WakeLockSentinel | null = null;
    const keepAwake = () => {
      if ("wakeLock" in navigator && document.visibilityState === "visible") {
        void navigator.wakeLock.request("screen").then((s) => (lock = s)).catch(() => {});
      }
    };
    keepAwake();
    document.addEventListener("visibilitychange", keepAwake);
    const track = stream.getAudioTracks()[0];
    const onEnded = () => get().stop();
    track?.addEventListener("ended", onEnded);

    teardown = () => {
      document.removeEventListener("visibilitychange", keepAwake);
      track?.removeEventListener("ended", onEnded);
      processor.onaudioprocess = null;
      processor.disconnect();
      source.disconnect();
      silent.disconnect();
      stream.getTracks().forEach((t) => t.stop());
      void context.close();
      void lock?.release().catch(() => {});
    };
    set({ status: "listening" });
  },
}));
