import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "subtle" | "danger" | "inverse" | "dark" | "sun" | "voice" | "hands";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "press inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-bold tracking-[-0.01em] select-none " +
  "disabled:opacity-45 disabled:pointer-events-none aria-disabled:opacity-45 aria-disabled:pointer-events-none";

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-[0.8125rem] [&_svg]:size-4",
  md: "h-11 px-5 text-[0.9375rem] [&_svg]:size-[1.125rem]",
  lg: "h-[3.25rem] px-7 text-base [&_svg]:size-5",
};

const variants: Record<ButtonVariant, string> = {
  primary: "bg-cobalt-400 text-white hover:bg-cobalt-500",
  secondary: "bg-surface text-navy border-2 border-navy hover:bg-sun-100",
  ghost: "text-ink-2 hover:bg-paper-2 hover:text-navy",
  subtle: "bg-cobalt-100 text-cobalt-800 hover:bg-cobalt-200",
  danger: "bg-surface text-danger border-2 border-danger/60 hover:bg-danger-bg",
  inverse: "bg-white text-navy hover:bg-sun-100",
  dark: "bg-navy text-white hover:bg-cobalt-500",
  sun: "bg-sun-400 text-navy hover:bg-sun-300",
  voice: "bg-tangerine-400 text-navy hover:bg-tangerine-300",
  hands: "bg-forest-400 text-white hover:bg-forest-500",
};

export function buttonClasses(options: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  className?: string;
} = {}): string {
  const { variant = "primary", size = "md", block = false, className } = options;
  return cn(base, sizes[size], variants[variant], block && "w-full", className);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, block, className, leading, trailing, children, type = "button", ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={buttonClasses({ variant, size, block, className })} {...rest}>
      {leading}
      {children}
      {trailing}
    </button>
  );
});

interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export function ButtonLink({ variant, size, block, className, leading, trailing, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={buttonClasses({ variant, size, block, className: className as string | undefined })} {...rest}>
      {leading}
      {children}
      {trailing}
    </Link>
  );
}
