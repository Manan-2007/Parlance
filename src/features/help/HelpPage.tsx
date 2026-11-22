import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  AudioLines,
  BellRing,
  BookOpen,
  Captions,
  WalletCards,
  LifeBuoy,
  Check,
  CircleDashed,
  Copy,
  Hand,
  Keyboard,
  Lightbulb,
  Lock,
  Play,
  Search,
  Server,
  ShieldCheck,
  Sun,
  UserRound,
  Wallpaper,
} from "lucide-react";
import { Pal } from "@/components/brand/Pal";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Kbd } from "@/components/ui/Kbd";
import { Segmented } from "@/components/ui/Segmented";
import { toast } from "@/components/ui/Toaster";
import { DirectionLabel } from "@/components/layout/DirectionLabel";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useRecognitionMetrics } from "@/services/signs/library";
import { readableSignLabel, SUPPORTED_TOKENS } from "@/translation/islVocabulary.js";
import { useSettings } from "@/stores/settings";
import { WorkspaceHeader } from "../shared/WorkspaceHeader";

const NAV = [
  { id: "start", label: "Getting started" },
  { id: "everyday", label: "Cards, captions and alerts" },
  { id: "camera", label: "Camera tips" },
  { id: "vocabulary", label: "Supported signs" },
  { id: "limits", label: "What it can and can't do" },
  { id: "privacy", label: "Privacy" },
  { id: "service", label: "Recognition service" },
  { id: "keyboard", label: "Keyboard" },
];

