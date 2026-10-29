import type { CSSProperties } from "react";
import type { WalletType } from "@/lib/types";

// Plain module (not "use client") so server pages can read these values.
export const WALLET_ICON: Record<WalletType, string> = {
  cash: "payments",
  bank: "account_balance",
  ewallet: "smartphone",
  credit: "credit_card",
  other: "wallet",
};

/** Card colors: Apple system hues as a light→deep gradient. Keys are stored in wallets.color. */
export const CARD_COLORS = {
  blue: ["#0a84ff", "#0040dd", "Biru"],
  indigo: ["#5e5ce6", "#3634a3", "Indigo"],
  purple: ["#bf5af2", "#8944ab", "Ungu"],
  pink: ["#ff375f", "#c2185b", "Merah muda"],
  red: ["#ff453a", "#b3261e", "Merah"],
  orange: ["#ff9f0a", "#c93400", "Oranye"],
  yellow: ["#ffd60a", "#e8a400", "Kuning"],
  green: ["#30d158", "#0b8a3a", "Hijau"],
  teal: ["#40c8e0", "#0a7d91", "Toska"],
  graphite: ["#8e8e93", "#3a3a3c", "Grafit"],
} as const;
export type CardColor = keyof typeof CARD_COLORS;

const DEFAULT_COLOR: Record<WalletType, CardColor> = { bank: "blue", ewallet: "green", credit: "indigo", cash: "orange", other: "graphite" };

const svg = (body: string) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' ${body}</svg>`)}")`;

/** Background graphics layered over the color (stored in wallets.pattern). White at low alpha reads on every hue. */
export const CARD_PATTERNS = {
  plain: { label: "Polos", layer: "none" },
  mesh: {
    label: "Mesh",
    layer:
      "radial-gradient(60% 80% at 85% 10%, rgb(255 255 255 / 0.35), transparent 70%), radial-gradient(70% 90% at 10% 100%, rgb(0 0 0 / 0.28), transparent 70%), radial-gradient(40% 60% at 40% 40%, rgb(255 255 255 / 0.12), transparent 70%)",
  },
  lines: { label: "Garis", layer: "repeating-linear-gradient(135deg, rgb(255 255 255 / 0.09) 0 2px, transparent 2px 14px)" },
  waves: {
    label: "Gelombang",
    layer: svg(
      "viewBox='0 0 400 250' preserveAspectRatio='none'><path d='M0 170 C 90 120 170 230 260 170 S 380 110 400 140 V250 H0Z' fill='white' fill-opacity='0.14'/><path d='M0 200 C 110 160 200 250 290 205 S 380 170 400 190 V250 H0Z' fill='white' fill-opacity='0.12'/>",
    ),
  },
  rings: { label: "Cincin", layer: "repeating-radial-gradient(circle at 105% -10%, rgb(255 255 255 / 0.1) 0 1.5px, transparent 1.5px 22px)" },
} as const;
export type CardPattern = keyof typeof CARD_PATTERNS;

/** Card face background for a wallet (null color/pattern fall back to the type default, plain). */
export function cardStyle(w: { type: WalletType; color?: string | null; pattern?: string | null }): CSSProperties {
  const [from, to] = CARD_COLORS[(w.color as CardColor) ?? DEFAULT_COLOR[w.type]] ?? CARD_COLORS[DEFAULT_COLOR[w.type]];
  const layer = (CARD_PATTERNS[(w.pattern as CardPattern) ?? "plain"] ?? CARD_PATTERNS.plain).layer;
  return {
    backgroundImage: `${layer === "none" ? "" : `${layer}, `}linear-gradient(145deg, ${from}, ${to})`,
    backgroundSize: "cover",
  };
}

/** Yellow is the one hue where white text fails contrast; it gets dark text. */
export const cardInk = (w: { type: WalletType; color?: string | null }) => (w.color === "yellow" ? "text-black" : "text-white");
