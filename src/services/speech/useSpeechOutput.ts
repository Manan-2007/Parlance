/** Shared spoken output for recognised sentences, history and voice previews. */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/components/ui/Toaster";
import { useSettings } from "@/stores/settings";

interface OutputVoice {
  voiceURI: string;
  name: string;
  lang: string;
}
interface SpeechConfiguration {
  enabled: boolean;
  defaultVoice: string;
  voices: { id: string; name: string; lang: string }[];
}
export interface SpeechOutput {
  supported: boolean;
  speaking: boolean;
  azureEnabled: boolean;
  voices: OutputVoice[];
  speak: (text: string) => boolean;
  cancel: () => void;
}
const NO_CLOUD: SpeechConfiguration = { enabled: false, defaultVoice: "", voices: [] };
let configuration: Promise<SpeechConfiguration> | undefined;

function englishFirst(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  const rank = (voice: SpeechSynthesisVoice) => voice.lang === "en-IN" ? 0 : voice.lang.startsWith("en") ? 1 : voice.lang.startsWith("hi") ? 2 : 3;
  return [...voices].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
}

export function useSpeechVoices(): SpeechSynthesisVoice[] {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() => supported ? englishFirst(window.speechSynthesis.getVoices()) : []);
  useEffect(() => {
    if (!supported) return;
    const update = () => setVoices(englishFirst(window.speechSynthesis.getVoices()));
    update();
    window.speechSynthesis.addEventListener("voiceschanged", update);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", update);
  }, [supported]);
  return voices;
}

export function useSpeechOutput(): SpeechOutput {
  const browserSupported = typeof window !== "undefined" && "speechSynthesis" in window;
  const deviceVoices = useSpeechVoices();
  const voiceURI = useSettings((state) => state.voiceURI);
  const rate = useSettings((state) => state.speechRate);
  const [config, setConfig] = useState(NO_CLOUD);
  const [speaking, setSpeaking] = useState(false);
  const requestRef = useRef<AbortController | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectURL = useRef<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    let active = true;
    configuration ??= fetch("/api/speech/config")
      .then(async response => response.ok ? await response.json() as SpeechConfiguration : NO_CLOUD)
      .catch(() => NO_CLOUD);
    void configuration.then(value => { if (active) setConfig(value); });
    return () => { active = false; };
  }, []);

  const azureEnabled = config.enabled && typeof Audio !== "undefined";
  const usingAzure = azureEnabled && (!voiceURI || voiceURI.startsWith("azure:"));
  const supported = usingAzure || browserSupported;
  const voices = useMemo(() => [
    ...config.enabled ? config.voices.map(voice => ({ voiceURI: `azure:${voice.id}`, name: `${voice.name} (Azure)`, lang: voice.lang })) : [],
    ...deviceVoices,
  ], [config, deviceVoices]);

  const cancel = useCallback(() => {
    requestRef.current?.abort();
    requestRef.current = null;
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current = null;
    }
    if (objectURL.current) URL.revokeObjectURL(objectURL.current);
    objectURL.current = null;
    if (browserSupported) window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setSpeaking(false);
  }, [browserSupported]);

  useEffect(() => () => cancel(), [cancel]);

  const speak = useCallback((text: string) => {
    if (!supported || !text.trim()) return false;
    cancel();
    if (usingAzure) {
      const controller = new AbortController();
      requestRef.current = controller;
      setSpeaking(true);
      const generate = async () => {
        const response = await fetch("/api/speech", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, rate, voice: voiceURI?.startsWith("azure:") ? voiceURI.slice(6) : undefined }),
          signal: controller.signal,
        });
        if (!response.ok) {
          const result = await response.json().catch(() => null);
          throw new Error(result?.error || "Speech is unavailable. Please try again.");
        }
        const blob = await response.blob();
        if (controller.signal.aborted || requestRef.current !== controller) return;
        const url = URL.createObjectURL(blob);
        objectURL.current = url;
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => { if (requestRef.current === controller) cancel(); };
        audio.onerror = () => {
          if (requestRef.current !== controller) return;
          cancel();
          toast("The voice could not play. Press Speak to try again.", "warning");
        };
        await audio.play();
      };
      void generate().catch((error: unknown) => {
        if (controller.signal.aborted || requestRef.current !== controller) return;
        cancel();
        const message = error instanceof DOMException && error.name === "NotAllowedError"
          ? "Press Speak to play the voice."
          : error instanceof Error ? error.message : "Speech could not play. Please try again.";
        toast(message, "warning");
      });
      return true;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    const language = /\p{Script=Devanagari}/u.test(text) ? "hi-IN" : "en-IN";
    const voice = deviceVoices.find(voice => voice.voiceURI === voiceURI) ?? deviceVoices.find(voice => voice.lang === language);
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang ?? language;
    utterance.rate = rate;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    return true;
  }, [supported, usingAzure, voiceURI, rate, cancel, deviceVoices]);

  return { supported, speaking, azureEnabled, voices, speak, cancel };
}
