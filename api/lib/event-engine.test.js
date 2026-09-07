import { describe, it, expect, vi } from 'vitest';
import { EventEngine } from './event-engine.js';

describe('EventEngine', () => {
  it('should open a chest and grant rewards', async () => {
    const repository = { openChest: vi.fn().mockImplementation((userId, chestId, regionId, key, loot) => ({ chestId, regionId, loot, event: null })) };
    const notifications = { sendNotification: vi.fn() };
    const engine = new EventEngine(repository, notifications);
    
    const result = await engine.openChest('user-1', 'bronze_chest', null, 'chest-request-001');
    
    expect(result.loot).toBeDefined();
    expect(repository.openChest).toHaveBeenCalledWith('user-1', 'bronze_chest', null, 'chest-request-001', result.loot);
  });

  it('should contribute to a regional event if regionId is provided', async () => {
    const repository = {
      openChest: vi.fn().mockImplementation((userId, chestId, regionId, key, loot) => ({
        chestId, regionId, loot, event: { eventId: 'event-1', justActivated: true, counter: 100, threshold: 100 },
      })),
    };
    const notifications = { send: vi.fn() };
    const engine = new EventEngine(repository, notifications);
    
    const result = await engine.openChest('user-1', 'event_chest_1', 'region-a', 'chest-request-002');
    
    expect(repository.openChest).toHaveBeenCalledWith('user-1', 'event_chest_1', 'region-a', 'chest-request-002', result.loot);
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
