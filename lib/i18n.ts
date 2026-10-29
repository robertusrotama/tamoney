import { EN } from "./i18n-en";

// UI language. The Indonesian text in the code is the key; English comes from lib/i18n-en.ts.
// User data (wallet, category, pos names) is never translated.

export type Lang = "id" | "en";
export const LANG_COOKIE = "lang";
export type Vars = Record<string, string | number>;
export type T = (text: string, vars?: Vars) => string;

export const asLang = (v: string | undefined): Lang => (v === "en" ? "en" : "id");
export const localeOf = (lang: Lang) => (lang === "en" ? "en-GB" : "id-ID");

/** The text in `lang` with {placeholders} filled. Unknown text falls back to itself. */
export function makeT(lang: Lang): T {
  return (text, vars) => {
    let out = lang === "en" ? (EN[text] ?? text) : text;
    if (vars) for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, String(v));
    return out;
  };
}
