import { AuthForm } from "@/components/auth/AuthForm";
import { updatePassword } from "@/lib/actions/auth";

export default function ResetPasswordPage() {
  return (
    <AuthForm
      title="Atur Password Baru"
      action={updatePassword}
      submitLabel="Simpan Password"
      fields={[{ name: "password", label: "Password baru (min. 8 karakter)", type: "password", autoComplete: "new-password" }]}
    />
  );
}
