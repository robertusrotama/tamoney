"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@/components/I18n";
import { Avatar, AVATARS, type Profile } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Field, FormError, Input, PasswordField } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { useFormDone } from "@/components/ui/useFormDone";
import { THEME_COOKIE, type Theme } from "@/components/shell/prefs";
import { CARD_COLORS, type CardColor } from "@/components/wallets/style";
import { changePassword, saveProfile } from "@/lib/actions/account";
import { signOut } from "@/lib/actions/auth";
import { LANG_COOKIE, type Lang } from "@/lib/i18n";

const card = "rounded-[14px] bg-card p-4";

export function ProfileForm({ profile }: { profile: Profile }) {
  const t = useT();
  const { state, pending, onSubmit } = useFormDone(saveProfile);
  const [name, setName] = useState(profile.display_name);
  const [avatar, setAvatar] = useState(profile.avatar ?? "");
  const [color, setColor] = useState<CardColor | "">(profile.avatar_color ?? "");
  const preview: Profile = { display_name: name, avatar: avatar || null, avatar_color: color || null };

  return (
    <form method="post" onSubmit={onSubmit} className={`${card} space-y-4`}>
      <input type="hidden" name="avatar" value={avatar} />
      <input type="hidden" name="avatar_color" value={color} />
      <div className="flex items-center gap-4">
        <motion.div key={`${avatar}${color}`} initial={{ scale: 0.85 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.4, duration: 0.4 }}>
          <Avatar profile={preview} size={72} />
        </motion.div>
        <div className="flex-1">
          <Field label={t("Nama tampilan")}>
            <Input name="display_name" value={name} onChange={(e) => setName(e.target.value)} maxLength={50} required />
          </Field>
        </div>
      </div>

      <div>
        <p className="mb-2 text-[13px] font-medium text-on-surface-variant">Avatar</p>
        <div role="radiogroup" aria-label="Avatar" className="grid grid-cols-8 gap-1.5 sm:grid-cols-12">
          <button
            type="button"
            role="radio"
            aria-checked={!avatar}
            aria-label={t("Inisial nama")}
            onClick={() => setAvatar("")}
            className={`flex aspect-square items-center justify-center rounded-full text-[15px] font-semibold ${!avatar ? "bg-primary-container text-primary ring-2 ring-primary" : "bg-surface-dim text-on-surface-variant"}`}
          >
            {name.charAt(0).toUpperCase() || "A"}
          </button>
          {AVATARS.map((a) => (
            <motion.button
              key={a}
              type="button"
              role="radio"
              aria-checked={avatar === a}
              aria-label={t("Avatar {a}", { a })}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setAvatar(a);
                if (!color) setColor("blue");
              }}
              className={`flex aspect-square items-center justify-center rounded-full text-[22px] ${avatar === a ? "bg-primary-container ring-2 ring-primary" : "bg-surface-dim"}`}
            >
              {a}
            </motion.button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[13px] font-medium text-on-surface-variant">{t("Warna")}</p>
        <div role="radiogroup" aria-label={t("Warna avatar")} className="flex flex-wrap gap-2">
          {(Object.keys(CARD_COLORS) as CardColor[]).map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={color === c}
              aria-label={CARD_COLORS[c][2]}
              onClick={() => setColor(c)}
              style={{ background: `linear-gradient(180deg, ${CARD_COLORS[c][0]}, ${CARD_COLORS[c][1]})` }}
              className={`size-8 rounded-full ${color === c ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : ""}`}
            />
          ))}
        </div>
      </div>

      <FormError message={state.error} />
      <div className="flex items-center justify-end gap-3">
        {state.ok && <span className="text-[13px] text-positive">{t("Tersimpan")}</span>}
        <Button type="submit" disabled={pending}>
          {pending ? t("Menyimpan…") : t("Simpan profil")}
        </Button>
      </div>
    </form>
  );
}

export function PasswordForm({ email }: { email: string }) {
  const t = useT();
  const { state, pending, onSubmit, version } = useFormDone(changePassword);
  return (
    <form method="post" onSubmit={onSubmit} key={version} className={`${card} space-y-4`}>
      <Field label="Email">
        <Input value={email} readOnly disabled autoComplete="username" />
      </Field>
      <Field label={t("Password saat ini")}>
        <PasswordField name="current" autoComplete="current-password" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("Password baru")} hint={t("Minimal 8 karakter")}>
          <PasswordField name="password" autoComplete="new-password" required minLength={8} />
        </Field>
        <Field label={t("Ulangi password baru")}>
          <PasswordField name="confirm" autoComplete="new-password" required minLength={8} />
        </Field>
      </div>
      <FormError message={state.error} />
      <div className="flex items-center justify-end gap-3">
        {version > 0 && !state.error && <span className="text-[13px] text-positive">{t("Password diganti")}</span>}
        <Button type="submit" disabled={pending}>
          {pending ? t("Menyimpan…") : t("Ganti password")}
        </Button>
      </div>
    </form>
  );
}

/** Applies at once (data-theme on <html>) and remembers it in a cookie the root layout reads. */
export function ThemePicker({ initial }: { initial: Theme }) {
  const t = useT();
  const [theme, setTheme] = useState(initial);
  const router = useRouter();
  const pick = (v: Theme) => {
    setTheme(v);
    if (v === "system") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = v;
    document.cookie = `${THEME_COOKIE}=${v}; path=/; max-age=31536000; samesite=lax`;
    router.refresh(); // server re-renders <html data-theme> from the cookie, so nothing can put the old theme back
  };
  return (
    <Segmented
      value={theme}
      onChange={pick}
      options={[
        { value: "system", label: t("Sistem") },
        { value: "light", label: t("Terang") },
        { value: "dark", label: t("Gelap") },
      ]}
    />
  );
}

/** Switches UI language. Cookie read by the root layout; names of wallets and categories stay as typed. */
export function LangPicker({ initial }: { initial: Lang }) {
  const [lang, setLang] = useState(initial);
  const router = useRouter();
  const pick = (v: Lang) => {
    setLang(v);
    document.cookie = `${LANG_COOKIE}=${v}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };
  return (
    <Segmented
      value={lang}
      onChange={pick}
      options={[
        { value: "id", label: "Indonesia" },
        { value: "en", label: "English" },
      ]}
    />
  );
}

export function SignOutButton() {
  const t = useT();
  return (
    <form action={signOut}>
      <Button type="submit" variant="danger" className="w-full">
        {t("Keluar")}
      </Button>
    </form>
  );
}
