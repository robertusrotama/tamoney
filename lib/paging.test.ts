import { describe, expect, it } from "vitest";
import { fetchAllPages } from "./paging";

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
