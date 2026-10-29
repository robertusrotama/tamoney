"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { useLocale, useT } from "@/components/I18n";
import { Icon } from "@/components/ui/Icon";
import { cardStyle } from "@/components/wallets/style";

const BARS = [42, 68, 35, 80, 54, 92, 61];

/** One floating card: arrives with a short spring, staggered; then stays still (no looping drift). */
function Float({ children, className, delay, rotate = 0 }: { children: ReactNode; className: string; delay: number; rotate?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={`absolute ${className}`}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.96, rotate }}
      animate={{ opacity: 1, y: 0, scale: 1, rotate }}
      transition={{ type: "spring", bounce: 0, duration: 0.7, delay }}
    >
      {children}
    </motion.div>
  );
}

const solid = "rounded-[20px] bg-white text-[#0f172a] shadow-[0_20px_40px_-16px_rgb(0_0_0/0.45)]";
const glass =
  "rounded-[20px] border border-white/25 bg-white/15 text-white shadow-[0_20px_40px_-16px_rgb(0_0_0/0.4)] backdrop-blur-xl [-webkit-backdrop-filter:blur(24px)]";

/**
 * Right half of the auth pages: TaMoney's own UI as floating cards over a deep blue mesh — a balance
 * card, a wallet card, this week's strip, a recent expense and a 7-day chart. Decorative (aria-hidden).
 */
export function AuthVisual({ today }: { today: string }) {
  const tr = useT();
  const locale = useLocale();
  const t = new Date(`${today}T00:00:00Z`);
  const monday = new Date(t.getTime() - ((t.getUTCDay() + 6) % 7) * 86_400_000);
  const week = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday.getTime() + i * 86_400_000);
    return { d: new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(day), n: day.getUTCDate() };
  });
  const todayIndex = (t.getUTCDay() + 6) % 7;

  return (
    <div
      aria-hidden
      className="relative hidden h-full min-h-[640px] overflow-hidden rounded-[28px] lg:block"
      style={{
        backgroundImage:
          "radial-gradient(60% 50% at 80% 10%, rgb(94 92 230 / 0.75), transparent 70%), radial-gradient(55% 60% at 10% 90%, rgb(10 132 255 / 0.85), transparent 70%), radial-gradient(40% 40% at 60% 60%, rgb(64 200 224 / 0.35), transparent 70%), linear-gradient(160deg, #0a2a6b, #001a4d)",
      }}
    >
      {/* soft light lines, like the reference's hatching */}
      <div className="absolute inset-0 opacity-[0.07] [background:repeating-linear-gradient(135deg,white_0_1px,transparent_1px_18px)]" />

      <Float className="top-[7%] left-[7%] w-[260px]" delay={0.05}>
        <div className={`${solid} p-4`}>
          <div className="flex items-start justify-between">
            <p className="text-[13px] font-medium text-[#64748b]">{tr("Saldo total")}</p>
            <span className="size-2 rounded-full bg-[#0a84ff]" />
          </div>
          <p className="mt-1 text-[26px] font-bold tracking-[-0.02em] tabular-nums">Rp 48.750.000</p>
          <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#30d158]/15 px-2 py-0.5 text-[12px] font-semibold text-[#248a3d]">
            <Icon name="trending_up" className="text-[14px]" /> 8,4% {tr("bulan ini")}
          </p>
        </div>
      </Float>

      <Float className="top-[30%] left-[10%] w-[300px]" delay={0.15} rotate={-6}>
        <div style={cardStyle({ type: "bank", pattern: "mesh" })} className="flex h-[188px] flex-col justify-between rounded-[18px] p-4 text-white shadow-[0_30px_60px_-20px_rgb(0_0_0/0.6)]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-[17px] font-semibold">
              <span className="flex size-8 items-center justify-center rounded-full bg-white/90 text-black/75">
                <Icon name="account_balance" className="text-[18px]" filled />
              </span>
              BCA
            </span>
            <span className="text-right">
              <span className="block text-[10px] font-semibold tracking-[0.06em] text-white/75 uppercase">{tr("Saldo")}</span>
              <span className="text-[17px] font-semibold tabular-nums">Rp 32.500.000</span>
            </span>
          </div>
          <span className="text-[13px] tracking-[0.2em] text-white/80">•••• 8821</span>
        </div>
      </Float>

      <Float className="top-[16%] right-[7%] w-[300px]" delay={0.25}>
        <div className={`${glass} px-3 py-3`}>
          <div className="grid grid-cols-7 text-center">
            {week.map((w, i) => (
              <div key={w.d} className={`rounded-[12px] py-1.5 ${i === todayIndex ? "bg-white text-[#0a2a6b]" : ""}`}>
                <p className={`text-[12px] ${i === todayIndex ? "font-semibold" : "text-white/75"}`}>{w.d}</p>
                <p className="text-[20px] font-medium tabular-nums">{w.n}</p>
              </div>
            ))}
          </div>
        </div>
      </Float>

      <Float className="bottom-[22%] left-[8%] w-[280px]" delay={0.35}>
        <div className={`${solid} p-4`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[15px] font-semibold">{tr("Makan siang")}</p>
              <p className="text-[13px] text-[#64748b]">12:30 · GoPay</p>
            </div>
            <p className="text-[15px] font-semibold text-[#d70015] tabular-nums">−Rp 25.000</p>
          </div>
          <div className="mt-3 flex -space-x-2">
            {[
              ["restaurant", "#ff453a"],
              ["directions_car", "#0a84ff"],
              ["shopping_bag", "#bf5af2"],
              ["bolt", "#ff9f0a"],
            ].map(([icon, bg]) => (
              <span key={icon} style={{ background: bg }} className="flex size-8 items-center justify-center rounded-full text-white ring-2 ring-white">
                <Icon name={icon} className="text-[16px]" filled />
              </span>
            ))}
          </div>
        </div>
      </Float>

      <Float className="right-[8%] bottom-[10%] w-[260px]" delay={0.45}>
        <div className={`${glass} p-4`}>
          <p className="text-[13px] font-medium text-white/80">{tr("Pengeluaran 7 hari")}</p>
          <div className="mt-3 flex h-24 items-end gap-2">
            {BARS.map((h, i) => (
              <motion.span
                key={i}
                className={`flex-1 rounded-[5px] ${i === BARS.length - 2 ? "bg-white" : "bg-white/45"}`}
                style={{ height: `${h}%`, originY: 1 }}
                // grow with a transform (compositor-only), not by animating height
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ type: "spring", bounce: 0, duration: 0.8, delay: 0.55 + i * 0.04 }}
              />
            ))}
          </div>
        </div>
      </Float>
    </div>
  );
}
