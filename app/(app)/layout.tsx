import { Sidebar, TabBar } from "@/components/shell/Nav";
import { QuickAdd } from "@/components/shell/QuickAdd";
import { UserMenu } from "@/components/shell/UserMenu";
import { getCategories, getWallets } from "@/lib/queries";
import { requireUser } from "@/lib/supabase/server";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { supabase, user } = await requireUser();
  const [wallets, categories] = await Promise.all([getWallets(supabase), getCategories(supabase)]);
  const name = (user.user_metadata.display_name as string | undefined) || user.email!.split("@")[0];

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="md:pl-64">
        <header className="material sticky top-0 z-30 flex h-13 items-center justify-between gap-3 px-4 pt-[env(safe-area-inset-top)] md:justify-end md:px-8">
          <p className="text-[17px] font-semibold md:hidden">TaMoney</p>
          <div className="flex items-center gap-3">
            <QuickAdd wallets={wallets} categories={categories} />
            <UserMenu name={name} email={user.email!} />
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 pt-3 pb-32 md:px-8 md:pb-12">{children}</main>
      </div>
      <TabBar />
    </div>
  );
}
