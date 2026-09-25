import clsx from "clsx";
import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Icon } from "@/components/ui/Icon";

/** Champs de formulaire : libellé explicite, aide, message d'erreur (accessibilité). */

const control =
  "w-full rounded-lg border border-line bg-white px-3 text-sm text-ink placeholder:text-muted transition focus:border-teal focus:outline-none focus:ring-3 focus:ring-teal/20 disabled:bg-mist disabled:text-muted";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  aside,
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  children: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">
          {label}
          {required && <span className="text-danger"> *</span>}
        </label>
        {aside && <span className="text-xs text-muted">{aside}</span>}
      </div>
      {children}
      {error ? (
        <p className="flex items-center gap-1 text-xs font-medium text-danger" role="alert">
          <Icon name="error" size={14} />
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted">{hint}</p>
      )}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { icon?: string; invalid?: boolean }>(
  function Input({ icon, invalid, className, ...rest }, ref) {
    return (
      <div className="relative">
        {icon && <Icon name={icon} size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />}
        <input
          ref={ref}
          className={clsx(control, "h-11", icon && "pl-10", invalid && "border-danger", className)}
          aria-invalid={invalid || undefined}
          {...rest}
        />
      </div>
    );
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(
  function Textarea({ invalid, className, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className={clsx(control, "min-h-28 py-2.5 leading-relaxed", invalid && "border-danger", className)}
        aria-invalid={invalid || undefined}
        {...rest}
      />
    );
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }>(
  function Select({ invalid, className, children, ...rest }, ref) {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={clsx(control, "h-11 appearance-none pr-9", invalid && "border-danger", className)}
          aria-invalid={invalid || undefined}
          {...rest}
        >
          {children}
        </select>
        <Icon name="expand_more" size={20} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted" />
      </div>
    );
  },
);

/** Interrupteur on/off accessible (case à cocher stylée). */
export function Toggle({
  checked,
  onChange,
  label,
  description,
  id,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
  id: string;
  disabled?: boolean;
}) {
  return (
    <label htmlFor={id} className={clsx("flex items-start justify-between gap-4 py-3", disabled ? "opacity-60" : "cursor-pointer")}>
      <span>
        <span className="block text-sm font-semibold text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-muted">{description}</span>}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          id={id}
          type="checkbox"
          role="switch"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="h-6 w-11 rounded-full bg-line transition peer-checked:bg-teal peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-teal" />
        <span className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
        <span className="sr-only">{checked ? "Activé" : "Désactivé"}</span>
      </span>
    </label>
  );
}