function HelpSection({ id, title, children }: { id: string; title: string; icon: ReactNode; children: ReactNode }) {
  const index = String(NAV.findIndex((n) => n.id === id) + 1).padStart(2, "0");
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24">
      <div className="mb-5 flex items-center gap-3">
        <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-navy px-2 text-sm font-extrabold text-sun-400 tabular-nums">
          <span className="sr-only">Section </span>
          {index}
        </span>
        <h2 id={`${id}-title`} className="text-[1.875rem] leading-tight font-extrabold tracking-[-0.045em]">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function Steps({ items }: { items: string[] }) {
  return (
    <ol className="mt-3 space-y-2.5">
      {items.map((item, i) => (
        <li key={item} className="flex gap-3 text-[0.9375rem] leading-6 text-ink-2">
          <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-sun-400 text-xs font-extrabold text-navy tabular-nums">
            {i + 1}
          </span>
          {item}
        </li>
      ))}
    </ol>
  );
}

function CommandBlock({ lines }: { lines: string[] }) {
  const text = lines.join("\n");
  return (
    <div className="mt-3 flex items-start justify-between gap-3 rounded-[1.25rem] bg-navy p-4">
      <div className="min-w-0 space-y-1 overflow-x-auto text-sm font-bold break-words text-sun-300">
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
      <button
        type="button"
        onClick={() =>
          navigator.clipboard
            .writeText(text)
            .then(() => toast("Commands copied"))
            .catch(() => toast("Copying isn't allowed in this browser", "warning"))
        }
        className="press inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 focus-visible:outline-gold"
        aria-label="Copy commands"
        title="Copy commands"
      >
        <Copy className="size-4" aria-hidden />
      </button>
    </div>
  );
}

type VocabFilter = "all" | "recognised";

export function HelpPage() {
  useDocumentTitle("Help");
  const metrics = useRecognitionMetrics();
  const serviceUrl = useSettings((s) => s.serviceUrl);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<VocabFilter>("all");

  const signs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SUPPORTED_TOKENS
      .map((gloss) => ({ gloss, english: readableSignLabel(gloss), recognised: metrics.verified.has(gloss.toLowerCase().replaceAll("_", "")) }))
      .filter((s) => (filter === "all" || s.recognised) && (!q || s.english.toLowerCase().includes(q) || s.gloss.toLowerCase().includes(q)))
      .sort((a, b) => a.english.localeCompare(b.english));
  }, [metrics, query, filter]);

  return (
    <div className="container-app py-10 sm:py-14">
      <WorkspaceHeader
        title="Help"
        description="How to use Parlance well, what it supports today, and how your data is handled."
        icon={<LifeBuoy />}
        tone="forest"
        illustration={<Pal pose="wave" outfit="tangerine" skin="light" hair="bun" animate className="h-32" />}
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-[14rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,52rem)]">
        <nav aria-label="Help sections" className="hidden lg:block">
          <ul className="sticky top-24 space-y-0.5">
            {NAV.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="block rounded-full px-3.5 py-2 text-sm font-bold text-ink-2 hover:bg-surface hover:text-navy">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-14">
          <HelpSection id="start" title="Getting started" icon={<Lightbulb />}>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-5">
                <p className="flex items-center gap-2.5 text-base font-bold text-navy">
                  <span className="inline-flex size-10 items-center justify-center rounded-full bg-tangerine-400 text-navy" aria-hidden>
                    <AudioLines className="size-[1.125rem]" />
                  </span>
                  <DirectionLabel from="Speech" to="Sign" />
                </p>
                <p className="mt-1 text-sm text-ink-3">For the hearing person</p>
                <Steps
                  items={[
                    "Press Speak and say a short sentence, or type it.",
                    "Parlance shows the ISL gloss: the signs in ISL order.",
                    "The 3D signer performs it. Slow it down, replay it, or tap a sign to repeat it.",
                  ]}
                />
                <ButtonLink to="/app/speech-to-sign" size="sm" className="mt-5">
                  Open speech to sign
                </ButtonLink>
              </Card>
              <Card className="p-5">
                <p className="flex items-center gap-2.5 text-base font-bold text-navy">
                  <span className="inline-flex size-10 items-center justify-center rounded-full bg-forest-400 text-white" aria-hidden>
                    <Hand className="size-[1.125rem]" />
                  </span>
                  <DirectionLabel from="Sign" to="Text" />
                </p>
                <p className="mt-1 text-sm text-ink-3">For the ISL signer</p>
                <Steps
                  items={[
                    "Start the camera and keep your hands and wrists in view.",
                    "Sign one word at a time, with a short pause between signs.",
                    "Recognised signs build a sentence that is shown on screen and can be spoken aloud.",
                  ]}
                />
                <ButtonLink to="/app/sign-to-text" size="sm" variant="secondary" className="mt-5">
                  Open sign to text
                </ButtonLink>
              </Card>
            </div>
          </HelpSection>

          <HelpSection id="everyday" title="Cards, captions and alerts" icon={<WalletCards />}>
            <p className="max-w-2xl text-[0.9375rem] leading-6 text-ink-2">
              Everything Parlance does is listed on <Link to="/app" className="font-bold text-royal hover:underline">Home</Link>, grouped by the
              situation you are in. Emergency is the red button at the top of every page.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Card className="p-5">
                <p className="flex items-center gap-2.5 text-base font-bold text-navy">
                  <span className="inline-flex size-10 items-center justify-center rounded-full bg-sun-400 text-navy" aria-hidden>
                    <WalletCards className="size-[1.125rem]" />
                  </span>
                  Cards
                </p>
                <p className="mt-1 text-sm text-ink-3">At counters, clinics and in emergencies</p>
                <Steps
                  items={[
                    "Pick a place, then tap a card. It fills the screen, in English and Hindi.",
                    "Turn it to face the other person, or press Read aloud.",
                    "They reply by tapping, typing or speaking; you see it big or signed.",
                  ]}
                />
                <ButtonLink to="/app/cards" size="sm" variant="secondary" className="mt-5">
                  Open cards
                </ButtonLink>
              </Card>
              <Card className="p-5">
                <p className="flex items-center gap-2.5 text-base font-bold text-navy">
                  <span className="inline-flex size-10 items-center justify-center rounded-full bg-tangerine-400 text-navy" aria-hidden>
                    <Captions className="size-[1.125rem]" />
                  </span>
                  Live captions
                </p>
                <p className="mt-1 text-sm text-ink-3">In Speech → Sign, for classes and announcements</p>
                <Steps
                  items={[
                    "Choose the language being spoken and press Start captions.",
                    "Lines appear in big text as people speak. Make them bigger with Aa.",
                    "Tap Sign on any line to watch it signed. Copy or save before you leave.",
                  ]}
                />
                <ButtonLink to="/app/speech-to-sign?view=captions" size="sm" variant="secondary" className="mt-5">
                  Open live captions
                </ButtonLink>
              </Card>
              <Card className="p-5">
                <p className="flex items-center gap-2.5 text-base font-bold text-navy">
                  <span className="inline-flex size-10 items-center justify-center rounded-full bg-cobalt-400 text-white" aria-hidden>
                    <BellRing className="size-[1.125rem]" />
                  </span>
                  Sound alerts
                </p>
                <p className="mt-1 text-sm text-ink-3">At home</p>
                <Steps
                  items={[
                    "Choose the sounds that matter: doorbell, alarms, a baby, the cooker.",
                    "Press Start listening and keep Parlance open with the screen on.",
                    "The screen flashes (and Android phones vibrate) when one is heard.",
                  ]}
                />
                <ButtonLink to="/app/sound-alerts" size="sm" variant="secondary" className="mt-5">
                  Open sound alerts
                </ButtonLink>
              </Card>
            </div>
          </HelpSection>

          <HelpSection id="camera" title="Camera tips" icon={<UserRound />}>
            <Card className="grid gap-px overflow-hidden bg-line sm:grid-cols-2">
              {[
                { icon: UserRound, title: "Both hands in view", body: "Keep your complete signing movement inside the frame, including fingertips and wrists." },
                { icon: Sun, title: "Even, front-facing light", body: "Avoid a bright window behind you. Light on your hands matters most." },
                { icon: Wallpaper, title: "Plain background", body: "Busy patterns and skin-coloured backgrounds make hands harder to track." },
                { icon: Hand, title: "One sign at a time", body: "Hold each sign briefly, then lower your hands before the next one." },
              ].map(({ icon: Icon, title, body }) => (
                <div key={title} className="flex gap-3 bg-surface p-5">
                  <Icon className="mt-0.5 size-5 shrink-0 text-royal" aria-hidden />
                  <div>
                    <p className="font-bold text-navy">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-ink-2">{body}</p>
                  </div>
                </div>
              ))}
            </Card>
          </HelpSection>

          <HelpSection id="vocabulary" title="Supported signs" icon={<BookOpen />}>
            <p className="max-w-2xl text-[0.9375rem] leading-7 text-ink-2">
              The avatar can perform {SUPPORTED_TOKENS.length} word and phrase signs, plus letters and digits. The camera filter shows overlapping vocabulary from the separate recognition service.
            </p>
            <Card className="mt-4">
              <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
                <label className="relative block sm:w-72">
                  <span className="sr-only">Search signs</span>
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search, for example: doctor"
                    className="h-11 w-full rounded-full border-2 border-navy bg-surface pr-4 pl-9 text-sm font-semibold text-ink placeholder:text-ink-3 focus-visible:border-cobalt-400"
                  />
                </label>
                <Segmented<VocabFilter>
                  label="Which signs to show"
                  size="sm"
                  value={filter}
                  onChange={setFilter}
                  options={[
                    { value: "all", label: "All signs" },
                    { value: "recognised", label: "Camera recognises" },
                  ]}
                />
              </div>
              <p className="sr-only" role="status" aria-live="polite">
                {signs.length} signs shown
              </p>
              {signs.length === 0 ? (
                <EmptyState icon={<Search />} title="No signs match">
                  Try a related word. In the studio, unfamiliar names and words can be fingerspelled.
                </EmptyState>
              ) : (
                <ul className="grid max-h-[28rem] grid-cols-1 gap-px overflow-y-auto bg-line sm:grid-cols-2 lg:grid-cols-3">
                  {signs.map((sign) => (
                    <li key={sign.gloss} className="flex items-center justify-between gap-2 bg-surface px-4 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold tracking-[0.03em] text-navy uppercase">{sign.english}</p>
                        {sign.recognised && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
                            <ShieldCheck className="size-3" aria-hidden /> Camera
                          </span>
                        )}
                      </div>
                      <Link
                        to={`/app/speech-to-sign?text=${encodeURIComponent(sign.english)}`}
                        className="press inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-cobalt-100 px-3 text-[0.8125rem] font-bold text-cobalt-800 hover:bg-cobalt-200"
                        aria-label={`Watch the sign for ${sign.english}`}
                      >
                        <Play className="size-3.5" aria-hidden /> Watch
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </HelpSection>

          <HelpSection id="limits" title="What Parlance can and can't do" icon={<CircleDashed />}>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-5">
                <p className="font-bold text-navy">Works today</p>
                <ul className="mt-3 space-y-2.5 text-[0.9375rem] leading-6 text-ink-2">
                  {[
                    "English and Hindi speech or text to ISL gloss",
                    "The signing avatar playing word, letter and digit animations",
                    "Camera recognition of individual ISL words, with reviewable suggestions for uncertain matches",
                    "Recognised signs rebuilt into an English sentence, shown and spoken",
                    "Local history with retention you control",
                  ].map((item) => (
                    <li key={item} className="flex gap-2.5">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
              <Card className="p-5">
                <p className="font-bold text-navy">Not yet</p>
                <ul className="mt-3 space-y-2.5 text-[0.9375rem] leading-6 text-ink-2">
                  {[
                    ["Continuous signing", "Recognition reads one sign per two-second window. Fluent, connected signing is not recognised."],
                    ["Facial grammar", "The current avatar has no facial controls."],
                    ["Other input languages", "The current text rules support English and Hindi."],
                  ].map(([title, body]) => (
                    <li key={title} className="flex gap-2.5">
                      <CircleDashed className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
                      <span>
                        <span className="font-semibold text-ink">{title}.</span> {body}
                      </span>
                    </li>
                  ))}
                </ul>
                <Badge tone="neutral" className="mt-4">
                  Planned
                </Badge>
              </Card>
            </div>
            <p className="mt-4 rounded-[1.75rem] bg-sun-400 p-6 text-[0.9375rem] leading-7 font-medium text-navy">
              <span className="font-semibold text-navy">Parlance is not an interpreter.</span> It is a tool for short,
              concrete exchanges. For anything consequential, such as a diagnosis, consent or legal matters, use a
              qualified ISL interpreter.
            </p>
          </HelpSection>

          <HelpSection id="privacy" title="Privacy" icon={<Lock />}>
            <Card className="p-5">
              <ul className="space-y-2.5 text-[0.9375rem] leading-6 text-ink-2">
                {[
                  "There is no account and no analytics.",
                  "The camera runs only while you have turned it on. Frames are processed on this device and never recorded or uploaded.",
                  `For recognition, only hand landmark coordinates are sent to ${serviceUrl}.`,
                  "Voice input is transcribed by your browser's speech service. In Chrome this uses Google's servers.",
                  "Natural voice output sends the text you choose to speak to Parlance's server. Device voices can be selected in Settings.",
                  "History is text only and stays in this browser. You choose how long it is kept, and can delete it at any time.",
                ].map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-royal" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
              <ButtonLink to="/app/settings#privacy" size="sm" variant="secondary" className="mt-5">
                Privacy settings
              </ButtonLink>
            </Card>
          </HelpSection>

          <HelpSection id="service" title="Running the recognition service" icon={<Server />}>
            <Card className="p-5">
              <p className="text-[0.9375rem] leading-7 text-ink-2">
                The camera uses Parlance&rsquo;s bundled FastAPI service and trained ISL word model. Start both the app and recognition from the Parlance project folder:
              </p>
              <CommandBlock lines={["python3 -m venv .venv", "source .venv/bin/activate", "python -m pip install -r backend/requirements.txt", "npm run dev"]} />
              <p className="mt-3 text-sm leading-6 text-ink-3">
                Parlance connects to {serviceUrl}. To use a different address, change it in{" "}
                <Link to="/app/settings#camera" className="font-semibold text-royal hover:underline">
                  Settings
                </Link>
                .
              </p>
            </Card>
          </HelpSection>

          <HelpSection id="keyboard" title="Keyboard" icon={<Keyboard />}>
            <Card>
              <dl className="divide-y divide-line">
                {[
                  [["Enter"], "Sign the message (Shift + Enter adds a new line)"],
                  [["Tab"], "Move between controls"],
                  [["←", "→"], "Move within a set of options, such as playback speed"],
                  [["Space"], "Activate the focused button or switch"],
                  [["Esc"], "Close a dialog or menu"],
                ].map(([keys, label]) => (
                  <div key={label as string} className="flex items-center justify-between gap-4 px-5 py-3">
                    <dt className="text-[0.9375rem] text-ink-2">{label as string}</dt>
                    <dd className="flex shrink-0 gap-1">
                      {(keys as string[]).map((k) => (
                        <Kbd key={k}>{k}</Kbd>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>
          </HelpSection>
        </div>
      </div>
    </div>
  );
}
