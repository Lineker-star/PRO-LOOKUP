import clsx from "clsx";

/** Icône Material Symbols Outlined (même jeu d'icônes que les maquettes). */
export function Icon({
  name,
  className,
  filled = false,
  size,
  label,
}: {
  name: string;
  className?: string;
  filled?: boolean;
  size?: number;
  /** Texte lu par les lecteurs d'écran ; sans label, l'icône est décorative. */
  label?: string;
}) {
  return (
    <span
      className={clsx("icon", filled && "icon-fill", className)}
      style={size ? { fontSize: size } : undefined}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
    >
      {name}
    </span>
  );
}
