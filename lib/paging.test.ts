import { describe, expect, it } from "vitest";
import { fetchAllPages, pageItems } from "./paging";

describe("fetchAllPages", () => {
  const source = Array.from({ length: 2500 }, (_, i) => i);
  const fetchPage = async (from: number, to: number) => source.slice(from, to + 1);

  it("keeps fetching past the server's per-request row cap", async () => {
    expect(await fetchAllPages(fetchPage, 1000)).toEqual(source);
  });

  it("stops after one short page", async () => {
    let calls = 0;
    await fetchAllPages(async (from, to) => (calls++, source.slice(from, Math.min(to + 1, 10))), 1000);
    expect(calls).toBe(1);
  });
});

describe("pageItems", () => {
  it("lists every page when there are few", () => expect(pageItems(1, 3)).toEqual([1, 2, 3]));
  it("keeps first, last and the neighbours of the current page", () => {
    expect(pageItems(1, 12)).toEqual([1, 2, 3, "…", 12]);
    expect(pageItems(6, 12)).toEqual([1, "…", 5, 6, 7, "…", 12]);
    expect(pageItems(12, 12)).toEqual([1, "…", 10, 11, 12]);
  });
  it("never shows a gap of one page as …", () => expect(pageItems(4, 12)).toEqual([1, 2, 3, 4, 5, "…", 12]));
  it("handles zero pages", () => expect(pageItems(1, 0)).toEqual([]));
});
