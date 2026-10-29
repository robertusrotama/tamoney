# TaMoney

Web app keuangan pribadi (Next.js + Supabase + Vercel).

- **Baca dulu:** `docs/knowledge/README.md` — vault Obsidian berisi PRD, desain, arsitektur, database, deployment, dan memory proyek.
- **Keputusan proyek baru** → tulis catatan di `docs/knowledge/memory/` (frontmatter `title/tags/type/updated`, fakta + **Why** + **How to apply**, `[[wikilink]]`), lalu tautkan di `README.md`.
- **Gaya kode:** skill Ponytail (`.claude/skills/ponytail/`).
- **Desain & motion:** skill apple-design (`.claude/skills/apple-design/`); token & komponen di `docs/knowledge/design-system.md`. Animasi pakai `motion/react`, bukan CSS transition.
- **Perintah:** `npm run dev` · `npm test` · `npm run build`
- **Aturan:** UI Bahasa Indonesia; nama TaMoney (bukan FinFlow); uang = rupiah utuh via `lib/money.ts`; zona waktu `Asia/Jakarta`; transfer bukan pemasukan/pengeluaran; wallet hanya diarsipkan, tidak dihapus.
