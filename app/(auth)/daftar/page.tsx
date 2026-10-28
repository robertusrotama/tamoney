import { AuthForm, AuthLink } from "@/components/auth/AuthForm";
import { signUp } from "@/lib/actions/auth";

export default function DaftarPage() {
  return (
    <AuthForm
      title="Daftar Akun"
      action={signUp}
      submitLabel="Daftar"
      successMessage="Akun dibuat. Cek email Anda dan klik link verifikasi untuk masuk."
      fields={[
        { name: "name", label: "Nama", type: "text", autoComplete: "name" },
        { name: "email", label: "Email", type: "email", autoComplete: "email" },
        { name: "password", label: "Password (min. 8 karakter)", type: "password", autoComplete: "new-password" },
      ]}
      footer={
        <p>
          Sudah punya akun? <AuthLink href="/masuk">Masuk</AuthLink>
        </p>
      }
    />
  );
}
