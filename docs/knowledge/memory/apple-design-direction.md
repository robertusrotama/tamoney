---
title: apple-design-direction
tags: [tamoney, memory]
type: decision
updated: 2026-10-29
---

Desain TaMoney mengikuti skill **apple-design** (`.claude/skills/apple-design/`): warna sistem Apple dengan terang/gelap otomatis, font sistem (SF Pro), aksen systemBlue, layout inset grouped, material translucent, dan motion berbasis spring dari **motion.dev** + Tailwind. Desain Google Stitch (FinFlow) ditinggalkan dan MCP-nya dilepas.

**Why:** Diminta user 2026-10-29 setelah versi pertama: redesain seluruh app (bukan hanya dashboard), pilihan terang+gelap, font sistem, biru Apple.

**How to apply:** Pakai token semantik dan komponen di `components/ui/` — jangan hard-code warna. Spring default critically damped (`SPRING`); bounce hanya setelah gestur ber-momentum. Hormati reduced motion/transparency. Detail di [[design-system]].

Terkait: [[design-system]], [[screens]], [[mobile-fab-bottom-nav]]
