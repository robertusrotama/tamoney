"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { localeOf, makeT, type Lang } from "@/lib/i18n";

const Ctx = createContext<Lang>("id");

export function I18nProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  return <Ctx.Provider value={lang}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);
export const useLocale = () => localeOf(useContext(Ctx));
export function useT() {
  const lang = useContext(Ctx);
  return useMemo(() => makeT(lang), [lang]);
}

/** Text leaf usable from server and client trees alike: <T k="Saldo" />. */
export function T({ k, vars }: { k: string; vars?: Record<string, string | number> }) {
  return useT()(k, vars);
}

/** Date in the UI language. `date` = "YYYY-MM-DD" (WIB) read as UTC midnight. */
export function LocalDate({ date, options }: { date: string; options: Intl.DateTimeFormatOptions }) {
  return new Intl.DateTimeFormat(useLocale(), { ...options, timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}
