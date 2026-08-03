/**
 * Shared "run this exactly once per idempotency key" pattern. Any ledger-
 * shaped table (XpLedgerEntry, CurrencyLedgerEntry, and later battle-pass
 * claims / raid loot rolls) has its own `idempotencyKey unique` column; this
 * just standardizes the check-then-run shape so every engine doesn't
 * reimplement it slightly differently.
 */
export interface IdempotencyStore<TResult> {
  findByKey(idempotencyKey: string): Promise<TResult | null>;
}

export async function withIdempotency<TResult>(
  store: IdempotencyStore<TResult>,
  idempotencyKey: string,
  run: () => Promise<TResult>,
): Promise<{ result: TResult; wasNew: boolean }> {
  const existing = await store.findByKey(idempotencyKey);
  if (existing) return { result: existing, wasNew: false };
  const result = await run();
  return { result, wasNew: true };
}
