import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Hand, LifeBuoy, ShieldCheck } from "lucide-react";
import { SwitchRow } from "@/components/ui/Switch";
import { announce } from "@/components/ui/Toaster";
import { toEnglish } from "@/engine/isl/grammar";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { createId } from "@/lib/id";
import { useCameraTracking } from "@/services/camera/useCameraTracking";
import { useRecognitionService, type AcceptedSign, type FinishedSign } from "@/services/recognition/useRecognitionService";
import { readSignFromVideo, useSignClips, useVideoAvailability } from "@/services/recognition/videoSign";
import { glossLabel, useRecognitionMetrics, useSignLibrary } from "@/services/signs/library";
import { sentenceKey, useSignSentence } from "@/services/signs/useSignSentence";
import { useSpeechOutput } from "@/services/speech/useSpeechOutput";
import { useHistory } from "@/stores/history";
import { useSettings } from "@/stores/settings";
import { CameraStage } from "./CameraStage";
import { RecognitionReadout, ServiceStatus } from "./RecognitionReadout";
import { SentencePanel, Transcript, type BuiltWord, type FinishedSentence } from "./SentencePanel";

/** A signed sentence counts as finished after this long without a new sign. */
const SENTENCE_PAUSE_MS = 3500;
/** How long an accepted sign stays in the headline. */
const ACCEPTED_HOLD_MS = 2200;

function hostOf(url: string): string {
  try {
    return new URL(url).host || url;
  } catch {
    return url;
  }
}

