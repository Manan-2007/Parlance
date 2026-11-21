/**
 * Camera landmarks and recognition events for the bundled FastAPI service.
 *
 * Sends:    {"landmarks": number[141]}                 one tracked frame
 *           {"config": {"confidence_threshold": n}}    per-connection setting
 * Receives: {"word", "confidence"}                     an ACCEPTED sign
 *           {..., "span": [start, end]}                 a FINISHED sign, in sent timestamps
 *           {"status":"listening","candidate",...}     a candidate, NOT accepted
 *           {"status":"listening","buffered","needed"} window still filling
 *           {"status":"no-model"}                      service up, no model
 *           {"error"}                                  rejected frame
 *
 * Only one frame may be in flight. Newer camera frames replace skipped work,
 * keeping a slow service from accumulating delayed recognition results.
 */
import { useCallback, useEffect, useRef, useState } from "react";

export type ConnectionState = "idle" | "connecting" | "open" | "offline" | "no-model";

export type RejectReason = "resting" | "unverified" | "low-confidence" | "unstable" | "already-emitted";

export interface Candidate {
  word: string;
  confidence: number;
  stableFor: number;
  reason: RejectReason;
  /** False while the sign is still being made: a partial guess, not an answer. */
  final: boolean;
}

export interface AcceptedSign {
  word: string;
  confidence: number;
  at: number;
  confirmed?: boolean;
  /** Set when a vision model read the sign from video (e.g. "gemini"). */
  via?: string;
}

/** One finished sign: where it lies in time and what the hand model made of it. */
export interface FinishedSign {
  /** First and last frame of the sign, in the `performance.now()` timestamps sent. */
  span: [number, number];
  /** The word the hand model wrote, if it wrote one. */
  word: string | null;
  /** The hand model's best guesses, best first. */
  hints: Suggestion[];
}

export interface Suggestion {
  word: string;
  confidence: number;
}

export interface RecognitionService {
  connection: ConnectionState;
  /** Auto-retry has stopped; the user can retry by hand. */
  gaveUp: boolean;
  /** Auto-output vocabulary advertised by the connected model, not a quality guarantee. */
  automaticWords: string[] | null;
  candidate: Candidate | null;
  suggestions: Suggestion[];
  confirm: (word: string) => void;
  buffered: { have: number; need: number } | null;
  error: string | null;
  send: (vector: Float32Array) => void;
  retry: () => void;
  /** Forget the live candidate (e.g. when recognition is paused). */
  resetLive: () => void;
  /** Hide the current guess and suggestions without resetting the service. */
  clearLive: () => void;
}

interface Options {
  url: string;
  enabled: boolean;
  threshold: number;
  onAccepted: (sign: AcceptedSign) => void;
  onFinished?: (sign: FinishedSign) => void;
}

const RETRY_DELAYS_MS = [1500, 3000, 6000, 12000, 20000];

