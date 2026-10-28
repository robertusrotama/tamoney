import { formatRupiah } from "@/lib/money";

/** Rupiah in mono tabular figures. sign="auto": green when positive, red when negative, with +/-. */
export function Money({ value, sign = "none", className = "" }: { value: number; sign?: "auto" | "none"; className?: string }) {
  const color = sign === "auto" ? (value > 0 ? "text-positive" : value < 0 ? "text-negative" : "") : "";
  return (
    <span className={`font-mono tabular-nums ${color} ${className}`}>
      {sign === "auto" && value > 0 ? "+" : ""}
      {formatRupiah(value)}
    </span>
  );
}
