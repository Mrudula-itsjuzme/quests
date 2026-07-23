import { dailyPeriod } from './time.js';
import { discoveryWeights, weeklyWeights } from './quest-definitions.js';
import { cadenceStrategies, createVerificationStrategies } from './strategies.js';

export class QuestEngine {
  constructor({ repository, providers, random = Math.random }) {
    this.repository = repository;
    this.providers = providers;
    this.random = random;
    this.verificationStrategies = createVerificationStrategies({ providers, repository });
  }

  async getMe(identity) {
    const ensured = await this.repository.ensureUser(identity);
    const currentPeriod = dailyPeriod(this.providers.clock.now(), ensured.timezone);
    await this.repository.reconcileStreak(ensured.id, currentPeriod.key);
    const user = await this.repository.getUser(identity.id);
    return { ...user, ...calculateProgression(user.totalXp) };
  }

  async updateMe(identity, profile) {
    const user = await this.repository.ensureUser(identity);
    const patch = { ...profile };
    if (profile.onboardingCompleted === true && !user.onboardingCompletedAt) {
      patch.onboardingCompletedAt = this.providers.clock.now().toISOString();
    }
    delete patch.onboardingCompleted;
    const updated = await this.repository.updateUserProfile(user.id, patch);
    return { ...updated, ...calculateProgression(updated.totalXp) };
  }

  async definitions(identity, filters = {}) {
    await this.repository.ensureUser(identity);
    return this.repository.listDefinitions(filters);
  }

  async active(identity) {
    const user = await this.repository.ensureUser(identity);
    const now = this.providers.clock.now();
    await this.repository.expireAssignments(user.id, now);
    return this.repository.listActive(user.id, now);
  }

  async history(identity) {
    await this.repository.ensureUser(identity);
    await this.repository.expireAssignments(identity.id, this.providers.clock.now());
    return this.repository.listHistory(identity.id);
  }

  async generateDaily(identity, idempotencyKey) {
    const user = await this.repository.ensureUser(identity);
    const now = this.providers.clock.now();
    const period = cadenceStrategies.daily.period(now, user);
    return this.repository.runIdempotent(user.id, 'generate_daily', idempotencyKey, async () => {
      await this.repository.expireAssignments(user.id, now);
      return this.repository.runGenerationTransaction({
        userId: user.id,
        cadence: 'daily',
        periodKey: period.key,
        idempotencyKey,
        select: async (transaction) => {
          const recent = await transaction.recentAssignments(user.id, 'daily', new Date(now.getTime() - 90 * 86400000));
          const selected = [];
          for (const category of cadenceStrategies.daily.categories) {
            const pool = await transaction.listDefinitions({ cadence: 'daily', category });
            selected.push(selectWithCooldown(pool, recent, now, category === 'Discovery' ? discoveryWeights : null, this.random));
          }
          return selected.map((definition) => assignmentFrom(definition, user.id, period, now));
        },
      });
    });
  }

  async generateWeekly(identity, idempotencyKey) {
    const user = await this.repository.ensureUser(identity);
    const now = this.providers.clock.now();
    const period = cadenceStrategies.weekly.period(now, user);
    return this.repository.runIdempotent(user.id, 'generate_weekly', idempotencyKey, async () => {
      await this.repository.expireAssignments(user.id, now);
      const [created] = await this.repository.runGenerationTransaction({
        userId: user.id,
        cadence: 'weekly',
        periodKey: period.key,
        idempotencyKey,
        select: async (transaction) => {
          const pool = await transaction.listDefinitions({ cadence: 'weekly' });
          const recent = (await transaction.recentAssignments(user.id, 'weekly', new Date(0))).slice(0, 6);
          const eligible = pool.filter((definition) => !recent.some((item) => item.definitionId === definition.id));
          return [assignmentFrom(weightedPick(eligible, weeklyWeights, this.random), user.id, period, now)];
        },
      });
      return created;
    });
  }

  async progress(identity, assignmentId, payload, idempotencyKey) {
    const user = await this.repository.ensureUser(identity);
    return this.repository.runIdempotent(user.id, `progress:${assignmentId}`, idempotencyKey, async () => {
      const assignment = await this.requireActive(user.id, assignmentId);
      const strategy = this.verificationStrategies[assignment.verificationType];
      if (!strategy?.progress) throw domainError('progress_not_allowed', 409);
      const progress = await strategy.progress(assignment, payload, user);
      const updated = await this.repository.updateAssignment(assignment.id, { ...progress, updatedAt: this.providers.clock.now().toISOString() });
      if (updated.progressValue >= updated.targetValue) return this.complete(user, updated);
      return { assignment: updated, completed: false };
    });
  }

  async submit(identity, assignmentId, payload, idempotencyKey) {
    const user = await this.repository.ensureUser(identity);
    return this.repository.runIdempotent(user.id, `submit:${assignmentId}`, idempotencyKey, async () => {
      const assignment = await this.requireActive(user.id, assignmentId);
      const now = this.providers.clock.now();
      const strategy = this.verificationStrategies[assignment.verificationType];
      if (!strategy?.submit) throw domainError('unsupported_verification_type', 409);
      const { decision, imageHash, confidence } = await strategy.submit(assignment, payload, user);

      const submission = await this.repository.createSubmission({ userId: user.id, assignmentId, verificationType: assignment.verificationType, status: decision, imageHash, confidence, feedPosted: assignment.category === 'Discovery' && payload.feedOptIn !== false, createdAt: now.toISOString() });
      if (decision === 'approved') return { submission, ...(await this.complete(user, assignment)) };
      const rejectedAttempts = decision === 'rejected' ? await this.repository.countRejectedSubmissions(assignment.id) : 0;
      const status = decision === 'manual_review' ? 'pending_verification' : rejectedAttempts >= 3 ? 'abandoned' : 'rejected';
      return { submission, assignment: await this.repository.updateAssignment(assignment.id, { status, updatedAt: now.toISOString() }), completed: false };
    });
  }