export function SignToTextPage() {
  useDocumentTitle("Sign to text");
  const library = useSignLibrary();
  const metrics = useRecognitionMetrics();
  const speech = useSpeechOutput();
  const addHistory = useHistory((s) => s.add);

  const settings = useSettings();
  const { set } = settings;

  const [recognising, setRecognising] = useState(true);
  const [words, setWords] = useState<BuiltWord[]>([]);
  const [log, setLog] = useState<FinishedSentence[]>([]);
  const [accepted, setAccepted] = useState<AcceptedSign | null>(null);
  const acceptingRef = useRef(false);

  const wordsRef = useRef(words);
  wordsRef.current = words;
  const pauseTimer = useRef<number | undefined>(undefined);
  const acceptedTimer = useRef<number | undefined>(undefined);
  const voiceRef = useRef(settings.voiceOutput);
  voiceRef.current = settings.voiceOutput;

  const english = useMemo(() => (words.length ? toEnglish(words.map((w) => w.word)) : ""), [words]);
  const glossList = useMemo(() => words.map((w) => w.word), [words]);
  const { natural, pending: naturalPending } = useSignSentence(glossList, settings.sentenceLanguage);
  const naturalRef = useRef(natural);
  naturalRef.current = natural;

  const finishSentence = useCallback(() => {
    window.clearTimeout(pauseTimer.current);
    const current = wordsRef.current;
    if (current.length === 0) return;
    wordsRef.current = [];
    const glosses = current.map((w) => w.word);
    // Prefer the AI sentence only if it was written for exactly these signs.
    const rewrite = naturalRef.current;
    const text = (rewrite && rewrite.key === sentenceKey(glosses) ? rewrite.text : "") || toEnglish(glosses) || glosses.join(" ");
    const gloss = glosses.map((g) => glossLabel(g, library)).join(" ");
    setLog((prev) => [{ id: createId(), text, gloss, at: Date.now() }, ...prev]);
    addHistory({
      direction: "sign-to-text",
      text,
      gloss,
      missing: [],
      input: "camera",
      words: current.map(({ word, confidence }) => ({ word, confidence })),
    });
    setWords([]);
    announce(`Sentence finished: ${text}`);
    if (voiceRef.current) speech.speak(text);
  }, [addHistory, library, speech]);

  const finishRef = useRef(finishSentence);
  finishRef.current = finishSentence;
  const autoFinishRef = useRef(settings.autoFinishSentence);
  autoFinishRef.current = settings.autoFinishSentence;

  const videoInfo = useVideoAvailability();
  const videoOn = settings.videoAI && Boolean(videoInfo?.available);
  const videoOnRef = useRef(videoOn);
  videoOnRef.current = videoOn;
  const [videoReading, setVideoReading] = useState(0);
  const [videoNote, setVideoNote] = useState<string | null>(null);
  const videoNoteTimer = useRef<number | undefined>(undefined);
  const videoQueue = useRef<Promise<void>>(Promise.resolve());
  const clipRef = useRef<((start: number, end: number) => Promise<string[]>) | null>(null);
  const clearLiveRef = useRef<(() => void) | null>(null);

  const addWord = useCallback(
    (sign: AcceptedSign) => {
      if (!acceptingRef.current) return;
      setVideoNote(null);
      setAccepted(sign);
      window.clearTimeout(acceptedTimer.current);
      acceptedTimer.current = window.setTimeout(() => setAccepted(null), ACCEPTED_HOLD_MS);
      setWords((prev) => [...prev, { id: createId(), word: sign.word, confidence: sign.confidence }]);
      announce(`Recognised ${glossLabel(sign.word, library)}`);
      window.clearTimeout(pauseTimer.current);
      if (autoFinishRef.current) {
        pauseTimer.current = window.setTimeout(() => finishRef.current(), SENTENCE_PAUSE_MS);
      }
    },
    [library],
  );
  const addWordRef = useRef(addWord);
  addWordRef.current = addWord;

  // With video reading on, the vision model decides each sign; the hand model's
  // own automatic word is only a fallback if the video request fails.
  const onAccepted = useCallback((sign: AcceptedSign) => {
    if (videoOnRef.current && !sign.confirmed) return;
    addWordRef.current(sign);
  }, []);

  const onFinished = useCallback((sign: FinishedSign) => {
    if (!videoOnRef.current || !acceptingRef.current) return;
    setVideoReading((n) => n + 1);
    const fallback = () => {
      if (sign.word) addWordRef.current({ word: sign.word, confidence: sign.hints[0]?.confidence ?? 0, at: Date.now() });
    };
    // One sign at a time, so words land in signing order.
    videoQueue.current = videoQueue.current.then(async () => {
      try {
        const frames = (await clipRef.current?.(sign.span[0], sign.span[1])) ?? [];
        if (frames.length < 2) return fallback();
        const reading = await readSignFromVideo(frames, sign.hints);
        if (reading.word) {
          addWordRef.current({ word: reading.word, confidence: reading.confidence, at: Date.now(), via: reading.provider });
          clearLiveRef.current?.();            // the hand model's suggestions for this sign are moot
        } else {
          const note = "Parlance could not read that sign. Try it again, a little slower.";
          setVideoNote(note);
          announce(note);
          window.clearTimeout(videoNoteTimer.current);
          videoNoteTimer.current = window.setTimeout(() => setVideoNote(null), 4000);
        }
      } catch {
        fallback();
      } finally {
        setVideoReading((n) => n - 1);
      }
    });
  }, []);

  useEffect(
    () => () => {
      window.clearTimeout(pauseTimer.current);
      window.clearTimeout(acceptedTimer.current);
      window.clearTimeout(videoNoteTimer.current);
    },
    [],
  );

  const service = useRecognitionService({
    url: settings.serviceUrl,
    enabled: true,
    threshold: settings.confidenceThreshold,
    onAccepted,
    onFinished,
  });

  const camera = useCameraTracking({
    onVector: service.send,
    sending: recognising && service.connection === "open",
    showLandmarks: settings.showLandmarks,
    cameraId: settings.cameraId,
    onCameraMissing: () => set("cameraId", null),
  });
  acceptingRef.current = recognising && camera.status === "running";
  clearLiveRef.current = service.clearLive;
  clipRef.current = useSignClips(camera.videoRef, videoOn && camera.status === "running");

  useEffect(() => {
    if (!recognising || camera.status !== "running") {
      service.resetLive();
      setAccepted(null);
    }
    // resetLive is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recognising, camera.status]);

  const verifiedWords = useMemo(
    () => [...metrics.verified].map((g) => glossLabel(g, library)).sort((a, b) => a.localeCompare(b)),
    [metrics, library],
  );

  const subtitles = words.map((w) => glossLabel(w.word, library));

  return (
    <div className="grid gap-3 p-2 sm:gap-4 sm:p-3 lg:h-[calc(100dvh-4rem)] lg:grid-cols-[minmax(0,1fr)_minmax(22rem,27rem)] lg:p-4">
      <h1 className="sr-only">Sign to text</h1>
      <div className="min-h-0 overflow-hidden rounded-[2rem]">
        <CameraStage
          camera={camera}
          recognising={recognising}
          onRecognising={setRecognising}
          recognitionAvailable={service.connection === "open"}
          cameraId={settings.cameraId}
          onCameraId={(id) => set("cameraId", id)}
          showLandmarks={settings.showLandmarks}
          onShowLandmarks={(on) => set("showLandmarks", on)}
          showGuide={settings.showFramingGuide}
          onShowGuide={(on) => set("showFramingGuide", on)}
          serviceHost={hostOf(settings.serviceUrl)}
          subtitles={subtitles}
          flash={accepted ? accepted.word : null}
        />
      </div>

      <aside
        aria-label="Recognition and transcript"
        className="flex min-h-0 flex-col overflow-hidden rounded-[2rem] bg-surface ring-1 ring-line"
      >
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-line px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-forest-400 text-white" aria-hidden>
              <Hand className="size-[1.125rem]" />
            </span>
            <p className="text-sm font-extrabold text-forest-800">
              Sign <span aria-hidden>→</span>
              <span className="sr-only">to</span> Text
            </p>
          </div>
          <ServiceStatus service={service} />
        </div>
        <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-4 py-5 sm:px-5">
          <section aria-label="Recognised sign" aria-live="off">
            <RecognitionReadout
              camera={camera}
              service={service}
              recognising={recognising}
              accepted={accepted}
              threshold={settings.confidenceThreshold}
              metrics={metrics}
              library={library}
              video={videoOn ? { reading: videoReading > 0, note: videoNote } : null}
            />
          </section>
          <div className="-my-3 border-y border-line">
            <SwitchRow
              label="Read signs from video (experimental)"
              checked={videoOn}
              disabled={!videoInfo?.available}
              onChange={(on) => set("videoAI", on)}
              description={
                videoInfo?.available
                  ? "Sends a short clip of each finished sign to Parlance's video reader, which picks the word. Takes a few seconds per sign. Nothing is stored."
                  : videoInfo
                    ? "Unavailable on this server right now."
                    : "Checking…"
              }
            />
          </div>
          <div>
            <SentencePanel
              words={words}
              english={english}
              natural={natural}
              naturalPending={naturalPending}
              language={settings.sentenceLanguage}
              onLanguage={(language) => set("sentenceLanguage", language)}
              onFinish={finishSentence}
              onUndo={() => setWords((prev) => prev.slice(0, -1))}
              onClear={() => {
                window.clearTimeout(pauseTimer.current);
                setWords([]);
              }}
              onSpeak={(text) => speech.speak(text)}
              speechSupported={speech.supported}
              voiceOutput={settings.voiceOutput}
              onVoiceOutput={(on) => set("voiceOutput", on)}
              autoFinish={settings.autoFinishSentence}
              library={library}
            />
          </div>
          <div className="border-t border-line pt-6">
            <Transcript log={log} onSpeak={(text) => speech.speak(text)} speaking={speech.speaking} speechSupported={speech.supported} />
          </div>
        </div>
        <details className="group border-t border-line">
          <summary className="flex min-h-14 list-none items-center justify-between gap-3 px-5 py-3 hover:bg-paper [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2.5 text-[0.9375rem] font-extrabold text-navy">
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-forest-400 text-white" aria-hidden>
                <ShieldCheck className="size-4" />
              </span>
              Signs Parlance can recognise{metrics.loaded ? ` (${verifiedWords.length})` : ""}
            </span>
            <ChevronDown className="size-4 shrink-0 text-ink-3 transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <div className="max-h-56 overflow-y-auto px-5 pb-5">
            <p className="text-xs leading-5 text-ink-3">
              These words can be added automatically. Review suggestions for other words. Sign one word at a time and lower your hands briefly between words.
            </p>
            <p className="mt-3 flex flex-wrap gap-1.5 text-xs font-bold tracking-[0.04em] text-navy uppercase">
              {verifiedWords.map((word) => (
                <span key={word} className="rounded-full bg-forest-100 px-2.5 py-1 text-forest-800">
                  {word}
                </span>
              ))}
            </p>
            <Link to="/app/help#camera" className="mt-4 inline-flex min-h-10 items-center gap-1.5 text-[0.8125rem] font-bold text-cobalt-400 hover:underline">
              <LifeBuoy className="size-3.5" aria-hidden /> Camera tips
            </Link>
          </div>
        </details>
      </aside>
    </div>
  );
}
