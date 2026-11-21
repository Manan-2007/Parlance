import { useEffect, useId, useState, type ReactNode } from "react";
import { Accessibility, BellRing, Camera, Download, GraduationCap, Languages, Lock, RotateCcw, SlidersHorizontal, Sparkles, Trash2, UserRound, Volume2, WalletCards } from "lucide-react";
import { Link } from "react-router-dom";
import { InstallAppButton } from "@/app/pwa";
import { AboutMeDialog } from "@/features/cards/CardDialogs";
import { medicalList } from "@/features/cards/useShowCard";
import { useCards } from "@/stores/cards";
import { EMPTY_PROFILE } from "@/lib/visitCard";
import { useSoundRuntime } from "@/services/sound/useSoundAlerts";
import { Pal } from "@/components/brand/Pal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { Select } from "@/components/ui/Select";
import { StatusPill } from "@/components/ui/Status";
import { SwitchRow } from "@/components/ui/Switch";
import { toast } from "@/components/ui/Toaster";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useSpeechOutput } from "@/services/speech/useSpeechOutput";
import { useHistory } from "@/stores/history";
import { useLearn } from "@/stores/learn";
import {
  DEFAULT_SERVICE_URL,
  RETENTION_LABELS,
  useSettings,
  type AvatarView,
  type MotionPreference,
  type PlaybackSpeed,
  type Retention,
  type SpeechLanguage,
  type TextSize,
} from "@/stores/settings";
import { WorkspaceHeader } from "../shared/WorkspaceHeader";

/* Each section gets its own colour chip; the heading always names it. */
const SECTION_TONES: Record<string, string> = {
  language: "bg-tangerine-400 text-navy",
  signer: "bg-cobalt-400 text-white",
  audio: "bg-sun-400 text-navy",
  camera: "bg-forest-400 text-white",
  accessibility: "bg-bubblegum-400 text-navy",
  privacy: "bg-navy text-white",
  cards: "bg-danger text-white",
};

const SECTIONS = [
  { id: "language", label: "Language", icon: Languages },
  { id: "signer", label: "Signer", icon: Sparkles },
  { id: "audio", label: "Audio", icon: Volume2 },
  { id: "camera", label: "Camera and microphone", icon: Camera },
  { id: "learning", label: "Learning", icon: GraduationCap },
  { id: "cards", label: "Cards and alerts", icon: WalletCards },
  { id: "accessibility", label: "Accessibility", icon: Accessibility },
  { id: "privacy", label: "Privacy and data", icon: Lock },
];

function Section({ id, title, description, icon, children }: { id: string; title: string; description: string; icon: ReactNode; children: ReactNode }) {
  return (
    <Card id={id} className="scroll-mt-24">
      <div className="flex items-start gap-3.5 border-b border-line px-5 py-5 sm:px-6">
        <span className={`inline-flex size-11 shrink-0 items-center justify-center rounded-full [&_svg]:size-5 ${SECTION_TONES[id] ?? "bg-sun-400 text-navy"}`} aria-hidden>
          {icon}
        </span>
        <div>
          <h2 className="text-[1.375rem] leading-7 font-extrabold tracking-[-0.035em]">{title}</h2>
          <p className="mt-0.5 text-sm text-ink-3">{description}</p>
        </div>
      </div>
      <div className="divide-y divide-line px-5 sm:px-6">{children}</div>
    </Card>
  );
}

type PermissionView = "granted" | "denied" | "prompt" | "unknown";

function usePermission(name: "camera" | "microphone"): PermissionView {
  const [state, setState] = useState<PermissionView>("unknown");
  useEffect(() => {
    let status: PermissionStatus | null = null;
    const sync = () => status && setState(status.state as PermissionView);
    navigator.permissions
      ?.query({ name: name as PermissionName })
      .then((result) => {
        status = result;
        sync();
        result.addEventListener("change", sync);
      })
      .catch(() => setState("unknown"));
    return () => status?.removeEventListener("change", sync);
  }, [name]);
  return state;
}