export function useRecognitionService({ url, enabled, threshold, onAccepted, onFinished }: Options): RecognitionService {
  const onAcceptedRef = useRef(onAccepted);
  onAcceptedRef.current = onAccepted;
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;
  const thresholdRef = useRef(threshold);
  thresholdRef.current = threshold;
  const socketRef = useRef<WebSocket | null>(null);
  const nextFrame = useRef(1);
  const pendingFrame = useRef<number | null>(null);
  const minimumFrame = useRef(0);
  const revision = useRef(0);

  const [connection, setConnection] = useState<ConnectionState>("idle");
  const [gaveUp, setGaveUp] = useState(false);
  const [automaticWords, setAutomaticWords] = useState<string[] | null>(null);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [buffered, setBuffered] = useState<{ have: number; need: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    setAutomaticWords(null);
    if (!enabled) {
      setConnection("idle");
      return;
    }
    let disposed = false;
    let attempt = 0;
    let timer: number | undefined;
    setGaveUp(false);

    const connect = () => {
      if (disposed) return;
      setConnection("connecting");
      let ws: WebSocket;
      try {
        ws = new WebSocket(url);
      } catch {
        setConnection("offline");
        setGaveUp(true);
        setError("The recognition service address is not a valid WebSocket URL.");
        return;
      }
      socketRef.current = ws;
      pendingFrame.current = null;

      ws.onopen = () => {
        if (disposed) return;
        attempt = 0;
        setConnection("open");
        setError(null);
        ws.send(JSON.stringify({ config: { confidence_threshold: thresholdRef.current } }));
      };

      ws.onclose = () => {
        if (disposed) return;
        socketRef.current = null;
        setCandidate(null);
        setAutomaticWords(null);
        setSuggestions([]);
        setBuffered(null);
        pendingFrame.current = null;
        setConnection((state) => (state === "no-model" ? state : "offline"));
        const delay = RETRY_DELAYS_MS[attempt];
        attempt += 1;
        if (delay === undefined) {
          setGaveUp(true);
          return;
        }
        timer = window.setTimeout(connect, delay);
      };

      ws.onmessage = (event) => {
        if (disposed) return;
        let msg: Record<string, unknown>;
        try {
          msg = JSON.parse(event.data as string) as Record<string, unknown>;
        } catch {
          return;
        }
        if (msg.frameId === pendingFrame.current || msg.frameId === undefined) pendingFrame.current = null;
        if (typeof msg.frameId === "number" && msg.frameId < minimumFrame.current) return;
        if (Array.isArray(msg.span) && msg.span.length === 2 && msg.span.every(Number.isFinite)) {
          const word = typeof msg.word === "string" ? msg.word : null;
          const listed = Array.isArray(msg.suggestions) ? (msg.suggestions as Suggestion[]) : [];
          const hints = word
            ? [{ word, confidence: Number(msg.confidence) || 0 }]
            : listed.length
              ? listed
              : typeof msg.candidate === "string"
                ? [{ word: msg.candidate, confidence: Number(msg.confidence) || 0 }]
                : [];
          onFinishedRef.current?.({ span: msg.span as [number, number], word, hints });
        }
        if (Array.isArray(msg.suggestions)) {
          revision.current = Number(msg.revision) || 0;
          setSuggestions(msg.suggestions.filter((item): item is Suggestion =>
            item && typeof item.word === "string" && Number.isFinite(item.confidence),
          ));
        }
        if (msg.status === "ready") {
          const model = msg.model as { automatic?: unknown } | undefined;
          setAutomaticWords(Array.isArray(model?.automatic) ? model.automatic.filter((word): word is string => typeof word === "string") : []);
        }
        if (typeof msg.word === "string") {
          onAcceptedRef.current({ word: msg.word, confidence: Number(msg.confidence) || 0, at: Date.now(), confirmed: msg.confirmed === true });
          setCandidate(null);
          setSuggestions([]);
          setBuffered(null);
          setError(null);
        } else if (msg.status === "no-model") {
          setConnection("no-model");
        } else if (typeof msg.error === "string") {
          setError(msg.error);
        } else if (typeof msg.candidate === "string") {
          setCandidate({
            word: msg.candidate,
            confidence: Number(msg.confidence) || 0,
            stableFor: Number(msg.stable_for) || 0,
            reason: ((msg.reason as RejectReason | undefined) ?? "low-confidence"),
            final: msg.final !== false,
          });
          setBuffered(null);
        } else if (msg.buffered !== undefined) {
          setBuffered({ have: Number(msg.buffered) || 0, need: Number(msg.needed) || 5 });
          setCandidate(null);
          setSuggestions([]);
        } else if (msg.status === "reset" || msg.status === "configured") {
          setCandidate(null);
          setSuggestions([]);
          setBuffered(null);
        }
      };
    };

    connect();

    return () => {
      disposed = true;
      window.clearTimeout(timer);
      const ws = socketRef.current;
      if (ws) {
        ws.onclose = null;
        ws.onmessage = null;
        // Closing mid-handshake logs a browser warning; let it open, then close.
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.onopen = () => ws.close();
          ws.onerror = null;
        } else {
          ws.close();
        }
      }
      socketRef.current = null;
      pendingFrame.current = null;
    };
  }, [url, enabled, generation]);

  useEffect(() => {
    const ws = socketRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ config: { confidence_threshold: threshold } }));
    }
  }, [threshold]);

  const send = useCallback((vector: Float32Array) => {
    const ws = socketRef.current;
    if (ws?.readyState !== WebSocket.OPEN || pendingFrame.current !== null || ws.bufferedAmount > 8192) return;
    const frameId = nextFrame.current++;
    pendingFrame.current = frameId;
    ws.send(JSON.stringify({ landmarks: Array.from(vector), timestamp: performance.now(), frameId }));
  }, []);

  const retry = useCallback(() => setGeneration((n) => n + 1), []);

  const resetLive = useCallback(() => {
    minimumFrame.current = nextFrame.current;
    setCandidate(null);
    setSuggestions([]);
    setBuffered(null);
    setError(null);
    const ws = socketRef.current;
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ reset: true }));
  }, []);

  const clearLive = useCallback(() => {
    setCandidate(null);
    setSuggestions([]);
  }, []);

  const confirm = useCallback((word: string) => {
    const ws = socketRef.current;
    if (ws?.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ confirm: word, revision: revision.current }));
    setSuggestions([]);
  }, []);

  return { connection, gaveUp, automaticWords, candidate, suggestions, confirm, buffered, error, send, retry, resetLive, clearLive };
}
