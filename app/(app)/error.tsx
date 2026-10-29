"use client";

import { Button } from "@/components/ui/Button";
import { useT } from "@/components/I18n";
import { EmptyState } from "@/components/ui/EmptyState";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  const t = useT();
  return (
    <EmptyState icon="cloud_off" title={t("Gagal memuat data")}>
      <p className="text-sm">{t("Periksa koneksi Anda lalu coba lagi.")}</p>
      <Button onClick={reset} className="mt-2">
        {t("Coba lagi")}
      </Button>
    </EmptyState>
  );
}
