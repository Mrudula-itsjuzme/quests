import { CurrencyLedgerService } from './currency-ledger.service';

describe('CurrencyLedgerService', () => {
  function setup(initialLedger: Array<{ idempotencyKey: string; amount: number }> = []) {
    const ledger = [...initialLedger];
    const prisma = {
      currencyLedgerEntry: {
        findUnique: jest.fn(({ where }: any) =>
          Promise.resolve(ledger.find((e) => e.idempotencyKey === where.idempotencyKey) ?? null),
        ),
        create: jest.fn(({ data }: any) => {
          const entry = { ...data };
          ledger.push(entry);
          return Promise.resolve(entry);
        }),
        aggregate: jest.fn(() =>
          Promise.resolve({ _sum: { amount: ledger.reduce((sum, e) => sum + e.amount, 0) } }),
        ),
      },
    } as any;
    const eventBus = { emit: jest.fn() } as any;
    return { service: new CurrencyLedgerService(prisma, eventBus), eventBus, ledger };
  }

  it('grants currency and reflects it in balance', async () => {
    const { service } = setup();
    const result = await service.grant('user-1', 'gold', 100, 'quest_completion', 'key-1');
    expect(result.balance).toBe(100);
  });

  it('does not double-grant on a replayed idempotency key', async () => {
    const { service, eventBus } = setup();
    await service.grant('user-1', 'gold', 100, 'quest_completion', 'key-1');
    const second = await service.grant('user-1', 'gold', 100, 'quest_completion', 'key-1');
    expect(second.balance).toBe(100);
    expect(eventBus.emit).toHaveBeenCalledTimes(1);
  });

  it('spends currency when sufficient balance exists', async () => {
    const { service } = setup([{ idempotencyKey: 'grant-1', amount: 100 }]);
    const result = await service.spend('user-1', 'gold', 40, 'store_purchase', 'spend-1');
    expect(result.balance).toBe(60);
  });

  it('throws insufficient_funds and does not create a ledger entry when balance is too low', async () => {
    const { service, ledger } = setup([{ idempotencyKey: 'grant-1', amount: 10 }]);
    await expect(service.spend('user-1', 'gold', 40, 'store_purchase', 'spend-1')).rejects.toThrow(
      'insufficient_funds',
    );
    expect(ledger).toHaveLength(1);
  });

  it('is idempotent on spend replay', async () => {
    const { service } = setup([{ idempotencyKey: 'grant-1', amount: 100 }]);
    await service.spend('user-1', 'gold', 40, 'store_purchase', 'spend-1');
    const second = await service.spend('user-1', 'gold', 40, 'store_purchase', 'spend-1');
    expect(second.balance).toBe(60);
  });

  it('rejects a non-positive spend amount', async () => {
    const { service } = setup();
    await expect(service.spend('user-1', 'gold', 0, 'store_purchase', 'spend-1')).rejects.toThrow(
      'invalid_spend_amount',
    );
  });
});
