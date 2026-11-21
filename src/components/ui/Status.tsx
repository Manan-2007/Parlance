import type { ReactNode } from "react";
import { CheckCircle2, CircleDashed, CircleOff, Loader2, TriangleAlert, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";

export type StatusTone = "idle" | "busy" | "live" | "success" | "warning" | "danger" | "off";

const styles: Record<StatusTone, { wrap: string; icon: ReactNode }> = {
  idle: { wrap: "bg-paper-2 text-ink-2 border-transparent", icon: <CircleDashed aria-hidden /> },
  busy: { wrap: "bg-cobalt-100 text-cobalt-800 border-transparent", icon: <Loader2 aria-hidden className="animate-spin" /> },
  live: {
    wrap: "bg-cobalt-100 text-cobalt-800 border-transparent",
    icon: (
      <span aria-hidden className="relative inline-flex size-2.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-royal/50" />
        <span className="relative inline-flex size-2.5 rounded-full bg-royal" />
      </span>
    ),
  },
  success: { wrap: "bg-success-bg text-success border-transparent", icon: <CheckCircle2 aria-hidden /> },
  warning: { wrap: "bg-warning-bg text-warning border-transparent", icon: <TriangleAlert aria-hidden /> },
  danger: { wrap: "bg-danger-bg text-danger border-transparent", icon: <XCircle aria-hidden /> },
  off: { wrap: "bg-paper-2 text-ink-3 border-transparent", icon: <CircleOff aria-hidden /> },
};

interface StatusPillProps {
  tone: StatusTone;
  children: ReactNode;
  className?: string;
  /** Visually hidden prefix for context, e.g. "Recognition service:". */
  srPrefix?: string;
}

/** Status shown with an icon and words, never colour alone. */
export function StatusPill({ tone, children, className, srPrefix }: StatusPillProps) {
  const { wrap, icon } = styles[tone];
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-[0.8125rem] font-semibold whitespace-nowrap [&_svg]:size-3.5",
        wrap,
        className,
      )}
    >
      {icon}
      {srPrefix && <span className="sr-only">{srPrefix} </span>}
      {children}
    </span>
  );
}

interface NoticeProps {
  tone?: "info" | "warning" | "danger" | "success";
  title?: ReactNode;
  children?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

const noticeStyles = {
  info: "border-transparent bg-cobalt-100 [&_.notice-icon]:text-cobalt-800",
  warning: "border-transparent bg-sun-100 [&_.notice-icon]:text-sun-800",
  danger: "border-transparent bg-danger-bg [&_.notice-icon]:text-danger",
  success: "border-transparent bg-success-bg [&_.notice-icon]:text-success",
};

export function Notice({ tone = "info", title, children, icon, action, className }: NoticeProps) {
  return (
    <div className={cn("flex gap-3 rounded-2xl border p-4 sm:p-5", noticeStyles[tone], className)}>
      {icon && <span className="notice-icon mt-0.5 shrink-0 [&_svg]:size-5">{icon}</span>}
      <div className="min-w-0 flex-1">
        {title && <p className="text-[0.9375rem] leading-6 font-semibold text-ink">{title}</p>}
        {children && <div className="text-sm leading-6 text-ink-2">{children}</div>}
        {action && <div className="mt-3 flex flex-wrap gap-2">{action}</div>}
      </div>
    </div>
  );
}
