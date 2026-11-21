/**
 * The official ISLRTC dictionary video for a sign, loaded only when asked for:
 * nothing is fetched from YouTube until the learner presses the button.
 */
import { useState } from "react";
import { ArrowUpRight, PlayCircle } from "lucide-react";
import { useSignSources } from "./signData";

export function OfficialVideo({ gloss, english }: { gloss: string; english: string }) {
  const sources = useSignSources();
  const [open, setOpen] = useState(false);
  const videos = sources?.[gloss] ?? [];
  const video = videos[0];
  if (!sources) return <div className="aspect-video animate-pulse rounded-2xl bg-sky-50" aria-hidden />;
  if (!video) {
    return <p className="rounded-2xl bg-subtle p-6 text-center text-sm text-ink-3">No official video is linked for this sign.</p>;
  }
  const watch = `https://www.youtube.com/watch?v=${encodeURIComponent(video.id)}`;
  return (
    <div>
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-navy ring-1 ring-sky-200">
        {open ? (
          <iframe
            title={`ISLRTC video: ${english}`}
            src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.id)}?rel=0&playsinline=1&modestbranding=1`}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white transition-colors hover:bg-white/5"
          >
            <PlayCircle className="size-12 text-gold" aria-hidden />
            <span className="text-[1.0625rem] font-semibold">Play the official ISLRTC video</span>
            <span className="max-w-sm text-[0.8125rem] leading-5 text-white/70">
              A real signer, with the facial expression and mouth shape the figure cannot show. Loads from YouTube.
            </span>
          </button>
        )}
      </div>
      <p className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-3">
        <span>
          Indian Sign Language Research and Training Centre{videos.length > 1 ? ` · ${videos.length} clips list this word; the first is shown` : ""}
        </span>
        <a href={watch} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-royal hover:underline">
          Open on YouTube <ArrowUpRight className="size-3.5" aria-hidden />
        </a>
      </p>
    </div>
  );
}
