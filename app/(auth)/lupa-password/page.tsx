import { AuthForm, AuthLink } from "@/components/auth/AuthForm";
import { requestPasswordReset } from "@/lib/actions/auth";

export default function LupaPasswordPage() {
  return (
    <AuthForm
      title="Lupa password"
      subtitle="Kami kirim link untuk mengatur ulang password"
      action={requestPasswordReset}
      submitLabel="Kirim link reset"
      successMessage="Jika email terdaftar, link untuk mengatur ulang password sudah dikirim."
      fields={[{ name: "email", label: "Email", type: "email", autoComplete: "email", placeholder: "nama@email.com" }]}
      footer={<AuthLink href="/masuk">Kembali ke Masuk</AuthLink>}
    />
  );
}
