import { describe, it, expect, vi } from 'vitest';
import { EventEngine } from './event-engine.js';

describe('EventEngine', () => {
  it('should open a chest and grant rewards', async () => {
    const repository = { 
      consumeInventoryItem: vi.fn().mockResolvedValue(true),
      grantRewards: vi.fn().mockResolvedValue(true)
    };
    const notifications = { sendNotification: vi.fn() };
    const engine = new EventEngine(repository, notifications);
    
    const result = await engine.openChest('user-1', 'bronze_chest', null);
    
    expect(result.loot).toBeDefined();
    expect(repository.consumeInventoryItem).toHaveBeenCalledWith('user-1', 'bronze_chest');
    expect(repository.grantRewards).toHaveBeenCalledWith('user-1', result.loot);
  });

  it('should contribute to a regional event if regionId is provided', async () => {
    const repository = { 
      consumeInventoryItem: vi.fn().mockResolvedValue(true),
      grantRewards: vi.fn().mockResolvedValue(true),
      contributeToRegionalEvent: vi.fn().mockResolvedValue({ justActivated: true, counter: 100, threshold: 100 })
    };
    const notifications = { send: vi.fn() };
    const engine = new EventEngine(repository, notifications);
    
    const result = await engine.openChest('user-1', 'event_chest_1', 'region-a');
    
    expect(repository.contributeToRegionalEvent).toHaveBeenCalledWith('user-1', 'event_chest_1', 'region-a');
    expect(notifications.send).toHaveBeenCalledWith(expect.objectContaining({ topic: 'region_region-a' }));
  });

  it('should fetch regional event status', async () => {
    const mockStatus = [{ chest_id: 'gold_chest', counter: 50, threshold: 100 }];
    const repository = { getRegionalEventStatus: vi.fn().mockResolvedValue(mockStatus) };
    const engine = new EventEngine(repository, {});

    const status = await engine.getRegionalEventStatus('region-a');
    expect(status).toEqual(mockStatus);
    expect(repository.getRegionalEventStatus).toHaveBeenCalledWith('region-a');
  });
});
