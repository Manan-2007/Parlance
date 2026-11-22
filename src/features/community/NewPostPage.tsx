import { useId, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { Select } from "@/components/ui/Select";
import { toast } from "@/components/ui/Toaster";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { lengthProblem, LIMITS, meetupTimes, type PostInput, type SpaceId, type ThreadKind } from "@/community/model";
import { communityApi } from "@/services/community/api";
import { useCommunity } from "@/stores/community";
import { errorMessage, JoinForm, PostBox, SPACE_STYLE, SPACE_TITLE } from "./parts";

const KINDS: { value: ThreadKind; label: string }[] = [
  { value: "discussion", label: "Discussion" },
  { value: "question", label: "Question" },
  { value: "meetup", label: "Meetup" },
];

const HINTS: Record<ThreadKind, string> = {
  discussion: "Share an experience or start a conversation. Long posts are welcome here.",
  question: "Ask something specific. You can mark the reply that helped as the answer.",
  meetup: "Plan a meeting in person. On the day you open a live room, and everyone there joins with your code.",
};

const pad = (n: number) => String(n).padStart(2, "0");
const localDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const localTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export function NewPostPage() {
  useDocumentTitle("New post · Community");
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const member = useCommunity((s) => s.member);
  const startSpace = params.get("space");
  const [space, setSpace] = useState<SpaceId>(startSpace && startSpace in SPACE_STYLE ? (startSpace as SpaceId) : "everyday");
  const [kind, setKind] = useState<ThreadKind>(params.get("kind") === "meetup" ? "meetup" : params.get("kind") === "question" ? "question" : "discussion");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [input, setInput] = useState<PostInput>("typed");
  const defaults = useMemo(() => {
    const start = new Date(Date.now() + 24 * 3_600_000);
    start.setMinutes(0, 0, 0);
    start.setHours(10);
    return { date: localDate(start), start: "10:00", end: "12:00" };
  }, []);
  const [date, setDate] = useState(defaults.date);
  const [start, setStart] = useState(defaults.start);
  const [end, setEnd] = useState(defaults.end);
  const [place, setPlace] = useState("");
  const [city, setCity] = useState(member?.city ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ids = { space: useId(), title: useId(), date: useId(), start: useId(), end: useId(), place: useId(), city: useId(), hint: useId() };

  const startNow = () => {
    const now = new Date();
    const later = new Date(now.getTime() + 2 * 3_600_000);
    setDate(localDate(now));
    setStart(localTime(now));
    setEnd(localTime(later));
  };

  const submit = async () => {
    const problem =
      lengthProblem(title, LIMITS.title, "title") ??
      (kind === "meetup" ? null : lengthProblem(body, LIMITS.body, "post")) ??
      (kind === "meetup" ? lengthProblem(place, LIMITS.place, "place") ?? lengthProblem(city, LIMITS.city, "city") : null);
    if (problem) {
      setError(problem);
      return;
    }
    let meetup: { place: string; city: string; startsAt: number; endsAt: number } | undefined;
    if (kind === "meetup") {
      const times = meetupTimes(date, start, end);
      if (!times) {
        setError("Choose a date, a start time and an end time.");
        return;
      }
      meetup = { place: place.trim(), city: city.trim(), ...times };
    }
    setBusy(true);
    setError(null);
    try {
      const thread = await communityApi.createThread({
        space: kind === "meetup" ? "meetups" : space,
        kind,
        title: title.trim(),
        body: body.trim() || (kind === "meetup" ? "Everyone is welcome." : ""),
        input,
        meetup,
      });
      toast(kind === "meetup" ? "Meetup posted." : "Posted.");
      navigate(`/app/community/t/${thread.id}`, { replace: true });
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <div className="container-app max-w-3xl py-8 sm:py-12">
      <Link to="/app/community" className="inline-flex items-center gap-1.5 text-sm font-bold text-royal hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> Community
      </Link>
      <h1 className="mt-4 text-[2.25rem] leading-[1.05] font-extrabold tracking-[-0.045em] text-navy sm:text-[2.75rem]">
        {kind === "meetup" ? "Plan a meetup" : "New post"}
      </h1>

      {!member ? (
        <div className="mt-6">
          <JoinForm />
        </div>
      ) : (
        <form
          className="mt-6 grid gap-6 rounded-[1.75rem] bg-surface p-5 ring-1 ring-line sm:p-7"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <div className="grid gap-2">
            <span className="text-[0.9375rem] font-semibold text-ink" id={ids.hint}>What kind of post?</span>
            <Segmented label="Kind of post" value={kind} options={KINDS} onChange={setKind} />
            <p className="text-sm text-ink-3">{HINTS[kind]}</p>
          </div>

          {kind !== "meetup" && (
            <div className="grid gap-1.5">
              <label htmlFor={ids.space} className="text-[0.9375rem] font-semibold text-ink">Space</label>
              <Select id={ids.space} value={space} onChange={(e) => setSpace(e.target.value as SpaceId)} className="w-full sm:w-80">
                {(Object.keys(SPACE_TITLE) as SpaceId[]).filter((s) => s !== "meetups").map((s) => (
                  <option key={s} value={s}>{SPACE_TITLE[s]}</option>
                ))}
              </Select>
            </div>
          )}

          <div className="grid gap-1.5">
            <label htmlFor={ids.title} className="text-[0.9375rem] font-semibold text-ink">{kind === "question" ? "Your question in one line" : "Title"}</label>
            <input
              id={ids.title}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={LIMITS.title.max}
              className="h-12 rounded-2xl border-2 border-line bg-surface px-4 text-[1.0625rem] font-semibold text-ink hover:border-navy/50"
              placeholder={kind === "meetup" ? "For example: ISL coffee morning" : kind === "question" ? "For example: How did you get your UDID card?" : "What do you want to talk about?"}
            />
          </div>

          {kind === "meetup" && (
            <fieldset className="grid min-w-0 gap-4 rounded-[1.25rem] bg-paper-2 p-4">
              <legend className="sr-only">When and where</legend>
              <div className="flex flex-wrap items-end gap-3">
                <div className="grid gap-1.5">
                  <label htmlFor={ids.date} className="text-sm font-semibold text-ink">Date</label>
                  <input id={ids.date} type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 rounded-2xl border-2 border-line bg-surface px-3 font-semibold text-ink" />
                </div>
                <div className="grid gap-1.5">
                  <label htmlFor={ids.start} className="text-sm font-semibold text-ink">Starts</label>
                  <input id={ids.start} type="time" value={start} onChange={(e) => setStart(e.target.value)} className="h-11 rounded-2xl border-2 border-line bg-surface px-3 font-semibold text-ink" />
                </div>
                <div className="grid gap-1.5">
                  <label htmlFor={ids.end} className="text-sm font-semibold text-ink">Ends</label>
                  <input id={ids.end} type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="h-11 rounded-2xl border-2 border-line bg-surface px-3 font-semibold text-ink" />
                </div>
                <Button type="button" size="sm" variant="secondary" onClick={startNow}>Starting now</Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <label htmlFor={ids.place} className="text-sm font-semibold text-ink">Place</label>
                  <input id={ids.place} value={place} onChange={(e) => setPlace(e.target.value)} maxLength={LIMITS.place.max} placeholder="A public place, e.g. a park gate or library" className="h-11 rounded-2xl border-2 border-line bg-surface px-4 font-semibold text-ink" />
                </div>
                <div className="grid gap-1.5">
                  <label htmlFor={ids.city} className="text-sm font-semibold text-ink">City</label>
                  <input id={ids.city} value={city} onChange={(e) => setCity(e.target.value)} maxLength={LIMITS.city.max} className="h-11 rounded-2xl border-2 border-line bg-surface px-4 font-semibold text-ink" />
                </div>
              </div>
              <p className="text-sm text-ink-3">Meet in a public place. The live room's messages are deleted when the meetup ends.</p>
            </fieldset>
          )}

          <PostBox
            value={body}
            onChange={setBody}
            onInput={setInput}
            label={kind === "meetup" ? "Details (optional)" : kind === "question" ? "More details" : "Your post"}
            placeholder={kind === "meetup" ? "Who is it for? Is it beginner-friendly?" : "Write as much as you need. Type, speak, or add a sentence you signed."}
            rows={kind === "meetup" ? 3 : 8}
            max={LIMITS.body.max}
          />

          {error && <p role="alert" className="text-[0.9375rem] font-semibold text-danger">{error}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" variant="primary" size="lg" disabled={busy} leading={<Send aria-hidden />}>
              {busy ? "Posting…" : kind === "meetup" ? "Post meetup" : "Post"}
            </Button>
            <p className="text-sm text-ink-3">Posting as {member.handle}. Keep medical and contact details private.</p>
          </div>
        </form>
      )}
    </div>
  );
}
