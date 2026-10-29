import { createClient } from "@supabase/supabase-js";
import { formatRupiah } from "@/lib/money";
import { categoryCandidates, parsePintasan, walletCandidates } from "@/lib/pintasan";

// Plain-text replies: the iPhone Shortcut shows the body directly in its notification.
const reply = (status: number, text: string) =>
  new Response(text, { status, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });

/** POST from the iPhone Shortcut. Auth: `Authorization: Bearer tm_…` (created on /pintasan). */
export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(tm_\S+)$/i)?.[1];
  if (!token) return reply(401, "Token tidak ada. Tambahkan header Authorization: Bearer <token>.");

  const body = await request.json().catch(() => null);
  const parsed = parsePintasan(body);
  if (!parsed.success) return reply(422, parsed.error);
  const t = parsed.data;

  // No user session here: the token is the credential, checked inside pintasan_add.
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase.rpc("pintasan_add", {
    p_token: token,
    p_kind: t.kind,
    p_categories: categoryCandidates(t.kategori),
    p_wallets: walletCandidates(t.sumber),
    p_amount: t.amount,
    p_note: t.note,
  });

  if (error) return reply(500, "Gagal menyimpan, coba lagi.");
  if (data?.error === "token") return reply(401, "Token tidak valid atau sudah dicabut.");
  if (data?.error === "wallet") return reply(422, `Dompet "${t.sumber}" tidak ditemukan. Dompet aktif: ${(data.wallets as string[]).join(", ") || "-"}.`);
  if (data?.error) return reply(422, "Kategori tidak ditemukan.");

  const label = t.kind === "expense" ? "Pengeluaran" : "Pemasukan";
  return reply(201, `✓ ${label} ${formatRupiah(t.amount)} · ${data.category} · ${data.wallet}`);
}
