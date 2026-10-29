"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { Avatar, AVATARS, type Profile } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Field, FormError, Input, PasswordField } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { useFormDone } from "@/components/ui/useFormDone";
import { THEME_COOKIE, type Theme } from "@/components/shell/prefs";
import { CARD_COLORS, type CardColor } from "@/components/wallets/style";
import { changePassword, saveProfile } from "@/lib/actions/account";
import { signOut } from "@/lib/actions/auth";

const card = "rounded-[14px] bg-card p-4";

export function ProfileForm({ profile }: { profile: Profile }) {
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
          <Field label="Nama tampilan">
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
            aria-label="Inisial nama"
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
              aria-label={`Avatar ${a}`}
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
        <p className="mb-2 text-[13px] font-medium text-on-surface-variant">Warna</p>
        <div role="radiogroup" aria-label="Warna avatar" className="flex flex-wrap gap-2">
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
        {state.ok && <span className="text-[13px] text-positive">Tersimpan</span>}
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan profil"}
        </Button>
      </div>
    </form>
  );
}

export function PasswordForm({ email }: { email: string }) {
  const { state, pending, onSubmit, version } = useFormDone(changePassword);
  return (
    <form method="post" onSubmit={onSubmit} key={version} className={`${card} space-y-4`}>
      <Field label="Email">
        <Input value={email} readOnly disabled autoComplete="username" />
      </Field>
      <Field label="Password saat ini">
        <PasswordField name="current" autoComplete="current-password" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Password baru" hint="Minimal 8 karakter">
          <PasswordField name="password" autoComplete="new-password" required minLength={8} />
        </Field>
        <Field label="Ulangi password baru">
          <PasswordField name="confirm" autoComplete="new-password" required minLength={8} />
        </Field>
      </div>
      <FormError message={state.error} />
      <div className="flex items-center justify-end gap-3">
        {version > 0 && !state.error && <span className="text-[13px] text-positive">Password diganti</span>}
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan…" : "Ganti password"}
        </Button>
      </div>
    </form>
  );
}

/** Applies at once (data-theme on <html>) and remembers it in a cookie the root layout reads. */
export function ThemePicker({ initial }: { initial: Theme }) {
  const [theme, setTheme] = useState(initial);
  const pick = (t: Theme) => {
    setTheme(t);
    if (t === "system") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = t;
    document.cookie = `${THEME_COOKIE}=${t}; path=/; max-age=31536000; samesite=lax`;
  };
  return (
    <Segmented
      value={theme}
      onChange={pick}
      options={[
        { value: "system", label: "Sistem" },
        { value: "light", label: "Terang" },
        { value: "dark", label: "Gelap" },
      ]}
    />
  );
}

export function SignOutButton() {
  return (
    <form action={signOut}>
      <Button type="submit" variant="danger" className="w-full">
        Keluar
      </Button>
    </form>
  );
}
