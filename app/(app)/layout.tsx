import { BottomNav, Sidebar } from "@/components/shell/Nav";
import { QuickAdd } from "@/components/shell/QuickAdd";
import { UserMenu } from "@/components/shell/UserMenu";
import { requireUser } from "@/lib/supabase/server";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { user } = await requireUser();
  const name = (user.user_metadata.display_name as string | undefined) || user.email!.split("@")[0];

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="md:pl-70">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 bg-surface/85 px-4 backdrop-blur-xl md:justify-end md:px-8">
          <p className="text-xl font-extrabold tracking-tight text-primary md:hidden">TaMoney</p>
          <div className="flex items-center gap-3">
            <QuickAdd />
            <UserMenu name={name} email={user.email!} />
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 pb-28 pt-4 md:px-8 md:pb-10">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
