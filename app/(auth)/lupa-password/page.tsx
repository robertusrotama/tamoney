import { AuthForm, AuthLink } from "@/components/auth/AuthForm";
import { requestPasswordReset } from "@/lib/actions/auth";

export default function LupaPasswordPage() {
  return (
    <AuthForm
      title="Lupa Password"
      action={requestPasswordReset}
      submitLabel="Kirim Link Reset"
      successMessage="Jika email terdaftar, link untuk mengatur ulang password sudah dikirim."
      fields={[{ name: "email", label: "Email", type: "email", autoComplete: "email" }]}
      footer={<AuthLink href="/masuk">Kembali ke Masuk</AuthLink>}
    />
  );
}
