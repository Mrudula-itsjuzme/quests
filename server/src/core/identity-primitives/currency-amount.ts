/**
 * Integer minor units + currency code, so gold/gems/event-tokens/battle-pass
 * XP are never silently mixed or floated. Every Economy operation takes and
 * returns this instead of a bare number.
 */
export interface CurrencyAmount {
  readonly currencyCode: string;
  readonly amount: number; // integer minor units; never fractional
}

export function currencyAmount(currencyCode: string, amount: number): CurrencyAmount {
  if (!Number.isInteger(amount)) {
    throw new Error(`currency amount must be an integer, got ${amount}`);
  }
  return { currencyCode, amount };
}

export function assertSameCurrency(a: CurrencyAmount, b: CurrencyAmount): void {
  if (a.currencyCode !== b.currencyCode) {
    throw new Error(`currency mismatch: ${a.currencyCode} vs ${b.currencyCode}`);
  }
}
