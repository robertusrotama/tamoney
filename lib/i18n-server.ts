import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { asLang, LANG_COOKIE, makeT } from "./i18n";

export const getLang = cache(async () => asLang((await cookies()).get(LANG_COOKIE)?.value));
export const getT = async () => makeT(await getLang());
