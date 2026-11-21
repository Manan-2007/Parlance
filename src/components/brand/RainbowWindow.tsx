/**
 * An arched window that frames a standing figure (the 3D signer) with calm,
 * plain space behind the hands and face, where signs must stay legible.
 *
 * v6: a single muted mustard band with a fine outline. The rainbow rings now
 * live only in the site footer. Props are kept for existing call sites.
 * The geometry is measured from the container, so the top stays a true
 * semicircle at any size. Decorative (aria-hidden); children render in the
 * opening.
 */
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface RainbowWindowProps {
  /** Number of rings, 1 to 8. */
  rings?: number;
  /** Total thickness of the rings, in px. */
  band?: number;
  /** Fill for the opening. */
  fill?: string;
  /** Let the pill segments drift. */
  animate?: boolean;
  /** Start from a different ring colour. */
  offset?: number;
  className?: string;
  /** Rendered inside the opening (absolutely positioned, inset by the band). */
  children?: ReactNode;
  /** Classes for the opening's wrapper. */
  innerClassName?: string;
}

function shape(w: number, h: number, inset: number) {
  const R = Math.min(w / 2, h);
  const r = Math.max(0, R - inset);
  const left = R;
  const right = w - R;
  return { R, r, left, right, cy: R };
}

/** An open path: left foot, up, over the top, down to the right foot. */
function ringPath(w: number, h: number, inset: number) {
  const { r, left, right, cy } = shape(w, h, inset);
  const x0 = left - r;
  const x1 = right + r;
  return `M${x0} ${h}L${x0} ${cy}A${r} ${r} 0 0 1 ${left} ${cy - r}L${right} ${cy - r}A${r} ${r} 0 0 1 ${x1} ${cy}L${x1} ${h}`;
}

function closed(w: number, h: number, inset: number) {
  return `${ringPath(w, h, inset)}Z`;
}

export function RainbowWindow({ band = 56, fill, className, children, innerClassName }: RainbowWindowProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => setSize({ w: node.clientWidth, h: node.clientHeight });
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const { w, h } = size;
  const thickness = Math.min(band, w / 4) * 0.5;
  const ready = w > 0 && h > 0;
  const radius = ready ? shape(w, h, thickness).r : 0;

  return (
    <div ref={ref} className={cn(!/\b(absolute|fixed|sticky)\b/.test(className ?? "") && "relative", className)}>
      {ready && (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden className="absolute inset-0 overflow-hidden">
          <path d={`${closed(w, h, 0)}${closed(w, h, thickness)}`} fillRule="evenodd" fill="var(--color-sun-200)" />
          <path d={closed(w, h, thickness)} fill={fill ?? "var(--color-surface)"} stroke="var(--color-line-strong)" strokeWidth="1.5" />
        </svg>
      )}
      <div
        className={cn("absolute bottom-0", innerClassName)}
        style={{ left: thickness, right: thickness, top: thickness, borderTopLeftRadius: radius, borderTopRightRadius: radius }}
      >
        {children}
      </div>
    </div>
  );
}
