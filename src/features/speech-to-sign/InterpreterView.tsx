/**
 * Live sign interpreter: like the signer in the corner of a TV broadcast.
 * Play a video, a YouTube link or a shared screen (or point the microphone at
 * a TV in the room); the 3D signer signs what it hears, word by word, in a
 * corner of the picture, with live captions underneath.
 *
 * Speech is heard through the microphone (the browser's speech recognition
 * cannot listen to a tab's audio directly), so play the sound out loud.
 */
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Expand, Film, Mic, MonitorUp, Radio, Shrink, Square, SquarePlay, Tv } from "lucide-react";
import type { PlayerState, QueueItem } from "@/avatar/playback";
import { AvatarViewport } from "@/components/avatar/AvatarViewport";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { announce } from "@/components/ui/Toaster";
import { useFullscreen } from "@/hooks/useFullscreen";
import { cn } from "@/lib/cn";
import { SPEECH_ERROR_MESSAGES, useSpeechInput } from "@/services/speech/useSpeechInput";
import type { SpeechLanguage } from "@/stores/settings";
import { planLiveCommit } from "@/translation/liveSpeech.js";
import { translateOffline } from "@/translation/islTranslator.js";
import { playbackKind, readableSignLabel } from "@/translation/islVocabulary.js";
import { liveSigns, liveSpeed, nextBatch, phraseHoldBack } from "./interpreter";

type Source = "room" | "file" | "youtube" | "screen";
type Corner = "left" | "right";
type Size = "s" | "m" | "l";

const SIZE_CLASS: Record<Size, string> = { s: "w-[22%]", m: "w-[30%]", l: "w-[40%]" };

/** A YouTube watch, share or live link -> its video id. */
export function youtubeId(link: string): string | null {
  const match = link.trim().match(/(?:youtu\.be\/|v=|\/embed\/|\/live\/|\/shorts\/)([\w-]{11})/);
  return match?.[1] ?? null;
}

const words = (text: string) => text.split(/\s+/).filter(Boolean);

