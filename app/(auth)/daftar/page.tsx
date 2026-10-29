import { AuthForm, AuthLink } from "@/components/auth/AuthForm";
import { signUp } from "@/lib/actions/auth";

export default function DaftarPage() {
  return (
    <AuthForm
      title="Buat akun"
      subtitle="Mulai catat keuangan dalam hitungan detik"
      action={signUp}
      submitLabel="Daftar"
      successMessage="Akun dibuat. Cek email kamu dan klik link verifikasi untuk masuk."
      fields={[
        { name: "name", label: "Nama", type: "text", autoComplete: "name", placeholder: "Nama kamu" },
        { name: "email", label: "Email", type: "email", autoComplete: "email", placeholder: "nama@email.com" },
        { name: "password", label: "Password", type: "password", autoComplete: "new-password", placeholder: "Minimal 8 karakter" },
      ]}
      footer={
        <>
          Sudah punya akun? <AuthLink href="/masuk">Masuk</AuthLink>
        </>
      }
    />
  );
}
