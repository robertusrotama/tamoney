import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import type { ReactNode } from "react";
import { PasswordForm, ProfileForm, SignOutButton, ThemePicker } from "@/components/settings/AccountSettings";
import { THEME_COOKIE, type Theme } from "@/components/shell/prefs";
import { Icon } from "@/components/ui/Icon";
import { getPlanningState } from "@/lib/planning";
import { getProfile } from "@/lib/queries";
import { requireUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Pengaturan · TaMoney" };

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-1 px-1 text-[20px] font-bold tracking-[-0.01em]">{title}</h2>
      {hint && <p className="mb-3 px-1 text-[15px] text-on-surface-variant">{hint}</p>}
      {!hint && <div className="mb-2" />}
      {children}
    </section>
  );
}

export default async function PengaturanPage() {
  const { supabase, user } = await requireUser();
  const [s, profile, cookieStore] = await Promise.all([getPlanningState(supabase), getProfile(supabase, user.email), cookies()]);
  const theme = (cookieStore.get(THEME_COOKIE)?.value ?? "system") as Theme;

  return (
    <div className="max-w-4xl space-y-10">
      <h1 className="large-title px-1">Pengaturan</h1>

      <Section title="Profil" hint="Pilih avatar emoji dan warnanya — tanpa foto.">
        <ProfileForm profile={profile} />
      </Section>

      <Section title="Akun">
        <PasswordForm email={user.email} />
      </Section>

      <Section title="Tampilan">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] bg-card px-4 py-3">
          <div>
            <p className="text-[17px]">Tema</p>
            <p className="text-[13px] text-on-surface-variant">Sistem mengikuti pengaturan perangkat</p>
          </div>
          <div className="w-full sm:w-72">
            <ThemePicker initial={theme} />
          </div>
        </div>
      </Section>

      <Section title="Budget">
        <Link href="/pengaturan/budget" className="flex items-center gap-3 rounded-[14px] bg-card px-4 py-3 hover:bg-surface-dim">
          <span className="flex size-9 items-center justify-center rounded-[10px] bg-primary-container text-primary">
            <Icon name="pie_chart" className="text-[20px]" filled />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[17px]">Persentase & pos budget</span>
            <span className="block truncate text-[13px] text-on-surface-variant">
              Gajian tanggal {s.payday} · {s.groups.length} pos · Tabungan {((s.groups.find((g) => g.is_savings)?.pct_bp ?? 0) / 100).toLocaleString("id-ID")}%
            </span>
          </span>
          <Icon name="chevron_right" className="text-[20px] text-on-surface-variant" />
        </Link>
      </Section>

      <Section title="Lainnya">
        <div className="space-y-3">
          <Link href="/pintasan" className="flex items-center gap-3 rounded-[14px] bg-card px-4 py-3 hover:bg-surface-dim">
            <span className="flex size-9 items-center justify-center rounded-[10px] bg-primary-container text-primary">
              <Icon name="bolt" className="text-[20px]" filled />
            </span>
            <span className="flex-1">
              <span className="block text-[17px]">Pintasan iPhone</span>
              <span className="text-[13px] text-on-surface-variant">Catat transaksi dari Shortcut dan Siri</span>
            </span>
            <Icon name="chevron_right" className="text-[20px] text-on-surface-variant" />
          </Link>
          <SignOutButton />
        </div>
      </Section>
    </div>
  );
}
