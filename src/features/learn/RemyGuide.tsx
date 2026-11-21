/**
 * Remy performing a sign from Parlance's own animation tables. These are
 * hand-authored approximations, so the view is always labelled as such and
 * the ISLRTC recording stays the reference. Lazy-loaded: three.js is only
 * fetched when the learner opens this view.
 */
import { useMemo } from "react";
import { AvatarViewport } from "@/components/avatar/AvatarViewport";
import type { QueueItem } from "@/avatar/playback";
import { useLearn } from "@/stores/learn";
import { readableSignLabel } from "@/translation/islVocabulary.js";
import { avatarKey } from "@/learn/reviews";
import { ReviewBadge } from "./ReviewBadge";

export default function RemyGuide({ token }: { token: string }) {
  const speed = useLearn((s) => s.speed);
  const mirror = useLearn((s) => s.mirror);
  const queue = useMemo<QueueItem[]>(() => [{ gloss: token, label: readableSignLabel(token), missing: false }], [token]);
  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[linear-gradient(180deg,var(--color-stage-2),var(--color-stage))] ring-1 ring-sky-200 sm:aspect-[16/11]">
        <AvatarViewport
          queue={queue}
          loop
          mirror={mirror}
          playbackSpeed={speed}
          presentation="figure"
          label={`3D guide performing ${readableSignLabel(token)}. Drag sideways to turn.`}
        />
        <span className="absolute top-3 left-3 rounded-full bg-gold-100 px-2.5 py-1 text-[0.75rem] font-semibold text-gold-800">3D guide · approximate</span>
      </div>
      <p className="mt-2 text-xs leading-5 text-ink-3">
        The avatar's signs are hand-made animations. Use them to see the shape in 3D, and trust the ISLRTC signer when they differ.
      </p>
      <ReviewBadge reviewKey={avatarKey(token)} className="mt-2" />
    </div>
  );
}
