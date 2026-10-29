export function Icon({ name, className = "", filled }: { name: string; className?: string; filled?: boolean }) {
  return (
    <span
      aria-hidden
      className={`material-symbols-rounded select-none ${className}`}
      style={filled ? { fontVariationSettings: '"FILL" 1, "wght" 500, "GRAD" 0, "opsz" 24' } : undefined}
    >
      {name}
    </span>
  );
}
