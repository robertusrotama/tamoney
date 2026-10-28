/** Supabase caps rows per request (max_rows, 1000 by default); read page by page until a short page. */
export async function fetchAllPages<T>(fetchPage: (from: number, to: number) => Promise<T[]>, pageSize = 1000): Promise<T[]> {
  const all: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const page = await fetchPage(from, from + pageSize - 1);
    all.push(...page);
    if (page.length < pageSize) return all;
  }
}
