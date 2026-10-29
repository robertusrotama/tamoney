"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

const ITEMS = [
  { href: "/", label: "Ringkasan", icon: "space_dashboard" },
  { href: "/analitik", label: "Analitik", icon: "bar_chart" },
  { href: "/dompet", label: "Dompet", icon: "account_balance_wallet" },
];

const isActive = (path: string, href: string) => (href === "/" ? path === "/" : path.startsWith(href));

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="material fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-outline px-3 pt-6 md:flex">
      <Link href="/" className="mb-6 px-3 text-[22px] font-bold tracking-[-0.02em]">
        TaMoney
      </Link>
      <nav className="space-y-0.5">
        {ITEMS.map((i) => {
          const active = isActive(path, i.href);
          return (
            <Link
              key={i.href}
              href={i.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex items-center gap-3 rounded-[10px] px-3 py-2 text-[15px] font-medium transition-colors ${
                active ? "text-on-primary" : "text-on-surface hover:bg-surface-dim"
              }`}
            >
              {active && <motion.span layoutId="sidebar-active" className="absolute inset-0 rounded-[10px] bg-primary" />}
              <Icon name={i.icon} filled={active} className={`relative text-[20px] ${active ? "" : "text-primary"}`} />
              <span className="relative">{i.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function TabBar() {
  const path = usePathname();
  return (
    <nav className="material fixed inset-x-0 bottom-0 z-40 flex border-t border-outline pb-[env(safe-area-inset-bottom)] md:hidden">
      {ITEMS.map((i) => {
        const active = isActive(path, i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-1 flex-col items-center gap-0.5 pt-1.5 pb-1 text-[10px] font-medium ${active ? "text-primary" : "text-on-surface-variant"}`}
          >
            <motion.span whileTap={{ scale: 0.88 }} className="flex flex-col items-center gap-0.5">
              <Icon name={i.icon} filled={active} className="text-[26px]" />
              {i.label}
            </motion.span>
          </Link>
        );
      })}
    </nav>
  );
}
