import { QuestGenerator } from './quest-generator';
import { QuestDefinitionData, RecentAssignmentRef } from './quest.types';

function def(overrides: Partial<QuestDefinitionData> = {}): QuestDefinitionData {
  return {
    id: overrides.id ?? 'def-1',
    title: 'Test quest',
    description: 'desc',
    category: 'Mind',
    cadence: 'daily',
    rarity: 'Common',
    verificationType: 'TEXT',
    subjectTag: overrides.subjectTag ?? 'subject-1',
    xpReward: 25,
    cooldownDays: 3,
    targetValue: 1,
    unit: 'quest',
    instructions: [],
    enabled: true,
    ...overrides,
  };
}

describe('QuestGenerator', () => {
  const now = new Date('2026-01-15T00:00:00Z');

  describe('selectDaily', () => {
    it('returns exactly one quest per requested category', () => {
      const pool = [
        def({ id: 'mind-1', category: 'Mind', subjectTag: 'mind-1' }),
        def({ id: 'body-1', category: 'Body', subjectTag: 'body-1' }),
        def({ id: 'disc-1', category: 'Discovery', subjectTag: 'disc-1' }),
      ];
      const generator = new QuestGenerator(() => 0.5);
      const selected = generator.selectDaily(pool, [], ['Mind', 'Body', 'Discovery'], now);
      expect(selected).toHaveLength(3);
      expect(selected.map((s) => s.category)).toEqual(['Mind', 'Body', 'Discovery']);
    });

    it('excludes a subject still within its cooldown window', () => {
      const pool = [
        def({ id: 'mind-1', category: 'Mind', subjectTag: 'orange-cat', cooldownDays: 5 }),
        def({ id: 'mind-2', category: 'Mind', subjectTag: 'blue-sky', cooldownDays: 5 }),
      ];
      const recent: RecentAssignmentRef[] = [
        { definitionId: 'mind-1', subjectTag: 'orange-cat', assignedAt: new Date('2026-01-13T00:00:00Z'), rarity: 'Common' },
      ];
      const generator = new QuestGenerator(() => 0.1);
      const [selected] = generator.selectDaily(pool, recent, ['Mind'], now);
      expect(selected.id).toBe('mind-2');
    });

    it('allows a subject once its cooldown window has elapsed', () => {
      const pool = [def({ id: 'mind-1', category: 'Mind', subjectTag: 'orange-cat', cooldownDays: 3 })];
      const recent: RecentAssignmentRef[] = [
        { definitionId: 'mind-1', subjectTag: 'orange-cat', assignedAt: new Date('2026-01-01T00:00:00Z'), rarity: 'Common' },
      ];
      const generator = new QuestGenerator(() => 0.1);
      const [selected] = generator.selectDaily(pool, recent, ['Mind'], now);
      expect(selected.id).toBe('mind-1');
    });

    it('relaxes cooldown to the non-Legendary pool when everything is on cooldown, but never selects a Legendary', () => {
      const pool = [
        def({ id: 'common-1', category: 'Discovery', subjectTag: 'common-subject', rarity: 'Common', cooldownDays: 90 }),
        def({ id: 'legendary-1', category: 'Discovery', subjectTag: 'legendary-subject', rarity: 'Legendary', cooldownDays: 90 }),
      ];
      const recent: RecentAssignmentRef[] = [
        { definitionId: 'common-1', subjectTag: 'common-subject', assignedAt: now, rarity: 'Common' },
        { definitionId: 'legendary-1', subjectTag: 'legendary-subject', assignedAt: now, rarity: 'Legendary' },
      ];
      const generator = new QuestGenerator(() => 0.1);
      const [selected] = generator.selectDaily(pool, recent, ['Discovery'], now);
      expect(selected.rarity).not.toBe('Legendary');
    });

    it('throws quest_pool_exhausted when even the relaxed pool is empty', () => {
      const pool = [def({ id: 'legendary-1', category: 'Discovery', subjectTag: 'only-subject', rarity: 'Legendary', cooldownDays: 90 })];
      const recent: RecentAssignmentRef[] = [
        { definitionId: 'legendary-1', subjectTag: 'only-subject', assignedAt: now, rarity: 'Legendary' },
      ];
      const generator = new QuestGenerator(() => 0.1);
      expect(() => generator.selectDaily(pool, recent, ['Discovery'], now)).toThrow('quest_pool_exhausted');
    });

    it('ignores disabled definitions', () => {
      const pool = [
        def({ id: 'mind-1', category: 'Mind', enabled: false }),
        def({ id: 'mind-2', category: 'Mind', enabled: true }),
      ];
      const generator = new QuestGenerator(() => 0.1);
      const [selected] = generator.selectDaily(pool, [], ['Mind'], now);
      expect(selected.id).toBe('mind-2');
    });
  });

  describe('selectWeekly', () => {
    it('excludes definitions assigned within the lookback window', () => {
      const pool = [def({ id: 'w-1' }), def({ id: 'w-2' })];
      const recent: RecentAssignmentRef[] = [
        { definitionId: 'w-1', subjectTag: 'subject-1', assignedAt: now, rarity: 'Common' },
      ];
      const generator = new QuestGenerator(() => 0.9);
      const selected = generator.selectWeekly(pool, recent, 6);
      expect(selected.id).toBe('w-2');
    });

    it('falls back to the full pool if every candidate was recently assigned', () => {
      const pool = [def({ id: 'w-1' })];
      const recent: RecentAssignmentRef[] = [
        { definitionId: 'w-1', subjectTag: 'subject-1', assignedAt: now, rarity: 'Common' },
      ];
      const generator = new QuestGenerator(() => 0.1);
      const selected = generator.selectWeekly(pool, recent, 6);
      expect(selected.id).toBe('w-1');
    });
  });

  describe('selectMonthly', () => {
    it('excludes definitions assigned within the last year', () => {
      const pool = [def({ id: 'm-1' }), def({ id: 'm-2' })];
      const recent: RecentAssignmentRef[] = [
        { definitionId: 'm-1', subjectTag: 'subject-1', assignedAt: new Date('2025-12-01T00:00:00Z'), rarity: 'Common' },
      ];
      const generator = new QuestGenerator(() => 0.9);
      const selected = generator.selectMonthly(pool, recent, now, 365);
      expect(selected.id).toBe('m-2');
    });

    it('does not exclude definitions assigned over a year ago', () => {
      const pool = [def({ id: 'm-1' })];
      const recent: RecentAssignmentRef[] = [
        { definitionId: 'm-1', subjectTag: 'subject-1', assignedAt: new Date('2024-01-01T00:00:00Z'), rarity: 'Common' },
      ];
      const generator = new QuestGenerator(() => 0.1);
      const selected = generator.selectMonthly(pool, recent, now, 365);
      expect(selected.id).toBe('m-1');
    });
  });

  describe('rarity weighting', () => {
    it('always selects the only weighted rarity present', () => {
      const pool = [
        def({ id: 'r-1', rarity: 'Legendary', subjectTag: 'a' }),
        def({ id: 'r-2', rarity: 'Legendary', subjectTag: 'b' }),
      ];
      const generator = new QuestGenerator(() => 0.99);
      const selected = generator.selectWeekly(pool, []);
      expect(['r-1', 'r-2']).toContain(selected.id);
    });
  });

  describe('toDraft', () => {
    it('maps a definition + period into an assignment draft', () => {
      const generator = new QuestGenerator();
      const period = { key: 'daily:2026-01-15', startsAt: now, expiresAt: new Date(now.getTime() + 86_400_000) };
      const draft = generator.toDraft(def({ id: 'mind-1' }), period);
      expect(draft).toMatchObject({ definitionId: 'mind-1', periodKey: 'daily:2026-01-15', targetValue: 1, xpReward: 25 });
    });
  });
});
