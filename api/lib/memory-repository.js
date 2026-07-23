import { randomUUID } from 'node:crypto';

export class MemoryQuestRepository {
  constructor({ definitions = [] } = {}) {
    this.definitions = definitions.map((item) => ({ ...item }));
    this.users = new Map();
    this.assignments = new Map();
    this.submissions = new Map();
    this.ledger = [];
    this.collectibles = [];
    this.idempotency = new Map();
    this.imageHashes = new Set();
    this.bonusPeriods = new Set();
    this.generationRuns = new Map();
    this.dailyStates = new Map();
  }

  async ensureUser(user) {
    const current = this.users.get(user.id) || { id: user.id, displayName: user.displayName || 'Adventurer', timezone: user.timezone || 'UTC', totalXp: 0, streakDays: 0, lastStreakPeriod: null, primaryPath: null, reminderTime: null, motionPreference: 'system', onboardingCompletedAt: null, tourVersionSeen: 0 };
    this.users.set(user.id, { ...current, ...user, totalXp: current.totalXp, streakDays: current.streakDays, lastStreakPeriod: current.lastStreakPeriod });
    return { ...this.users.get(user.id) };
  }

  async getUser(userId) { return clone(this.users.get(userId)); }
  async updateUserProfile(userId, patch) {
    const current = this.users.get(userId);
    if (!current) return null;
    const updated = { ...current, ...patch };
    this.users.set(userId, updated);
    return clone(updated);
  }
  async reconcileStreak(userId, currentPeriodKey) {
    const user = this.users.get(userId);
    if (user?.streakDays > 0 && daysBetweenDateKeys(user.lastStreakPeriod, currentPeriodKey) > 1) user.streakDays = 0;
  }
  async listDefinitions(filters = {}) {
    return this.definitions.filter((item) => item.enabled && (!filters.cadence || item.cadence === filters.cadence) && (!filters.category || item.category === filters.category)).map(clone);
  }
  async createDefinition(definition) {
    const index = this.definitions.findIndex((item) => item.id === definition.id);
    if (index >= 0) this.definitions[index] = { ...definition };
    else this.definitions.push({ ...definition });
    return clone(definition);
  }
  async listAssignments(userId) { return [...this.assignments.values()].filter((item) => item.userId === userId).map(clone); }
  async listActive(userId, now) { return [...this.assignments.values()].filter((item) => item.userId === userId && ['active', 'pending_verification', 'rejected'].includes(item.status) && new Date(item.expiresAt) > now).map(clone); }
  async listHistory(userId) { return [...this.assignments.values()].filter((item) => item.userId === userId && ['completed', 'expired', 'abandoned'].includes(item.status)).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).map(clone); }
  async findPeriodAssignments(userId, cadence, periodKey) { return [...this.assignments.values()].filter((item) => item.userId === userId && item.cadence === cadence && item.periodKey === periodKey).map(clone); }
  async recentAssignments(userId, cadence, since) { return [...this.assignments.values()].filter((item) => item.userId === userId && item.cadence === cadence && new Date(item.assignedAt) >= since).sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt)).map(clone); }
  async createAssignments(items) {
    const created = [];
    for (const item of items) {
      const duplicate = [...this.assignments.values()].find((existing) => existing.userId === item.userId && existing.cadence === item.cadence && existing.periodKey === item.periodKey && existing.category === item.category);
      if (duplicate) { created.push(clone(duplicate)); continue; }
      const assignment = { id: randomUUID(), status: 'active', progressValue: 0, createdAt: item.assignedAt, updatedAt: item.assignedAt, ...item };
      this.assignments.set(assignment.id, assignment);
      created.push(clone(assignment));
    }
    return created;
  }
  async runGenerationTransaction({ userId, cadence, periodKey, idempotencyKey, select }) {
    const runKey = `${userId}:${cadence}:${periodKey}`;
    const existing = this.generationRuns.get(runKey);
    if (existing?.status === 'completed') return this.findPeriodAssignments(userId, cadence, periodKey);
    if (existing?.pending) return clone(await existing.pending);
    const pending = Promise.resolve().then(async () => {
      const items = await select(this);
      const assignments = await this.createAssignments(items.map((item) => ({ ...item, userId, cadence, periodKey })));
      this.generationRuns.set(runKey, { userId, cadence, periodKey, idempotencyKey, status: 'completed', assignmentCount: assignments.length, createdAt: new Date().toISOString(), completedAt: new Date().toISOString() });
      if (cadence === 'daily') this.dailyStates.set(`${userId}:${periodKey}`, { userId, periodKey, totalAssignments: assignments.length, completedAssignments: 0, bonusAwarded: false, streakAfter: null, updatedAt: new Date().toISOString() });
      return assignments;
    });
    this.generationRuns.set(runKey, { userId, cadence, periodKey, idempotencyKey, status: 'processing', assignmentCount: 0, createdAt: new Date().toISOString(), pending });
    try {
      return clone(await pending);
    } catch (error) {
      this.generationRuns.delete(runKey);
      throw error;
    }
  }
  async getAssignment(userId, assignmentId) { return clone([...this.assignments.values()].find((item) => item.userId === userId && item.id === assignmentId)); }
  async updateAssignment(assignmentId, patch) {
    const current = this.assignments.get(assignmentId);
    if (!current) return null;
    const updated = { ...current, ...patch, updatedAt: patch.updatedAt || new Date().toISOString() };
    this.assignments.set(assignmentId, updated);
    return clone(updated);
  }
  async expireAssignments(userId, now) {
    for (const assignment of this.assignments.values()) {
      if (assignment.userId === userId && !['completed', 'expired', 'abandoned'].includes(assignment.status) && new Date(assignment.expiresAt) <= now) {
        assignment.status = 'expired';
        assignment.updatedAt = now.toISOString();
      }
    }
  }
  async hasImageHash(userId, hash) { return this.imageHashes.has(`${userId}:${hash}`); }
  async createSubmission(submission) {
    const imageKey = submission.imageHash ? `${submission.userId}:${submission.imageHash}` : null;
    if (imageKey && this.imageHashes.has(imageKey)) throw conflict('duplicate_submission');
    const value = { id: randomUUID(), createdAt: new Date().toISOString(), ...submission };
    this.submissions.set(value.id, value);
    if (imageKey) this.imageHashes.add(imageKey);
    return clone(value);
  }
  async countRejectedSubmissions(assignmentId) { return [...this.submissions.values()].filter((item) => item.assignmentId === assignmentId && item.status === 'rejected').length; }
  async completeAssignment({ userId, assignmentId, now, dailyPeriodKey }) {
    const assignment = this.assignments.get(assignmentId);
    if (!assignment || assignment.userId !== userId) return null;
    if (assignment.status === 'completed') return { assignment: clone(assignment), user: await this.getUser(userId), xpCredited: 0, bonusXp: 0 };
    assignment.status = 'completed';
    assignment.progressValue = assignment.targetValue;
    assignment.completedAt = now.toISOString();
    assignment.updatedAt = now.toISOString();
    const ledgerKey = `${userId}:quest:${assignmentId}`;
    let xpCredited = 0;
    if (!this.ledger.some((entry) => entry.key === ledgerKey)) {
      xpCredited = assignment.xpReward;
      this.ledger.push({ key: ledgerKey, userId, assignmentId, amount: xpCredited, reason: 'quest_completion', createdAt: now.toISOString() });
      this.users.get(userId).totalXp += xpCredited;
    }

    let bonusXp = 0;
    if (assignment.cadence === 'daily') {
      const daily = [...this.assignments.values()].filter((item) => item.userId === userId && item.cadence === 'daily' && item.periodKey === dailyPeriodKey);
      const bonusKey = `${userId}:${dailyPeriodKey}`;
      if (daily.length === 3 && daily.every((item) => item.status === 'completed') && !this.bonusPeriods.has(bonusKey)) {
        this.bonusPeriods.add(bonusKey);
        bonusXp = 150;
        this.ledger.push({ key: `${bonusKey}:bonus`, userId, amount: bonusXp, reason: 'daily_bonus', createdAt: now.toISOString() });
        const user = this.users.get(userId);
        user.totalXp += bonusXp;
        user.streakDays = isPreviousDateKey(user.lastStreakPeriod, dailyPeriodKey) ? user.streakDays + 1 : 1;
        user.lastStreakPeriod = dailyPeriodKey;
      }
      this.dailyStates.set(bonusKey, {
        userId,
        periodKey: dailyPeriodKey,
        totalAssignments: daily.length,
        completedAssignments: daily.filter((item) => item.status === 'completed').length,
        bonusAwarded: this.bonusPeriods.has(bonusKey),
        streakAfter: this.users.get(userId).streakDays,
        updatedAt: now.toISOString(),
      });
    }
    return { assignment: clone(assignment), user: await this.getUser(userId), xpCredited, bonusXp };
  }
  async getCollectibles(userId) { return this.collectibles.filter((item) => item.userId === userId).map(clone); }
  async runIdempotent(userId, operation, key, callback) {
    const compound = `${userId}:${operation}:${key}`;
    if (this.idempotency.has(compound)) return clone(await this.idempotency.get(compound));
    const pending = Promise.resolve().then(callback);
    this.idempotency.set(compound, pending);
    try {
      const value = await pending;
      this.idempotency.set(compound, Promise.resolve(value));
      return clone(value);
    } catch (error) {
      this.idempotency.delete(compound);
      throw error;
    }
  }
}

function clone(value) { return value == null ? value : structuredClone(value); }
function isPreviousDateKey(previous, current) {
  return daysBetweenDateKeys(previous, current) === 1;
}
function daysBetweenDateKeys(previous, current) {
  if (!previous) return Number.POSITIVE_INFINITY;
  const previousDate = Date.parse(`${previous}T00:00:00.000Z`);
  const currentDate = Date.parse(`${current}T00:00:00.000Z`);
  return Number.isFinite(previousDate) && Number.isFinite(currentDate) ? (currentDate - previousDate) / 86400000 : Number.POSITIVE_INFINITY;
}
function conflict(code) { const error = new Error(code); error.code = code; error.status = 409; return error; }