export function InterpreterView({ language, onLanguage }: { language: SpeechLanguage; onLanguage: (l: SpeechLanguage) => void }) {
  const [source, setSource] = useState<Source>("room");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [link, setLink] = useState("");
  const [screen, setScreen] = useState<MediaStream | null>(null);
  const [corner, setCorner] = useState<Corner>("right");
  const [size, setSize] = useState<Size>("m");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [speed, setSpeed] = useState(1);
  const [dropped, setDropped] = useState(0);
  const [current, setCurrent] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fullscreen = useFullscreen(stageRef);
  const linkId = useId();
  const languageId = useId();

  // Word-by-word signing: what is final, what was already signed, what waits.
  const finals = useRef<string[]>([]);
  const committed = useRef<string[]>([]);
  const waiting = useRef<QueueItem[]>([]);
  const busy = useRef(false);
  const queueRef = useRef<QueueItem[]>([]);
  const watchdog = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(watchdog.current), []);

  const pump = useCallback(() => {
    if (busy.current || waiting.current.length === 0) return;
    const { batch, dropped: lost } = nextBatch(waiting.current);
    waiting.current = [];
    if (lost) setDropped((n) => n + lost);
    busy.current = true;
    // If the "finished" event is ever missed, never stay stuck.
    window.clearTimeout(watchdog.current);
    watchdog.current = window.setTimeout(() => {
      busy.current = false;
      pumpRef.current();
    }, 2500 + batch.length * 1800);
    queueRef.current = batch;
    setSpeed(liveSpeed(batch.length));
    setQueue(batch);
  }, []);
  const pumpRef = useRef(pump);
  pumpRef.current = pump;

  const enqueue = useCallback(
    (chunk: string) => {
      const { tokens } = translateOffline(chunk);
      const items: QueueItem[] = tokens.map((gloss: string) => ({ gloss, label: readableSignLabel(gloss), missing: false, kind: playbackKind(gloss) }));
      const { signs } = liveSigns(items);
      if (!signs.length) return;
      waiting.current.push(...signs);
      pump();
    },
    [pump],
  );

  const interimRef = useRef("");
  const update = useCallback(() => {
    const interim = words(interimRef.current);
    const heard = { words: [...finals.current, ...interim], finalWordCount: finals.current.length, allFinal: interim.length === 0 };
    const plan = planLiveCommit(committed.current, heard, phraseHoldBack);
    committed.current = plan.committed;
    if (plan.chunk) enqueue(plan.chunk);
    setCaption(heard.words.slice(-24).join(" "));
    // Keep memory small: once everything heard is final and signed, start over.
    if (heard.allFinal && committed.current.length === finals.current.length && finals.current.length > 60) {
      finals.current = finals.current.slice(-12);
      committed.current = [...finals.current];
    }
  }, [enqueue]);

  const speech = useSpeechInput(
    language,
    (text) => {
      finals.current.push(...words(text));
      interimRef.current = "";
      update();
    },
    { continuous: true },
  );
  const listening = speech.status === "listening" || speech.status === "starting";

  useEffect(() => {
    interimRef.current = speech.interim;
    update();
  }, [speech.interim, update]);

  useEffect(() => () => speech.cancel(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const onState = useCallback(
    (state: PlayerState) => {
      setCurrent(queueRef.current[state.index]?.label ?? null);
      if (state.finished && busy.current) {
        busy.current = false;
        window.clearTimeout(watchdog.current);
        pump();
      }
    },
    [pump],
  );

  // Sources: a video file, a shared screen or tab, or a YouTube link.
  useEffect(() => () => { if (videoUrl) URL.revokeObjectURL(videoUrl); }, [videoUrl]);
  useEffect(() => () => screen?.getTracks().forEach((t) => t.stop()), [screen]);
  useEffect(() => {
    if (videoRef.current && screen) videoRef.current.srcObject = screen;
  }, [screen, source]);

  const shareScreen = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      stream.getVideoTracks()[0]?.addEventListener("ended", () => setScreen(null));
      setScreen(stream);
      setSource("screen");
    } catch {
      announce("Screen sharing was cancelled.");
    }
  };

  const start = () => {
    finals.current = [];
    committed.current = [];
    waiting.current = [];
    setDropped(0);
    speech.start();
    announce("Listening. The signer will sign what it hears.");
  };

  const yt = source === "youtube" ? youtubeId(link) : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 rounded-[1.5rem] bg-surface p-3 ring-1 ring-line">
        <Segmented<Source>
          label="What to interpret"
          size="sm"
          value={source}
          onChange={(value) => (value === "screen" ? void shareScreen() : setSource(value))}
          options={[
            { value: "room", label: <><Tv aria-hidden /> TV in the room</> },
            { value: "file", label: <><Film aria-hidden /> Video file</> },
            { value: "youtube", label: <><SquarePlay aria-hidden /> YouTube</> },
            { value: "screen", label: <><MonitorUp aria-hidden /> Share a tab</> },
          ]}
        />
        {source === "file" && (
          <label className="inline-flex h-9 cursor-pointer items-center rounded-full bg-paper-2 px-4 text-sm font-bold text-navy hover:bg-cobalt-100">
            Choose a video
            <input
              type="file"
              accept="video/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setVideoUrl(URL.createObjectURL(file));
              }}
            />
          </label>
        )}
        {source === "youtube" && (
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <label htmlFor={linkId} className="sr-only">YouTube link</label>
            <input
              id={linkId}
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="Paste a YouTube link (news, a speech, a match)"
              className="h-9 min-w-0 flex-1 rounded-full border-2 border-line bg-surface px-4 text-sm font-semibold text-ink"
            />
          </span>
        )}
        <span className="ml-auto flex items-center gap-2">
          <label htmlFor={languageId} className="sr-only">Spoken language</label>
          <select
            id={languageId}
            value={language}
            onChange={(e) => onLanguage(e.target.value as SpeechLanguage)}
            className="h-9 rounded-full border-2 border-line bg-surface px-3 text-sm font-semibold text-ink"
          >
            <option value="en-IN">English (India)</option>
            <option value="hi-IN">Hindi</option>
          </select>
          {listening ? (
            <Button size="sm" variant="danger" leading={<Square aria-hidden />} onClick={() => speech.stop()}>Stop</Button>
          ) : (
            <Button size="sm" variant="voice" leading={<Mic aria-hidden />} onClick={start} disabled={!speech.supported}>Start interpreting</Button>
          )}
        </span>
      </div>

      <div
        ref={stageRef}
        className={cn(
          "relative isolate aspect-video w-full overflow-hidden rounded-[2rem] bg-navy",
          fullscreen.active && "rounded-none",
        )}
      >
        {/* The programme */}
        {source === "file" && videoUrl && <video ref={videoRef} src={videoUrl} controls autoPlay className="absolute inset-0 h-full w-full object-contain" />}
        {source === "screen" && screen && <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 h-full w-full object-contain" />}
        {yt && (
          <iframe
            title="YouTube video"
            src={`https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&playsinline=1`}
            allow="autoplay; encrypted-media; picture-in-picture"
            className="absolute inset-0 h-full w-full border-0"
          />
        )}
        {(source === "room" || (source === "file" && !videoUrl) || (source === "youtube" && !yt) || (source === "screen" && !screen)) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center text-white/85">
            <Radio className="size-10" aria-hidden />
            <p className="max-w-md text-lg font-semibold">
              {source === "room"
                ? "Point this device's microphone at the TV, radio or speaker, then press Start interpreting."
                : source === "file"
                  ? "Choose a video. Play its sound out loud so the microphone can hear it."
                  : source === "youtube"
                    ? "Paste a YouTube link above. Play its sound out loud so the microphone can hear it."
                    : "Share a tab (a live stream, a match) and play its sound out loud."}
            </p>
          </div>
        )}

        {/* The signer in the corner, like a broadcast interpreter */}
        <div
          className={cn(
            "absolute bottom-[14%] aspect-[3/4] overflow-hidden rounded-[1.25rem] border-4 border-white bg-paper-2 shadow-lg",
            SIZE_CLASS[size],
            corner === "right" ? "right-[2%]" : "left-[2%]",
          )}
        >
          <AvatarViewport
            queue={queue}
            playbackSpeed={speed}
            presentation="figure"
            interactive={false}
            onState={onState}
            label={current ? `Signer performing ${current}` : "Signer, waiting for speech"}
          />
          {current && (
            <span className="absolute inset-x-0 top-2 mx-auto w-fit rounded-full bg-navy/85 px-3 py-0.5 text-xs font-extrabold tracking-wide text-white uppercase">
              {current}
            </span>
          )}
        </div>

        {/* Live captions */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-[3%] pt-8 pb-[2%]">
          <p aria-live="polite" className="line-clamp-2 text-[clamp(1rem,2.4vw,1.75rem)] leading-snug font-bold text-white drop-shadow">
            {caption || (listening ? "Listening…" : "Captions appear here.")}
          </p>
        </div>

        <div className="absolute top-3 left-3 flex items-center gap-2">
          {listening && <span className="rounded-full bg-danger px-3 py-1 text-xs font-extrabold text-white">● LIVE · ISL</span>}
          {dropped > 0 && <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white">Skipped {dropped} signs to keep up</span>}
        </div>
        {fullscreen.supported && (
          <button
            type="button"
            onClick={fullscreen.toggle}
            aria-label={fullscreen.active ? "Leave full screen" : "Full screen"}
            className="absolute top-3 right-3 inline-flex size-10 items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/75"
          >
            {fullscreen.active ? <Shrink className="size-5" aria-hidden /> : <Expand className="size-5" aria-hidden />}
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-ink-2">
        <Segmented<Corner> label="Signer corner" size="sm" value={corner} onChange={setCorner}
          options={[{ value: "left", label: "Left" }, { value: "right", label: "Right" }]} />
        <Segmented<Size> label="Signer size" size="sm" value={size} onChange={setSize}
          options={[{ value: "s", label: "Small" }, { value: "m", label: "Medium" }, { value: "l", label: "Large" }]} />
        {speech.error && <p role="alert" className="font-semibold text-danger">{SPEECH_ERROR_MESSAGES[speech.error]}</p>}
        <p className="basis-full text-ink-3">
          Signs words as they are heard, so it keeps up with live speech. Signs are approximate; long names and words it has no sign for stay in the captions instead of being spelled out. Works best in Chrome or Edge.
        </p>
      </div>
    </div>
  );
}
