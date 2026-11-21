/**
 * Section label: a numbered chip, (01) How it works. The arcs motif itself
 * now lives in RainbowArch and RainbowWindow.
 */
import { cn } from "@/lib/cn";

/** Section label: a small numbered chip, (01) How it works. */
export function SectionIndex({ index, label, tone = "default" }: { index: string; label: string; tone?: "default" | "inverse" }) {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-2 rounded-full py-1 pr-3.5 pl-1 text-[0.8125rem] leading-5 font-semibold",
        tone === "inverse" ? "bg-white/10 text-white" : "border border-line bg-surface text-navy",
      )}
    >
      <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-sun-100 px-1.5 text-[0.6875rem] font-bold text-navy tabular-nums">
        <span className="sr-only">Section </span>
        {index}
      </span>
      {label}
    </p>
  );
}
