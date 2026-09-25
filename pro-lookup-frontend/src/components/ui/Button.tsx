import clsx from "clsx";
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { Icon } from "@/components/ui/Icon";

type Variant = "primary" | "accent" | "outline" | "ghost" | "danger" | "light" | "subtle";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  // Bleu nuit : actions principales.
  primary: "bg-navy text-white hover:bg-navy-soft",
  // Sarcelle : texte en bleu nuit posé dessus (brief §13, contraste ≥ 4,5:1).
  accent: "bg-teal text-navy hover:brightness-95 font-semibold",
  outline: "border border-line bg-white text-navy hover:border-navy hover:bg-canvas",
  ghost: "text-navy hover:bg-mist",
  danger: "bg-danger text-white hover:brightness-95",
  light: "bg-white text-navy hover:bg-mist",
  subtle: "bg-mist text-navy hover:bg-line",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-sm gap-2",
};

/** twMerge : une classe passée en `className` (ex. « hidden sm:inline-flex ») remplace celle de base. */
function classes(variant: Variant, size: Size, className?: string, full?: boolean) {
  return twMerge(clsx(
    "inline-flex shrink-0 items-center justify-center rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
    variants[variant],
    sizes[size],
    full && "w-full",
    className,
  ));
}

type Common = { variant?: Variant; size?: Size; icon?: string; iconRight?: string; full?: boolean; children?: ReactNode };

export function Button({
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  full,
  loading,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: Common & ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button type={type} className={classes(variant, size, className, full)} disabled={disabled || loading} {...rest}>
      {loading ? (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
      ) : (
        icon && <Icon name={icon} size={size === "sm" ? 16 : 18} />
      )}
      {children}
      {iconRight && <Icon name={iconRight} size={size === "sm" ? 16 : 18} />}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  full,
  className,
  children,
  external,
}: Common & { href: string; className?: string; external?: boolean }) {
  if (external) {
    return (
      <a href={href} className={classes(variant, size, className, full)} target="_blank" rel="noopener noreferrer">
        {icon && <Icon name={icon} size={18} />}
        {children}
        {iconRight && <Icon name={iconRight} size={18} />}
      </a>
    );
  }
  return (
    <Link href={href} className={classes(variant, size, className, full)}>
      {icon && <Icon name={icon} size={size === "sm" ? 16 : 18} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === "sm" ? 16 : 18} />}
    </Link>
  );
}
