import { describe, it, expect, vi } from 'vitest';
import { StoreEngine } from './store-engine.js';

describe('StoreEngine', () => {
  it('should fetch the catalog from the repository', async () => {
    const repository = { getStoreCatalog: vi.fn().mockResolvedValue([{ itemId: 'bronze_chest' }]) };
    const engine = new StoreEngine(repository);
    const catalog = await engine.getCatalog();
    expect(catalog).toEqual([{ itemId: 'bronze_chest' }]);
    expect(repository.getStoreCatalog).toHaveBeenCalled();
  });

  it('should purchase an item via the repository', async () => {
    const repository = { purchaseStoreItem: vi.fn().mockResolvedValue({ success: true, itemId: 'silver_chest' }) };
    const engine = new StoreEngine(repository);
    const result = await engine.purchaseItem('user-1', 'silver_chest', 'purchase-request-001');
    expect(result).toEqual({ success: true, itemId: 'silver_chest' });
    expect(repository.purchaseStoreItem).toHaveBeenCalledWith('user-1', 'silver_chest', 'purchase-request-001');
  });
});
