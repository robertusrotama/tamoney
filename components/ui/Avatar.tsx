import { CARD_COLORS, type CardColor } from "@/components/wallets/style";

/** Emoji avatars offered in Pengaturan (no photos). Plain list so server and client share it. */
export const AVATARS = ["🧑‍💻", "👩‍💻", "😎", "🤓", "🥳", "🧑‍🚀", "🦊", "🐼", "🐨", "🐯", "🦁", "🐸", "🐵", "🐶", "🐱", "🐧", "🦄", "🐙", "🌵", "🍀", "⚡️", "🌙", "🔥"];

export type Profile = { display_name: string; avatar: string | null; avatar_color: CardColor | null };

/** Emoji on a colored circle, or the name's initial on grey. */
export function Avatar({ profile, size = 36 }: { profile: Profile; size?: number }) {
  const [from, to] = CARD_COLORS[profile.avatar_color ?? "graphite"];
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white select-none"
      style={{ width: size, height: size, fontSize: size * (profile.avatar ? 0.55 : 0.42), background: profile.avatar || profile.avatar_color ? `linear-gradient(180deg, ${from}, ${to})` : "linear-gradient(180deg,#a1a1aa,#71717a)" }}
    >
      {profile.avatar ?? (profile.display_name.charAt(0).toUpperCase() || "?")}
    </span>
  );
}
