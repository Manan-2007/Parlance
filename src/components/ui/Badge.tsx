import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Tone = "neutral" | "brand" | "gold" | "success" | "danger" | "warning" | "navy" | "voice" | "hands";

const tones: Record<Tone, string> = {
  neutral: "bg-paper-2 text-ink-2 border-transparent",
  brand: "bg-cobalt-100 text-cobalt-800 border-transparent",
  gold: "bg-sun-200 text-sun-800 border-transparent",
  success: "bg-success-bg text-success border-transparent",
  danger: "bg-danger-bg text-danger border-transparent",
  warning: "bg-warning-bg text-warning border-transparent",
  navy: "bg-navy text-white border-navy",
  voice: "bg-tangerine-100 text-tangerine-800 border-transparent",
  hands: "bg-forest-100 text-forest-800 border-transparent",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  icon?: ReactNode;
  size?: "sm" | "md";
}

export function Badge({ tone = "neutral", icon, size = "sm", className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-bold whitespace-nowrap",
        size === "sm" ? "h-6 px-2.5 text-xs [&_svg]:size-3.5" : "h-7 px-3 text-[0.8125rem] [&_svg]:size-4",
        tones[tone],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </span>
  );
}
