/**
 * Community home: spaces for long conversations between people who share the
 * same everyday problems, the latest posts (live), and a way into a meetup's
 * live room by code. See backend/community.py for the rules.
 */
import { useEffect, useId, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Hand, MapPin, MessagesSquare, Plus, Radio } from "lucide-react";
import { Pal } from "@/components/brand/Pal";
import { Button, buttonClasses } from "@/components/ui/Button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { formatCode, normaliseCode, type Space } from "@/community/model";
import { cn } from "@/lib/cn";
import { communityApi } from "@/services/community/api";
import { useCommunity } from "@/stores/community";
import { WorkspaceHeader } from "../shared/WorkspaceHeader";
import { JoinForm, SectionTitle, SPACE_STYLE } from "./parts";
import { ThreadList } from "./ThreadList";

export function CommunityPage() {
  useDocumentTitle("Community");
  const member = useCommunity((s) => s.member);
  const signOut = useCommunity((s) => s.signOut);
  const [spaces, setSpaces] = useState<Space[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    communityApi.spaces(controller.signal).then(setSpaces).catch(() => setSpaces(null));
    return () => controller.abort();
  }, []);

  return (
    <div className="container-app max-w-6xl py-8 sm:py-12">
      <WorkspaceHeader
        title="Community"
        description="Talk in depth with people who live it: Deaf and hard-of-hearing people, their families and learners. Ask, share what worked, and meet in person."
        icon={<MessagesSquare />}
        tone="cobalt"
        illustration={<Pal pose="wave" outfit="sun" skin="deep" hair="curly" className="h-40" />}
        action={
          <>
            <Link to="/app/community/new" className={buttonClasses({ variant: "sun" })}>
              <Plus className="size-4" aria-hidden /> New post
            </Link>
            <Link to="/app/community/live" className={buttonClasses({ variant: "inverse" })}>
              <Radio className="size-4" aria-hidden /> Join a live meetup
            </Link>
          </>
        }
      />

      <ul className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { icon: MessagesSquare, title: "Not a group chat", body: "Spaces and threads that stay readable, so good answers are not lost in a stream." },
          { icon: Hand, title: "Every post in sign", body: "Write by signing, speaking or typing. Tap See in sign on any post." },
          { icon: MapPin, title: "Here, together", body: "At a meetup, everyone joins one live room with the host's code." },
        ].map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex gap-3 rounded-[1.5rem] bg-surface p-4 ring-1 ring-line">
            <Icon className="mt-0.5 size-5 shrink-0 text-royal" aria-hidden />
            <span>
              <span className="block font-extrabold text-navy">{title}</span>
              <span className="block text-sm leading-5 text-ink-2">{body}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="posts-title" className="min-w-0">
          <SectionTitle id="posts-title">Latest from everyone</SectionTitle>
          <div className="mt-4">
            <ThreadList
              emptyAction={
                <Link to="/app/community/new" className={buttonClasses({ size: "sm" })}>
                  Write the first post
                </Link>
              }
            />
          </div>
        </section>

        <aside className="grid min-w-0 grid-cols-1 content-start gap-6">
          {member ? (
            <div className="rounded-[1.5rem] bg-surface p-4 text-[0.9375rem] ring-1 ring-line">
              <p className="text-ink-2">
                You post as <span className="font-extrabold text-navy">{member.handle}</span>
                {member.city ? ` from ${member.city}` : ""}.
              </p>
              <Button
                size="sm"
                variant="ghost"
                className="mt-2 -ml-3"
                onClick={() => {
                  if (window.confirm("Forget your community name in this browser? You will need a new name to post again.")) signOut();
                }}
              >
                Forget me on this browser
              </Button>
            </div>
          ) : (
            <JoinForm stacked />
          )}

          <LiveCodeBox />

          <section aria-labelledby="spaces-title">
            <SectionTitle id="spaces-title">Spaces</SectionTitle>
            <ul className="mt-3 grid grid-cols-1 gap-2">
              {(spaces ?? []).map((space) => {
                const { icon: Icon, chip } = SPACE_STYLE[space.id];
                return (
                  <li key={space.id}>
                    <Link
                      to={`/app/community/s/${space.id}`}
                      className="group flex items-center gap-3 rounded-[1.25rem] bg-surface p-3 ring-1 ring-line hover:ring-royal/40"
                    >
                      <span className={cn("inline-flex size-10 shrink-0 items-center justify-center rounded-full", chip)} aria-hidden>
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-extrabold text-navy">{space.title}</span>
                        <span className="block truncate text-sm text-ink-3">
                          {space.threads === 1 ? "1 post" : `${space.threads} posts`} · {space.description}
                        </span>
                      </span>
                      <ArrowRight className="size-4 shrink-0 text-ink-3 group-hover:text-navy" aria-hidden />
                    </Link>
                  </li>
                );
              })}
              {spaces === null && <li className="text-sm text-ink-3">Spaces appear when Community is running.</li>}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

/** Type the six digits the host shows at the meetup. */
export function LiveCodeBox({ autoFocus = false }: { autoFocus?: boolean }) {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const id = useId();
  const hint = useId();
  return (
    <form
      className="rounded-[1.5rem] bg-tangerine-400 p-4 text-navy"
      onSubmit={(event) => {
        event.preventDefault();
        const digits = normaliseCode(code);
        if (!digits) {
          setError("The code has six digits.");
          return;
        }
        navigate(`/app/community/live/${digits}`);
      }}
    >
      <label htmlFor={id} className="flex items-center gap-2 font-extrabold">
        <Radio className="size-5" aria-hidden /> At a meetup?
      </label>
      <p id={hint} className="mt-1 text-sm leading-5 text-navy/80">Type the code the host shows, or scan their QR code with your phone camera.</p>
      <div className="mt-3 flex gap-2">
        <input
          id={id}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus={autoFocus}
          value={formatCode(code)}
          onChange={(e) => {
            setCode(e.target.value);
            setError(null);
          }}
          aria-describedby={hint}
          aria-invalid={error ? true : undefined}
          placeholder="123 456"
          className="h-11 min-w-0 flex-1 rounded-2xl border-2 border-navy/20 bg-surface px-4 text-lg font-extrabold tracking-[0.2em] text-navy"
        />
        <Button type="submit" variant="dark">Join</Button>
      </div>
      {error && <p role="alert" className="mt-2 text-sm font-bold">{error}</p>}
    </form>
  );
}
