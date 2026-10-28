/**
 * Wallets a write may use: the user's active wallets, plus (on edit) the ones the row already had,
 * so old transactions on an archived wallet stay editable.
 */
export function walletError(requested: string[], activeOwned: string[], keep: string[] = []): string | null {
  const ok = requested.every((id) => activeOwned.includes(id) || keep.includes(id));
  return ok ? null : "Dompet tidak ditemukan atau sudah diarsipkan";
}
