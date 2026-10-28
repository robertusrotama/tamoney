export function Icon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span aria-hidden className={`material-symbols-outlined select-none ${className}`}>
      {name}
    </span>
  );
}
