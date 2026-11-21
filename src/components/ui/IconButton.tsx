import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** Accessible name. Also shown as a native tooltip. */
  label: string;
  icon: ReactNode;
  size?: "sm" | "md" | "lg";
  variant?: "ghost" | "outline" | "primary" | "subtle";
  /** For toggles: renders aria-pressed and the selected look. */
  pressed?: boolean;
}

const sizes = {
  sm: "size-9 [&_svg]:size-4",
  md: "size-11 [&_svg]:size-5",
  lg: "size-12 [&_svg]:size-[1.375rem]",
};

const variants = {
  ghost: "text-ink-2 hover:bg-paper-2 hover:text-navy",
  outline: "bg-surface text-navy border-2 border-navy/80 hover:bg-sun-100",
  primary: "bg-cobalt-400 text-white hover:bg-cobalt-500",
  subtle: "bg-cobalt-100 text-cobalt-800 hover:bg-cobalt-200",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon, size = "md", variant = "ghost", pressed, className, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      className={cn(
        "press inline-flex shrink-0 items-center justify-center rounded-full",
        "disabled:opacity-40 disabled:pointer-events-none",
        sizes[size],
        variants[variant],
        pressed && variant !== "primary" && "border-navy bg-navy text-white hover:bg-navy hover:text-white",
        className,
      )}
      {...rest}
    >
      {icon}
    </button>
  );
});