function PermissionRow({ label, state, usage }: { label: string; state: PermissionView; usage: string }) {
  const pill =
    state === "granted"
      ? { tone: "success" as const, text: "Allowed" }
      : state === "denied"
        ? { tone: "danger" as const, text: "Blocked" }
        : state === "prompt"
          ? { tone: "idle" as const, text: "Not asked yet" }
          : { tone: "off" as const, text: "Unknown" };
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div>
        <p className="text-[0.9375rem] font-semibold text-ink">{label}</p>
        <p className="mt-0.5 text-sm leading-5 text-ink-3">{usage}</p>
        {state === "denied" && (
          <p className="mt-1 text-sm leading-5 text-danger">
            Blocked for this site. Change it from the site settings icon in your browser&rsquo;s address bar.
          </p>
        )}
      </div>
      <StatusPill tone={pill.tone} srPrefix={`${label} permission:`}>
        {pill.text}
      </StatusPill>
    </div>
  );
}

export function SettingsPage() {
  useDocumentTitle("Settings");
  const s = useSettings();
  const historyCount = useHistory((h) => h.entries.length);
  const clearHistory = useHistory((h) => h.clear);
  const speech = useSpeechOutput();
  const cameraPermission = usePermission("camera");
  const micPermission = usePermission("microphone");
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [serviceDraft, setServiceDraft] = useState(s.serviceUrl);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [pendingRetention, setPendingRetention] = useState<Retention | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [confirmCards, setConfirmCards] = useState(false);
  const cardsProfile = useCards((c) => c.profile);
  const cardsCustom = useCards((c) => c.custom.length);
  const listening = useSoundRuntime((r) => r.status === "listening");
  const savedDetails = medicalList(cardsProfile).length;
  const [confirmLearnReset, setConfirmLearnReset] = useState(false);
  const learn = useLearn();
  const learnedCount = Object.keys(learn.cards).length;
  const serviceId = useId();

  useEffect(() => {
    navigator.mediaDevices
      ?.enumerateDevices()
      .then((all) => setCameras(all.filter((d) => d.kind === "videoinput")))
      .catch(() => {});
  }, [cameraPermission]);

  const saveService = () => {
    const value = serviceDraft.trim();
    if (!/^wss?:\/\/[^\s]+$/.test(value)) {
      setServiceError("Use a WebSocket address that starts with ws:// or wss://");
      return;
    }
    setServiceError(null);
    s.set("serviceUrl", value);
    toast("Recognition service address saved");
  };

  const chooseRetention = (value: Retention) => {
    if (value === "off" && historyCount > 0) {
      setPendingRetention(value);
      return;
    }
    s.set("retention", value);
    toast(`History: ${RETENTION_LABELS[value].toLowerCase()}`);
  };

  return (
    <div className="container-app py-10 sm:py-14">
      <WorkspaceHeader
        title="Settings"
        description="Preferences are saved in this browser. Nothing here is sent anywhere."
        icon={<SlidersHorizontal />}
        tone="sun"
        illustration={<Pal pose="rest" outfit="cobalt" skin="deep" hair="curly" className="h-32" />}
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-[14rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,48rem)]">
        <nav aria-label="Settings sections" className="hidden lg:block">
          <ul className="sticky top-24 space-y-0.5">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="flex items-center gap-2.5 rounded-full px-2 py-1.5 text-sm font-bold text-ink-2 transition-colors hover:bg-surface hover:text-navy"
                >
                  <span className={`inline-flex size-7 items-center justify-center rounded-full ${SECTION_TONES[id] ?? ""}`} aria-hidden>
                    <Icon className="size-3.5" />
                  </span>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-6">
          <Section id="language" title="Language" description="How spoken input is understood." icon={<Languages />}>
            <Field label="Voice input language" description="Language the browser uses to transcribe speech.">
              {({ id, describedBy }) => (
                <Select id={id} aria-describedby={describedBy} value={s.speechLanguage} onChange={(e) => s.set("speechLanguage", e.target.value as SpeechLanguage)} className="w-full">
                  <option value="en-IN">English (India)</option>
                  <option value="en-US">English (US)</option>
                  <option value="en-GB">English (UK)</option>
                  <option value="hi-IN">Hindi (India)</option>
                </Select>
              )}
            </Field>
            <SwitchRow
              label="Translate as soon as I stop speaking"
              description="Off: review the transcribed text first, then press Translate."
              checked={s.autoTranslate}
              onChange={(v) => s.set("autoTranslate", v)}
            />
          </Section>

          <Section id="signer" title="Signer" description="Defaults for the 3D signer. You can also change these beside the signer." icon={<Sparkles />}>
            <Field label="Default view" description="The whole signer shows the head and upper body. Hands focus frames the hands more closely.">
              {() => (
                <Segmented<AvatarView>
                  label="Default view"
                  block
                  value={s.avatarView}
                  onChange={(v) => s.set("avatarView", v)}
                  options={[
                    { value: "figure", label: "Whole signer" },
                    { value: "hands", label: "Hands focus" },
                  ]}
                />
              )}
            </Field>
            <Field label="Playback speed" description="Slower speeds keep every handshape readable.">
              {() => (
                <Segmented<PlaybackSpeed>
                  label="Playback speed"
                  block
                  value={s.playbackSpeed}
                  onChange={(v) => s.set("playbackSpeed", v)}
                  options={[
                    { value: 0.5, label: "0.5×" },
                    { value: 0.75, label: "0.75×" },
                    { value: 1, label: "1×" },
                  ]}
                />
              )}
            </Field>
            <SwitchRow label="Mirror the signer" description="Useful when copying a sign: the signer's right hand appears on your right." checked={s.mirror} onChange={(v) => s.set("mirror", v)} />
            <SwitchRow label="Loop phrases" description="Repeat each phrase until you pause it." checked={s.loop} onChange={(v) => s.set("loop", v)} />
            <SwitchRow label="Show captions on the signer" description="The word being signed, shown in large text over the stage." checked={s.showCaptions} onChange={(v) => s.set("showCaptions", v)} />
          </Section>

          <Section id="audio" title="Audio" description="Spoken output for sentences built from signs." icon={<Volume2 />}>
            <SwitchRow
              label="Speak recognised sentences aloud"
              description={speech.supported ? "Sentences are always shown on screen as well." : "This browser has no speech output. Sentences are still shown on screen."}
              checked={s.voiceOutput && speech.supported}
              disabled={!speech.supported}
              onChange={(v) => s.set("voiceOutput", v)}
            />
            <Field label="Voice" description={speech.azureEnabled ? "Azure neural voices use a soft delivery. Spoken text is sent to Azure to generate audio." : "Voices available on this device."}>
              {({ id, describedBy }) => (
                <Select
                  id={id}
                  aria-describedby={describedBy}
                  value={s.voiceURI ?? ""}
                  disabled={!speech.supported || speech.voices.length === 0}
                  onChange={(e) => s.set("voiceURI", e.target.value || null)}
                  className="w-full"
                >
                  <option value="">{speech.azureEnabled ? "Soft voice · Neerja (Azure default)" : "Automatic (English, India where available)"}</option>
                  {speech.voices.map((voice) => (
                    <option key={voice.voiceURI} value={voice.voiceURI}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Speaking rate" description={`${s.speechRate.toFixed(1)}× normal speed`}>
              {({ id, describedBy }) => (
                <div className="flex items-center gap-3">
                  <input
                    id={id}
                    aria-describedby={describedBy}
                    type="range"
                    min={0.7}
                    max={1.3}
                    step={0.1}
                    value={s.speechRate}
                    disabled={!speech.supported}
                    onChange={(e) => s.set("speechRate", Number(e.target.value))}
                    className="h-11 flex-1"
                  />
                  <Button size="sm" variant="secondary" disabled={!speech.supported} onClick={() => speech.speak("Hello. This is how Parlance will sound.")}>
                    Test
                  </Button>
                </div>
              )}
            </Field>
          </Section>

          <Section id="camera" title="Camera and microphone" description="Devices are used only while you have turned them on." icon={<Camera />}>
            <PermissionRow label="Camera" state={cameraPermission} usage="Used only while the camera is on in Sign to text. Video stays on this device." />
            <PermissionRow label="Microphone" state={micPermission} usage="Used only while you press Speak in Speech to sign." />
            <Field label="Preferred camera" description={cameras.some((c) => c.label) ? "Used when you start the camera." : "Camera names appear after you allow camera access once."}>
              {({ id, describedBy }) => (
                <Select
                  id={id}
                  aria-describedby={describedBy}
                  value={s.cameraId ?? ""}
                  onChange={(e) => s.set("cameraId", e.target.value || null)}
                  disabled={cameras.length === 0}
                  className="w-full"
                >
                  <option value="">Default camera</option>
                  {cameras.map((camera, index) =>
                    camera.deviceId ? (
                      <option key={camera.deviceId} value={camera.deviceId}>
                        {camera.label || `Camera ${index + 1}`}
                      </option>
                    ) : null,
                  )}
                </Select>
              )}
            </Field>
            <SwitchRow label="Show hand landmarks" description="Draw the tracked hand points over the camera preview." checked={s.showLandmarks} onChange={(v) => s.set("showLandmarks", v)} />
            <SwitchRow label="Show framing guide" description="Outline where your head, shoulders and hands should be." checked={s.showFramingGuide} onChange={(v) => s.set("showFramingGuide", v)} />
            <SwitchRow
              label="Finish a sentence after a pause"
              description="After 3.5 seconds without a new sign, the sentence is completed and saved."
              checked={s.autoFinishSentence}
              onChange={(v) => s.set("autoFinishSentence", v)}
            />
            <Field
              label="Model score threshold"
              description={`${Math.round(s.confidenceThreshold * 100)}%. The bundled model uses 56% by default. Raising this accepts fewer words.`}
            >
              {({ id, describedBy }) => (
                <div className="flex items-center gap-3">
                  <input
                    id={id}
                    aria-describedby={describedBy}
                    type="range"
                    min={0.56}
                    max={0.95}
                    step={0.01}
                    value={s.confidenceThreshold}
                    onChange={(e) => s.set("confidenceThreshold", Number(e.target.value))}
                    className="h-11 flex-1"
                  />
                  <button type="button" onClick={() => s.set("confidenceThreshold", 0.56)} className="min-h-11 shrink-0 text-sm font-semibold text-royal hover:underline">Use 56% default</button>
                </div>
              )}
            </Field>
            <div className="py-4">
              <label htmlFor={serviceId} className="text-[0.9375rem] font-semibold text-ink">
                Recognition service address
              </label>
              <p id={`${serviceId}-hint`} className="mt-0.5 text-sm leading-5 text-ink-3">
                Where hand-position numbers are sent for sign recognition. Run it on this computer to keep everything local.
              </p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  id={serviceId}
                  value={serviceDraft}
                  onChange={(e) => setServiceDraft(e.target.value)}
                  aria-describedby={`${serviceId}-hint${serviceError ? ` ${serviceId}-error` : ""}`}
                  aria-invalid={serviceError ? true : undefined}
                  spellCheck={false}
                  autoCapitalize="off"
                  className="h-11 flex-1 rounded-2xl border-2 border-line bg-surface px-4 text-[0.9375rem] font-semibold text-ink focus-visible:border-cobalt-400 aria-invalid:border-danger"
                />
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={saveService} disabled={serviceDraft.trim() === s.serviceUrl}>
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setServiceDraft(DEFAULT_SERVICE_URL);
                      setServiceError(null);
                      s.set("serviceUrl", DEFAULT_SERVICE_URL);
                    }}
                    disabled={s.serviceUrl === DEFAULT_SERVICE_URL && serviceDraft === DEFAULT_SERVICE_URL}
                  >
                    Use default
                  </Button>
                </div>
              </div>
              {serviceError && (
                <p id={`${serviceId}-error`} className="mt-1.5 text-sm font-medium text-danger">
                  {serviceError}
                </p>
              )}
            </div>
          </Section>

          <Section id="learning" title="Learning" description="How lessons and practice work for you. Progress stays in this browser." icon={<GraduationCap />}>
            <SwitchRow
              checked={learn.leftHanded}
              onChange={(on) => learn.setPreference("leftHanded", on)}
              label="I sign left-handed"
              description="Practice compares your signing with the reference mirrored, so your left hand leads."
            />
            <SwitchRow
              checked={learn.mirror}
              onChange={(on) => learn.setPreference("mirror", on)}
              label="Mirror the signer"
              description="Show reference signs like a mirror, so the signer's right hand appears on your right and is easier to copy."
            />
            <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[0.9375rem] font-semibold text-ink">Practice log</p>
                <p className="mt-0.5 text-sm text-ink-3">
                  {learn.practiceLog.length === 0
                    ? "Scores from camera practice will be listed here."
                    : `${learn.practiceLog.length} camera attempts with their scores, tips and your ratings. Numbers only, no video. Download it to help tune the feedback.`}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={learn.practiceLog.length === 0}
                  leading={<Download aria-hidden />}
                  onClick={() => {
                    const url = URL.createObjectURL(new Blob([JSON.stringify({ "parlance-practice-log": 1, entries: learn.practiceLog }, null, 1)], { type: "application/json" }));
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "parlance-practice-log.json";
                    document.body.append(a);
                    a.click();
                    a.remove();
                    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
                  }}
                >
                  Download
                </Button>
                <Button variant="ghost" size="sm" disabled={learn.practiceLog.length === 0} onClick={() => learn.clearPracticeLog()}>
                  Clear
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[0.9375rem] font-semibold text-ink">Reset learning progress</p>
                <p className="mt-0.5 text-sm text-ink-3">
                  {learnedCount === 0 ? "No progress saved yet." : `${learnedCount} sign${learnedCount === 1 ? "" : "s"}, finished lessons and saved phrases.`}
                </p>
              </div>
              <Button variant="danger" size="sm" disabled={learnedCount === 0 && learn.phrases.length === 0 && Object.keys(learn.lessons).length === 0} onClick={() => setConfirmLearnReset(true)} leading={<Trash2 aria-hidden />}>
                Reset progress
              </Button>
            </div>
          </Section>

          <Section id="cards" title="Cards and alerts" description="Your details for emergency and medical cards, and sound alerts at home." icon={<WalletCards />}>
            <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[0.9375rem] font-semibold text-ink">About me</p>
                <p className="mt-0.5 text-sm text-ink-3">
                  {savedDetails
                    ? `${savedDetails} detail${savedDetails === 1 ? "" : "s"} saved${cardsProfile.contactName ? `, emergency contact ${cardsProfile.contactName}` : ""}.`
                    : "Emergency contact, allergies and medicines. They fill in your cards."}
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setAboutOpen(true)} leading={<UserRound aria-hidden />}>
                {savedDetails ? "Edit" : "Add details"}
              </Button>
            </div>
            <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[0.9375rem] font-semibold text-ink">Sound alerts</p>
                <p className="mt-0.5 text-sm text-ink-3">{listening ? "Listening now." : "Flash and vibrate for the doorbell, alarms and more."}</p>
              </div>
              <Link to="/app/sound-alerts" className="press inline-flex h-9 items-center gap-2 rounded-full border-2 border-navy bg-surface px-3.5 text-[0.8125rem] font-bold text-navy hover:bg-sun-100">
                <BellRing className="size-4" aria-hidden /> Open sound alerts
              </Link>
            </div>
            <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[0.9375rem] font-semibold text-ink">Use Parlance offline</p>
                <p className="mt-0.5 text-sm text-ink-3">Install it to open cards and captions from your home screen, even without signal.</p>
              </div>
              <InstallAppButton />
            </div>
          </Section>

          <Section id="accessibility" title="Accessibility" description="Applied across Parlance on this device." icon={<Accessibility />}>
            <Field label="Text size" description="Scales all text and controls.">
              {() => (
                <Segmented<TextSize>
                  label="Text size"
                  block
                  value={s.textSize}
                  onChange={(v) => s.set("textSize", v)}
                  options={[
                    { value: "default", label: "Default" },
                    { value: "large", label: "Large" },
                    { value: "larger", label: "Larger" },
                  ]}
                />
              )}
            </Field>
            <Field label="Motion" description="Reduced turns off decorative animation and autoplay. System follows your device setting.">
              {() => (
                <Segmented<MotionPreference>
                  label="Motion"
                  block
                  value={s.motion}
                  onChange={(v) => s.set("motion", v)}
                  options={[
                    { value: "system", label: "System" },
                    { value: "reduce", label: "Reduced" },
                    { value: "full", label: "Full" },
                  ]}
                />
              )}
            </Field>
          </Section>

          <Section id="privacy" title="Privacy and data" description="What Parlance keeps, and for how long." icon={<Lock />}>
            <Field label="Keep translation history" description="Text only. Camera video and audio are never stored.">
              {({ id, describedBy }) => (
                <Select id={id} aria-describedby={describedBy} value={s.retention} onChange={(e) => chooseRetention(e.target.value as Retention)} className="w-full">
                  {(Object.keys(RETENTION_LABELS) as Retention[]).map((key) => (
                    <option key={key} value={key}>
                      {RETENTION_LABELS[key]}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[0.9375rem] font-semibold text-ink">Delete history now</p>
                <p className="mt-0.5 text-sm text-ink-3">
                  {historyCount === 0 ? "No saved entries." : `${historyCount} ${historyCount === 1 ? "entry" : "entries"} saved in this browser.`}
                </p>
              </div>
              <Button variant="danger" size="sm" disabled={historyCount === 0} onClick={() => setConfirmClear(true)} leading={<Trash2 aria-hidden />}>
                Delete history
              </Button>
            </div>
            <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[0.9375rem] font-semibold text-ink">Reset all settings</p>
                <p className="mt-0.5 text-sm text-ink-3">Restore every preference on this page to its default.</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setConfirmReset(true)} leading={<RotateCcw aria-hidden />}>
                Reset settings
              </Button>
            </div>
            <ul className="space-y-1.5 py-4 text-sm leading-6 text-ink-2">
              <li>No account, no sign-in, no analytics.</li>
              <li>Camera frames are processed on this device and never recorded or uploaded.</li>
              <li>Only hand landmark positions are sent to the recognition service address above.</li>
              <li>Voice input is transcribed by your browser&rsquo;s own speech service.</li>
              <li>About me, your cards and visit card stay in this browser. Sound alerts listen on this device and record nothing.</li>
            </ul>
            <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[0.9375rem] font-semibold text-ink">Delete my card details</p>
                <p className="mt-0.5 text-sm text-ink-3">About me, your own cards and your visit card.</p>
              </div>
              <Button variant="danger" size="sm" disabled={!savedDetails && !cardsCustom} onClick={() => setConfirmCards(true)} leading={<Trash2 aria-hidden />}>
                Delete details
              </Button>
            </div>
          </Section>
        </div>
      </div>

      <AboutMeDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
      <ConfirmDialog
        open={confirmCards}
        onCancel={() => setConfirmCards(false)}
        onConfirm={() => {
          useCards.setState({ profile: EMPTY_PROFILE, custom: [], recent: [] });
          useCards.getState().clearVisit();
          setConfirmCards(false);
          toast("Card details deleted");
        }}
        title="Delete your card details?"
        description="This removes About me, your own cards and your visit card from this browser. It can't be undone."
        confirmLabel="Delete details"
      />
      <ConfirmDialog
        open={pendingRetention !== null}
        onCancel={() => setPendingRetention(null)}
        onConfirm={() => {
          s.set("retention", "off");
          setPendingRetention(null);
          toast("History turned off and deleted");
        }}
        title="Turn history off?"
        description={`New translations won't be saved, and the ${historyCount} saved ${historyCount === 1 ? "entry" : "entries"} will be deleted now.`}
        confirmLabel="Turn off and delete"
      />
      <ConfirmDialog
        open={confirmClear}
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          clearHistory();
          setConfirmClear(false);
          toast("History deleted");
        }}
        title="Delete all history?"
        description="This permanently removes every saved translation from this browser."
        confirmLabel="Delete history"
      />
      <ConfirmDialog
        open={confirmReset}
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          s.reset();
          setServiceDraft(DEFAULT_SERVICE_URL);
          setConfirmReset(false);
          toast("Settings restored to defaults");
        }}
        title="Reset all settings?"
        description="Every preference returns to its default. Your history is not affected."
        confirmLabel="Reset settings"
        confirmVariant="primary"
      />
      <ConfirmDialog
        open={confirmLearnReset}
        onCancel={() => setConfirmLearnReset(false)}
        onConfirm={() => {
          learn.reset();
          setConfirmLearnReset(false);
          toast("Learning progress reset");
        }}
        title="Reset learning progress?"
        description="Your review schedule, finished lessons and saved phrases are deleted from this browser. This can't be undone."
        confirmLabel="Reset progress"
      />
    </div>
  );
}
