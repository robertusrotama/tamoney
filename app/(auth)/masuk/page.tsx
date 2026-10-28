import { AuthForm, AuthLink } from "@/components/auth/AuthForm";
import { FormError } from "@/components/ui/Field";
import { signIn } from "@/lib/actions/auth";

export default async function MasukPage({ searchParams }: PageProps<"/masuk">) {
  const { error } = await searchParams;
  return (
    <>
      {error === "link" && <FormError message="Link sudah kedaluwarsa atau tidak valid. Coba lagi." />}
      <AuthForm
        title="Masuk"
        action={signIn}
        submitLabel="Masuk"
        fields={[
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
        ]}
        footer={
          <>
            <p>
              <AuthLink href="/lupa-password">Lupa password?</AuthLink>
            </p>
            <p>
              Belum punya akun? <AuthLink href="/daftar">Daftar</AuthLink>
            </p>
          </>
        }
      />
    </>
  );
}
