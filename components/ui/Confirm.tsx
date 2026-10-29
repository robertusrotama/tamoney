"use client";

import { useRef, useState } from "react";
import { useT } from "@/components/I18n";
import { Button } from "./Button";
import { Dialog } from "./Dialog";

type Ask = { title: string; message: string; confirmLabel: string; destructive?: boolean };

/**
 * Replaces window.confirm with our Dialog (sheet on mobile). `const [confirm, dialog] = useConfirm()`;
 * render `dialog`, then `if (await confirm({...})) doIt()`.
 */
export function useConfirm() {
  const t = useT();
  const [ask, setAsk] = useState<Ask | null>(null);
  const resolve = useRef<(ok: boolean) => void>(() => {});

  const confirm = (a: Ask) =>
    new Promise<boolean>((r) => {
      resolve.current = r;
      setAsk(a);
    });
  const done = (ok: boolean) => {
    resolve.current(ok);
    setAsk(null);
  };

  const dialog = (
    <Dialog open={!!ask} onClose={() => done(false)} title={ask?.title ?? ""}>
      <p className="mb-5 text-[15px] text-on-surface-variant">{ask?.message}</p>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="tonal" onClick={() => done(false)}>
          {t("Batal")}
        </Button>
        <Button variant={ask?.destructive ? "destructive" : "primary"} onClick={() => done(true)}>
          {ask?.confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
  return [confirm, dialog] as const;
}
