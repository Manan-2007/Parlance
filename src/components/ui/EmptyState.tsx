import type { ReactNode } from "react";
import { RainbowArch } from "@/components/brand/RainbowArch";
import { cn } from "@/lib/cn";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  /** A friendly illustration, shown standing in a small rainbow. */
  illustration?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, children, action, illustration, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-12 text-center", className)}>
      {illustration ? (
        <div className="relative w-52" aria-hidden>
          <RainbowArch rings={4} opening={0.5} offset={2} className="w-full" />
          <span className="absolute inset-x-0 bottom-0 flex justify-center">{illustration}</span>
        </div>
      ) : (
        <span className="inline-flex size-14 items-center justify-center rounded-full bg-sun-400 text-navy [&_svg]:size-6">{icon}</span>
      )}
      <h3 className="mt-5 text-2xl font-extrabold tracking-[-0.035em] text-navy">{title}</h3>
      {children && <div className="mt-2 max-w-sm text-[0.9375rem] leading-6 text-ink-2">{children}</div>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
