import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { makeT } from "./i18n";
import { EN } from "./i18n-en";

const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(f) && !f.includes(".test.") ? [p] : [];
  });

// Every literal t("…") / t('…') in app, components and lib.
const keys = [...new Set(["app", "components", "lib"].flatMap(files).flatMap((f) => [...readFileSync(f, "utf8").matchAll(/(?:\b(?:t|tr)\(\s*|\bk=)(["'`])((?:(?!\1)[^\\]|\\.)*)\1/g)].map((m) => m[2])))];

describe("i18n", () => {
  it("has English for every t() key", () => expect(keys.filter((k) => !(k in EN))).toEqual([]));
  it("keeps placeholders identical", () =>
    expect(Object.entries(EN).filter(([id, en]) => (id.match(/\{\w+\}/g) ?? []).sort().join() !== (en.match(/\{\w+\}/g) ?? []).sort().join()).map(([k]) => k)).toEqual([]));
  it("fills placeholders and falls back", () => {
    expect(makeT("id")("Sisa {x}", { x: "Rp 5" })).toBe("Sisa Rp 5");
    expect(makeT("en")("teks tanpa terjemahan")).toBe("teks tanpa terjemahan");
  });
});
