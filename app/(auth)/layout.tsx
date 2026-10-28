export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <p className="text-3xl font-extrabold tracking-tight text-primary">TaMoney</p>
          <p className="font-mono text-[11px] uppercase tracking-widest text-on-surface-variant">Kelola Finansial</p>
        </div>
        <div className="rounded-2xl border border-outline-variant bg-card p-6 shadow-sm">{children}</div>
      </div>
    </main>
  );
}
