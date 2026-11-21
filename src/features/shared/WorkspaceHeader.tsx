import type { ReactNode } from "react";
import { RainbowArch } from "@/components/brand/RainbowArch";
import { cn } from "@/lib/cn";

type Tone = "sun" | "cobalt" | "forest" | "tangerine";

const TONES: Record<Tone, { block: string; text: string; muted: string; chip: string }> = {
  sun: { block: "bg-sun-400", text: "text-navy", muted: "text-navy/80", chip: "bg-navy text-sun-400" },
  cobalt: { block: "bg-cobalt-400", text: "text-white", muted: "text-white/85", chip: "bg-white text-cobalt-400" },
  forest: { block: "bg-forest-400", text: "text-white", muted: "text-white/85", chip: "bg-white text-forest-400" },
  tangerine: { block: "bg-tangerine-400", text: "text-navy", muted: "text-navy/80", chip: "bg-navy text-tangerine-400" },
};

interface WorkspaceHeaderProps {
  title: string;
  description: string;
  meta?: ReactNode;
  action?: ReactNode;
  /** A small icon shown in a chip above the title. */
  icon?: ReactNode;
  tone?: Tone;
  /** A decorative figure that stands in the rainbow (wide screens). */
  illustration?: ReactNode;
}

/** A bold colour-block header for the supporting pages. */
export function WorkspaceHeader({ title, description, meta, action, icon, tone = "sun", illustration }: WorkspaceHeaderProps) {
  const t = TONES[tone];
  return (
    <div className={cn("grain relative overflow-hidden rounded-[2.25rem] px-6 py-8 sm:px-10 sm:py-10", t.block, t.text)}>
      <div className="relative z-10 flex items-end justify-between gap-6">
        <div className="min-w-0 max-w-2xl">
          {icon && (
            <span className={cn("inline-flex size-12 items-center justify-center rounded-full [&_svg]:size-6", t.chip)} aria-hidden>
              {icon}
            </span>
          )}
          <h1 className={cn("text-[2.75rem] leading-[0.95] font-extrabold tracking-[-0.05em] text-current sm:text-[4rem]", icon ? "mt-5" : undefined)}>
            {title}
          </h1>
          <p className={cn("mt-4 max-w-2xl text-[1.0625rem] leading-7 font-semibold", t.muted)}>{description}</p>
          {(meta || action) && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {meta && <span className="text-sm font-bold">{meta}</span>}
              {action}
            </div>
          )}
        </div>
        {illustration && (
          <div className="relative -mr-2 -mb-8 hidden w-64 shrink-0 self-end sm:-mb-10 md:block" aria-hidden>
            <RainbowArch rings={5} opening={0.5} offset={2} className="w-full" />
            <span className="absolute inset-x-0 bottom-0 flex justify-center">{illustration}</span>
          </div>
        )}
      </div>
    </div>
  );
}
