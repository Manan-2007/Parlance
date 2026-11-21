/**
 * Everything there is to see about one sign: the ISLRTC recording (default),
 * Remy's 3D approximation when there is one, the official video, and a few
 * facts read off the recording.
 */
import { lazy, Suspense, useState } from "react";
import { Clock3, Hand, MapPin } from "lucide-react";
import { Segmented } from "@/components/ui/Segmented";
import { avatarTokenFor } from "@/learn/lessonPlan";
import { isCustomKey } from "@/learn/recordings";
import { useSignLibrary } from "@/services/signs/library";
import { OfficialVideo } from "./OfficialVideo";
import { ReferencePlayer } from "./ReferencePlayer";
import { englishOf, signFacts, sourceOf, useSignMotions } from "./signData";
import { ReviewBadge } from "./ReviewBadge";

const RemyGuide = lazy(() => import("./RemyGuide"));

type View = "signer" | "remy" | "video";

export function SignViewer({ gloss, compact, preferAvatar }: { gloss: string; compact?: boolean; preferAvatar?: boolean }) {
  const library = useSignLibrary();
  const english = englishOf(gloss, library);
  const custom = isCustomKey(gloss);
  const token = custom ? null : avatarTokenFor(gloss);
  const source = sourceOf(gloss);
  const [view, setView] = useState<View>(preferAvatar && token ? "remy" : "signer");
  const { motions } = useSignMotions([gloss]);
  const motion = motions[0];
  const facts = motion ? signFacts(motion) : null;

  return (
    <div>
      <Segmented<View>
        label="How to watch this sign"
        size="sm"
        value={view}
        onChange={setView}
        options={[
          { value: "signer", label: custom ? "Recording" : "ISLRTC signer" },
          ...(token ? [{ value: "remy" as const, label: "3D guide" }] : []),
          ...(custom ? [] : [{ value: "video" as const, label: "Official video" }]),
        ]}
        className="mb-3"
      />
      {view === "signer" && <ReferencePlayer glosses={[gloss]} label={`${custom ? "A recording of" : "The ISLRTC signer signing"} ${english}`} compact={compact} />}
      {view === "remy" && token && (
        <Suspense fallback={<div className="aspect-[4/3] animate-pulse rounded-2xl bg-sky-50" />}>
          <RemyGuide token={token} />
        </Suspense>
      )}
      {view === "video" && <OfficialVideo gloss={gloss} english={english} />}
      {view === "signer" && <ReviewBadge reviewKey={gloss} showUnchecked={custom} className="mt-3" />}
      {source.kind === "recording" && (
        <p className="mt-3 rounded-lg bg-gold-50 px-3 py-2 text-[0.8125rem] leading-5 text-ink-2 ring-1 ring-gold-300">
          Recorded in Parlance{source.author ? ` by ${source.author}` : ""}. Not an ISLRTC sign and not reviewed: ask the person who shared it if anything looks unclear.
        </p>
      )}
      {facts && (
        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[0.8125rem] text-ink-2" aria-label="About this sign">
          <li className="inline-flex items-center gap-1.5">
            <Hand className="size-4 text-royal" aria-hidden />
            {facts.hands === "both" ? "Both hands" : facts.hands === "one" ? "One hand" : "Hands: check the video"}
          </li>
          {facts.zone && (
            <li className="inline-flex items-center gap-1.5">
              <MapPin className="size-4 text-royal" aria-hidden />
              Made at {facts.zone}
            </li>
          )}
          <li className="inline-flex items-center gap-1.5">
            <Clock3 className="size-4 text-royal" aria-hidden />
            About {facts.seconds.toFixed(1)} s
          </li>
        </ul>
      )}
    </div>
  );
}
