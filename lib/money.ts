// Manual formatting: Intl "id-ID" output varies by runtime (NBSP, "Rp" spacing).
export function formatRupiah(n: number): string {
  const digits = String(Math.abs(Math.trunc(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${n < 0 ? "-" : ""}Rp ${digits}`;
}

export function parseRupiah(input: string): number | null {
  const s = input.replace(/rp/i, "").replace(/[\s.]/g, "");
  return /^\d+$/.test(s) ? Number(s) : null;
}
