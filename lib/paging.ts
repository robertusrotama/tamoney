/** Supabase caps rows per request (max_rows, 1000 by default); read page by page until a short page. */
export async function fetchAllPages<T>(fetchPage: (from: number, to: number) => Promise<T[]>, pageSize = 1000): Promise<T[]> {
  const all: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const page = await fetchPage(from, from + pageSize - 1);
    all.push(...page);
    if (page.length < pageSize) return all;
  }
}

/**
 * Page buttons for a pager: first, last, and three around the current page; "…" only where it hides two or more
 * pages (a single hidden page is shown instead).
 */
export function pageItems(current: number, total: number): (number | "…")[] {
  if (total <= 0) return [];
  const from = Math.max(1, Math.min(current - 1, total - 2));
  const to = Math.min(total, Math.max(current + 1, 3));
  const pages = [...new Set([1, ...Array.from({ length: to - from + 1 }, (_, i) => from + i), total])].sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  for (const p of pages) {
    const prev = out.at(-1);
    if (typeof prev === "number" && p - prev === 2) out.push(p - 1);
    else if (typeof prev === "number" && p - prev > 2) out.push("…");
    out.push(p);
  }
  return out;
}