  async completeLegacy(identity, assignmentId) {
    const user = await this.repository.ensureUser(identity);
    const existing = await this.repository.getAssignment(user.id, assignmentId);
    if (!existing) throw domainError('quest_not_found', 404);
    if (existing.status === 'completed') return this.repository.completeAssignment({ userId: user.id, assignmentId, now: this.providers.clock.now(), dailyPeriodKey: existing.periodKey });
    const assignment = await this.requireActive(user.id, assignmentId);
    return this.complete(user, assignment);
  }

  async createLegacyQuest(identity, payload) {
    const user = await this.repository.ensureUser(identity);
    const now = this.providers.clock.now();
    const id = payload.id || `custom-${String(payload.title || 'quest').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)}-${now.getTime()}`;
    const definition = await this.repository.createDefinition({
      id,
      title: payload.title,
      description: payload.detail || payload.summary || payload.title,
      category: payload.category,
      rarity: payload.rarity,
      cadence: 'custom',
      verificationType: 'TEXT',
      subjectTag: 'custom',
      targetValue: 1,
      unit: 'quest',
      cooldownDays: 0,
      xpReward: payload.xp,
      instructions: payload.instructions,
      enabled: true,
    });
    const period = { key: id, startsAt: now, expiresAt: new Date(now.getTime() + 7 * 86400000) };
    const [assignment] = await this.repository.createAssignments([assignmentFrom(definition, user.id, period, now)]);
    return assignment;
  }

  async complete(user, assignment) {
    const now = this.providers.clock.now();
    const result = await this.repository.completeAssignment({ userId: user.id, assignmentId: assignment.id, now, dailyPeriodKey: assignment.periodKey });
    return { ...result, completed: true };
  }

  async requireActive(userId, assignmentId) {
    const assignment = await this.repository.getAssignment(userId, assignmentId);
    if (!assignment) throw domainError('quest_not_found', 404);
    if (new Date(assignment.expiresAt) <= this.providers.clock.now()) {
      await this.repository.updateAssignment(assignment.id, { status: 'expired' });
      throw domainError('quest_expired', 409);
    }
    if (!['active', 'rejected'].includes(assignment.status)) throw domainError('invalid_quest_state', 409);
    return assignment;
  }
}

function assignmentFrom(definition, userId, period, now) {
  return { userId, definitionId: definition.id, title: definition.title, description: definition.description, category: definition.category, rarity: definition.rarity, cadence: definition.cadence, verificationType: definition.verificationType, subjectTag: definition.subjectTag, targetValue: definition.targetValue, unit: definition.unit, xpReward: definition.xpReward, instructions: definition.instructions, periodKey: period.key, assignedAt: now.toISOString(), startsAt: period.startsAt.toISOString(), expiresAt: period.expiresAt.toISOString() };
}

function selectWithCooldown(pool, recent, now, weights, random) {
  const withinCooldown = (definition) => recent.some((assignment) => assignment.subjectTag === definition.subjectTag && now - new Date(assignment.assignedAt) < definition.cooldownDays * 86400000);
  const eligible = pool.filter((definition) => !withinCooldown(definition));
  // Ordinary three-day lookback is the only rule relaxed when a category pool
  // is exhausted. Legendary subjects always retain their 90-day exclusion.
  const relaxed = eligible.length ? eligible : pool.filter((definition) => definition.rarity !== 'Legendary');
  if (!relaxed.length) throw domainError('quest_pool_exhausted', 409);
  return weights ? weightedPick(relaxed, weights, random) : relaxed[Math.floor(random() * relaxed.length)];
}

function weightedPick(items, weights, random) {
  if (!items.length) throw domainError('quest_pool_exhausted', 409);
  const total = items.reduce((sum, item) => sum + (weights[item.rarity] || 0), 0);
  if (!total) return items[Math.floor(random() * items.length)];
  let cursor = random() * total;
  for (const item of items) {
    cursor -= weights[item.rarity] || 0;
    if (cursor < 0) return item;
  }
  return items.at(-1);
}

export function domainError(code, status = 400) {
  const error = new Error(code);
  error.code = code;
  error.status = status;
  return error;
}

export function calculateProgression(totalXp = 0) {
  let remaining = Math.max(0, Number(totalXp) || 0);
  let level = 1;
  while (remaining >= xpForLevel(level)) { remaining -= xpForLevel(level); level += 1; }
  const xpForCurrentLevel = xpForLevel(level);
  return { level, tier: tierForLevel(level), xpIntoLevel: remaining, xpForCurrentLevel, xpToNextLevel: xpForCurrentLevel - remaining, progressToNextLevel: remaining / xpForCurrentLevel };
}

function xpForLevel(level) { if (level <= 20) return 250; if (level <= 40) return 500; if (level <= 60) return 750; if (level <= 80) return 1000; if (level <= 100) return 1500; return 2000; }
function tierForLevel(level) { if (level <= 20) return 'Bronze'; if (level <= 40) return 'Silver'; if (level <= 60) return 'Gold'; if (level <= 80) return 'Platinum'; if (level <= 100) return 'Mythril'; if (level <= 120) return 'Diamond'; return 'Ascendant'; }
