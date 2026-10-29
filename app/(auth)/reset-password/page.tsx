import { AuthForm } from "@/components/auth/AuthForm";
import { updatePassword } from "@/lib/actions/auth";

export default function ResetPasswordPage() {
  return (
    <AuthForm
      title="Atur password baru"
      subtitle="Gunakan minimal 8 karakter"
      action={updatePassword}
      submitLabel="Simpan password"
      fields={[{ name: "password", label: "Password baru", type: "password", autoComplete: "new-password", placeholder: "Minimal 8 karakter" }]}
    />
  );
}
