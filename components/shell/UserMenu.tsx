"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Avatar, type Profile } from "@/components/ui/Avatar";
import { useT } from "@/components/I18n";
import { Icon } from "@/components/ui/Icon";
import { signOut } from "@/lib/actions/auth";
import { HeaderPanel } from "./HeaderPanel";

const item = "flex h-12 w-full items-center gap-3 rounded-[12px] px-3 text-[17px] hover:bg-surface-dim focus-visible:bg-surface-dim focus-visible:outline-none";

/** Profile menu: same panel and motion as the notification bell. */
export function UserMenu({ profile, email }: { profile: Profile; email: string }) {
  const t = useT();
  return (
    <HeaderPanel
      label={t("Akun {name}", { name: profile.display_name })}
      width={320}
      trigger={(open, toggle) => (
        <motion.button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-label={t("Akun {name}", { name: profile.display_name })}
          whileTap={{ scale: 0.92 }}
          animate={{ scale: open ? 1.06 : 1 }}
          className="flex rounded-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <Avatar profile={profile} />
        </motion.button>
      )}
    >
      {(close) => (
        <div className="p-2">
          <Link href="/pengaturan" onClick={close} className="flex items-center gap-3 rounded-[14px] px-3 py-3 hover:bg-surface-dim">
            <Avatar profile={profile} size={52} />
            <div className="min-w-0">
              <p className="truncate text-[19px] font-semibold">{profile.display_name}</p>
              <p className="truncate text-[15px] text-on-surface-variant">{email}</p>
            </div>
          </Link>
          <div className="my-1.5 h-px bg-outline" />
          <Link href="/pengaturan" onClick={close} className={item}>
            <Icon name="settings" className="text-[22px] text-primary" /> {t("Pengaturan")}
          </Link>
          <Link href="/pintasan" onClick={close} className={item}>
            <Icon name="bolt" className="text-[22px] text-primary" /> {t("Pintasan iPhone")}
          </Link>
          <form action={signOut}>
            <button className={`${item} text-negative`}>
              <Icon name="logout" className="text-[22px]" /> {t("Keluar")}
            </button>
          </form>
        </div>
      )}
    </HeaderPanel>
  );
}
