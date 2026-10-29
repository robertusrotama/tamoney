import type { Metadata } from "next";
import { headers } from "next/headers";
import { CopyButton, CreateToken, RevokeButton } from "@/components/pintasan/TokenControls";
import { Card, EmptyState, Label } from "@/components/ui/EmptyState";
import { requireUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Pintasan iPhone · TaMoney" };

const when = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(iso)) : "belum pernah";

export default async function PintasanPage() {
  const { supabase } = await requireUser();
  const { data: tokens } = await supabase.from("api_tokens").select("id,name,created_at,last_used_at").order("created_at", { ascending: false });
  const h = await headers();
  const endpoint = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}/api/pintasan`;
  const h2 = "mb-2 px-1 text-[20px] font-bold tracking-[-0.01em]";

  return (
    <div className="max-w-3xl space-y-8">
      <div className="px-1">
        <h1 className="large-title">Pintasan iPhone</h1>
        <p className="text-[15px] text-on-surface-variant">Catat transaksi dari Shortcut iPhone (mis. lewat Back Tap) langsung ke TaMoney.</p>
      </div>

      <section>
        <h2 className={h2}>Token</h2>
        <Card className="space-y-4">
          <CreateToken />
          {!tokens?.length ? (
            <EmptyState icon="key" title="Belum ada token" />
          ) : (
            <ul>
              {tokens.map((t) => (
                <li key={t.id} className="flex items-center gap-3 border-b border-outline py-2.5 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[17px]">{t.name}</p>
                    <p className="text-[13px] text-on-surface-variant">Terakhir dipakai: {when(t.last_used_at)}</p>
                  </div>
                  <RevokeButton id={t.id} name={t.name} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <section>
        <h2 className={h2}>Atur Shortcut</h2>
        <Card className="space-y-4 text-[15px]">
          <div className="space-y-1.5">
            <Label>Endpoint</Label>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-[8px] bg-surface-dim px-2.5 py-2 text-[13px]">{endpoint}</code>
              <CopyButton text={endpoint} />
            </div>
          </div>
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>Di aksi <b>Get Contents of URL</b>, isi URL dengan endpoint di atas.</li>
            <li>
              Method <b>POST</b>. Headers: <code>Authorization</code> = <code>Bearer &lt;token&gt;</code>.
            </li>
            <li>
              Request Body <b>JSON</b> dengan 5 field teks: <code>tipe</code> (Expense/Income), <code>kategori</code>, <code>jumlah</code>,{" "}
              <code>sumber</code> (nama dompet), <code>text</code> (catatan).
            </li>
            <li>
              Tampilkan <b>Contents of URL</b> di notifikasi — isinya konfirmasi (mis. <i>✓ Pengeluaran Rp 25.000 · Makan &amp; Minum · BRI</i>) atau pesan
              error.
            </li>
          </ol>
          <p className="text-[13px] text-on-surface-variant">
            Kategori bahasa Inggris dari AI (Food, Transportation, Bills, …) otomatis dipetakan; yang tidak dikenal masuk &quot;Lainnya&quot;. Sumber harus
            cocok dengan nama dompet aktif (Credit Card → Kartu Kredit, Cash → Tunai).
          </p>
        </Card>
      </section>
    </div>
  );
}
