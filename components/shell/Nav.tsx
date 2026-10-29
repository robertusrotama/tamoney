"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { SIDEBAR_COOKIE } from "./prefs";

const ITEMS = [
  { href: "/", label: "Ringkasan", icon: "space_dashboard" },
  { href: "/budget", label: "Budget", icon: "pie_chart" },
  { href: "/rencana", label: "Rencana", icon: "flag" },
  { href: "/analitik", label: "Analitik", icon: "bar_chart" },
  { href: "/dompet", label: "Dompet", icon: "account_balance_wallet" },
];

const WIDE = 232;
const NARROW = 64;
const GAP = 12; // sidebar floats this far from the window edge

const isActive = (path: string, href: string) => (href === "/" ? path === "/" : path.startsWith(href));

/**
 * Desktop: floating glass sidebar (collapsible) + content offset by its width.
 * Mobile: floating glass tab bar. `initialCollapsed` comes from a cookie so SSR matches.
 */
export function AppShell({ initialCollapsed, header, children }: { initialCollapsed: boolean; header: ReactNode; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const width = collapsed ? NARROW : WIDE;

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next ? 1 : 0}; path=/; max-age=31536000; samesite=lax`;
  };

  return (
    <motion.div
      className="min-h-screen md:pl-[var(--sb)]"
      initial={false}
      animate={{ "--sb": `${width + GAP * 2}px` } as Record<string, string>}
      style={{ "--sb": `${width + GAP * 2}px` } as React.CSSProperties}
    >
      <Sidebar collapsed={collapsed} width={width} onToggle={toggle} />
      {header}
      <main className="px-4 pt-3 pb-32 md:pr-6 md:pb-12 md:pl-0">{children}</main>
      <TabBar />
    </motion.div>
  );
}

function Sidebar({ collapsed, width, onToggle }: { collapsed: boolean; width: number; onToggle: () => void }) {
  const path = usePathname();
  const [hovered, setHovered] = useState<string | null>(null);
  return (
    <motion.aside
      initial={false}
      animate={{ width }}
      style={{ width, left: GAP, top: GAP, bottom: GAP }}
      className="glass fixed z-40 hidden flex-col rounded-[26px] p-2.5 md:flex"
      aria-label="Navigasi utama"
    >
      {/* Brand is out of flow and the button is pinned right, so both simply ride the width spring:
          nothing waits for the brand's exit animation before moving. */}
      <div className="relative mb-4 flex h-11 items-center justify-end pr-1">
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.span
              key="brand"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6, transition: { duration: 0.12 } }}
              className="pointer-events-none absolute left-2.5 text-[19px] font-bold tracking-[-0.02em] whitespace-nowrap"
            >
              TaMoney
            </motion.span>
          )}
        </AnimatePresence>
        <motion.button
          type="button"
          onClick={onToggle}
          whileTap={{ scale: 0.9 }}
          aria-label={collapsed ? "Lebarkan sidebar" : "Ciutkan sidebar"}
          aria-expanded={!collapsed}
          className="flex size-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-dim"
        >
          <Icon name={collapsed ? "left_panel_open" : "left_panel_close"} className="text-[20px]" />
        </motion.button>
      </div>

      <nav className="space-y-1" onPointerLeave={() => setHovered(null)}>
        {ITEMS.map((i) => (
          <NavItem
            key={i.href}
            item={i}
            active={isActive(path, i.href)}
            collapsed={collapsed}
            hovered={hovered === i.href}
            onHover={(on) => setHovered(on ? i.href : null)}
          />
        ))}
      </nav>
    </motion.aside>
  );
}

function NavItem({
  item,
  active,
  collapsed,
  hovered,
  onHover,
}: {
  item: (typeof ITEMS)[number];
  active: boolean;
  collapsed: boolean;
  hovered: boolean;
  onHover: (on: boolean) => void;
}) {
  return (
    <div className="relative" onPointerEnter={() => onHover(true)}>
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        aria-label={collapsed ? item.label : undefined}
        onFocus={() => onHover(true)}
        onBlur={() => onHover(false)}
        // Fixed left inset centers the 21px icon in the 44px collapsed rail, so it never moves.
        className={`relative flex h-11 items-center gap-3 overflow-hidden rounded-full pl-[11.5px] text-[15px] font-medium ${active ? "text-primary" : "text-on-surface"}`}
      >
        {/* Hover: each item's own fill fades in and out — quiet, no travel */}
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full bg-surface-dim"
          initial={false}
          animate={{ opacity: hovered && !active ? 1 : 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        />
        {active && <motion.span layoutId="sidebar-lens" className="glass-lens absolute inset-0 rounded-full" />}
        <span className="relative flex shrink-0">
          <Icon name={item.icon} filled={active} className={`text-[21px] ${active ? "" : "text-on-surface-variant"}`} />
        </span>
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.span
              key="label"
              className="relative whitespace-nowrap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
      </Link>

      {/* Collapsed: the label grows out of the icon toward the content, on hover or keyboard focus */}
      <AnimatePresence>
        {collapsed && hovered && (
          <motion.span
            role="tooltip"
            initial={{ opacity: 0, scale: 0.85, x: -6 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.85, x: -6 }}
            style={{ originX: 0 }}
            // Solid, not clear glass: a light translucent chip over light content loses legibility
            className="pointer-events-none absolute top-1/2 left-[calc(100%+14px)] z-50 -translate-y-1/2 rounded-full bg-card px-3.5 py-1.5 text-[14px] font-semibold whitespace-nowrap shadow-[inset_0_0_0_0.5px_var(--c-glass-edge),0_8px_24px_-8px_rgb(0_0_0/0.3)]"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabBar() {
  const path = usePathname();
  return (
    <nav
      aria-label="Navigasi utama"
      className="glass fixed inset-x-4 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 flex rounded-full p-1 md:hidden"
    >
      {ITEMS.map((i) => {
        const active = isActive(path, i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active ? "page" : undefined}
            className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-full py-1.5 text-[10px] font-semibold ${active ? "text-primary" : "text-on-surface"}`}
          >
            {active && <motion.span layoutId="tab-lens" className="glass-lens absolute inset-0 rounded-full" />}
            <motion.span whileTap={{ scale: 0.88 }} className="relative flex flex-col items-center gap-0.5">
              <Icon name={i.icon} filled={active} className="text-[24px]" />
              {i.label}
            </motion.span>
          </Link>
        );
      })}
    </nav>
  );
}
