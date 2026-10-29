// Plain module so both the server layout and the client shell can read it.
export const SIDEBAR_COOKIE = "sb_collapsed";

/** "light" | "dark"; absent = follow the system. Read by the root layout for <html data-theme>. */
export const THEME_COOKIE = "theme";
export type Theme = "system" | "light" | "dark";
