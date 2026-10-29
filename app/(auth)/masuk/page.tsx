import { AuthForm, AuthLink } from "@/components/auth/AuthForm";
import { FormError } from "@/components/ui/Field";
import { signIn } from "@/lib/actions/auth";
import { getT } from "@/lib/i18n-server";

export default async function MasukPage({ searchParams }: PageProps<"/masuk">) {
  const [{ error }, t] = await Promise.all([searchParams, getT()]);
  return (
    <div className="space-y-6">
      {error === "link" && <FormError message="Link sudah kedaluwarsa atau tidak valid. Coba lagi." />}
      <AuthForm
        title="Selamat datang kembali"
        subtitle="Masuk untuk lanjut mencatat keuanganmu"
        action={signIn}
        submitLabel="Masuk"
        fields={[
          { name: "email", label: "Email", type: "email", autoComplete: "email", placeholder: "nama@email.com" },
          {
            name: "password",
            label: "Password",
            type: "password",
            autoComplete: "current-password",
            placeholder: "Password kamu",
            hint: <AuthLink href="/lupa-password">{t("Lupa password?")}</AuthLink>,
          },
        ]}
        footer={
          <>
            {t("Belum punya akun?")} <AuthLink href="/daftar">{t("Daftar")}</AuthLink>
          </>
        }
      />
    </div>
  );
}
