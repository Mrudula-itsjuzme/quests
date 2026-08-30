import { dailyPeriod } from './time.js';
import { discoveryWeights, monthlyWeights, weeklyWeights } from './quest-definitions.js';
import { cadenceStrategies, createVerificationStrategies } from './strategies.js';
import { calculateProgression, progressionEngine } from './progression-engine.js';

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
    // Coins come from the ledger so every surface reads one authoritative
    // balance instead of deriving its own from XP.
    const coins = await this.repository.getCoinBalance(user.id);
    return { ...user, ...calculateProgression(user.totalXp), coins };
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
            const definitions = await transaction.listDefinitions({ cadence: 'daily', category });
            const pool = this.providers.capabilities?.health === false
              ? definitions.filter((definition) => definition.verificationType !== 'AUTO')
              : definitions;
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

  async generateMonthly(identity, idempotencyKey) {
    const user = await this.repository.ensureUser(identity);
    const now = this.providers.clock.now();
    const period = cadenceStrategies.monthly.period(now, user);
    return this.repository.runIdempotent(user.id, 'generate_monthly', idempotencyKey, async () => {
      await this.repository.expireAssignments(user.id, now);
      const [created] = await this.repository.runGenerationTransaction({
        userId: user.id,
        cadence: 'monthly',
        periodKey: period.key,
        idempotencyKey,
        select: async (transaction) => {
          const pool = await transaction.listDefinitions({ cadence: 'monthly' });
          const recent = await transaction.recentAssignments(user.id, 'monthly', new Date(now.getTime() - 365 * 86400000));
          const eligible = pool.filter((definition) => !recent.some((item) => item.definitionId === definition.id));
          return [assignmentFrom(weightedPick(eligible.length ? eligible : pool, monthlyWeights, this.random), user.id, period, now)];
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
      const { decision, imageHash, confidence, metadata, uploadId } = await strategy.submit(assignment, payload, user);

      const defaultFeedOptIn = ['Discovery', 'Weekly', 'Monthly'].includes(assignment.category);
      const submission = await this.repository.createSubmission({ userId: user.id, assignmentId, verificationType: assignment.verificationType, status: decision, imageHash, confidence, metadata: metadata || {}, uploadId: uploadId || null, feedPosted: defaultFeedOptIn && payload.feedOptIn !== false, createdAt: now.toISOString() });
      if (decision === 'approved') {
        const progressValue = assignment.verificationType === 'PHOTO'
          ? Math.min(assignment.targetValue, assignment.progressValue + 1)
          : assignment.targetValue;
        const progressed = await this.repository.updateAssignment(assignment.id, { progressValue, status: 'active', updatedAt: now.toISOString() });
        if (progressValue >= assignment.targetValue) {
          const completion = await this.complete(user, progressed);
          if (submission.feedPosted) {
            await this.repository.createFeedEntry({
              userId: user.id,
              assignmentId: assignment.id,
              submissionId: submission.id,
              questName: assignment.title,
              displayName: user.displayName,
              xpEarned: completion.xpCredited,
              rankTitle: rankTitleForXp(completion.user.totalXp),
              imageRef: payload.uploadId || null,
              createdAt: now.toISOString(),
            });
          }
          await this.repository.createNotification({ userId: user.id, kind: 'quest_completed', title: 'Quest complete', body: `${assignment.title} awarded ${completion.xpCredited} XP.` });
          return { submission, ...completion };
        }
        return { submission, assignment: progressed, completed: false, proofsRemaining: assignment.targetValue - progressValue };
      }
      const rejectedAttempts = decision === 'rejected' ? await this.repository.countRejectedSubmissions(assignment.id) : 0;
      if (decision === 'rejected' && rejectedAttempts >= 3) {
        const abandoned = await this.repository.updateAssignment(assignment.id, { status: 'abandoned', updatedAt: now.toISOString() });
        const replacement = await this.reassign(user, abandoned);
        return { submission, assignment: abandoned, replacement, completed: false };
      }
      const status = decision === 'manual_review' ? 'pending_verification' : 'rejected';
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
    const previousXp = Math.max(0, result.user.totalXp - result.xpCredited - result.bonusXp);
    const before = calculateProgression(previousXp);
    const after = calculateProgression(result.user.totalXp);
    return {
      ...result,
      user: { ...result.user, ...after },
      completed: true,
      levelUp: after.level > before.level,
      previousLevel: before.level,
      newLevel: after.level,
    };
  }

  async reassign(user, assignment) {
    const pool = await this.repository.listDefinitions({ cadence: assignment.cadence, category: assignment.category });
    const candidates = pool.filter((definition) => definition.id !== assignment.definitionId);
    if (!candidates.length) return null;
    const definition = candidates[Math.floor(this.random() * candidates.length)];
    const replacement = assignmentFrom(definition, user.id, {
      key: `${assignment.periodKey}:replacement:${assignment.id}`,
      startsAt: new Date(assignment.startsAt),
      expiresAt: new Date(assignment.expiresAt),
    }, this.providers.clock.now());
    return this.repository.createReplacementAssignment(replacement, assignment.id);
  }

  async feed(identity) {
    await this.repository.ensureUser(identity);
    return this.repository.listFeed(identity.id);
  }

  async leaderboard(identity) {
    await this.repository.ensureUser(identity);
    return this.repository.listLeaderboard(identity.id);
  }

  async rewards(identity) {
    await this.repository.ensureUser(identity);
    return this.repository.listRewards(identity.id);
  }

  async claimRewards(identity) {
    const user = await this.repository.ensureUser(identity);
    return this.repository.claimRewards(user.id);
  }

  async notifications(identity) {
    const user = await this.repository.ensureUser(identity);
    return this.repository.listNotifications(user.id);
  }

  async markNotificationRead(identity, notificationId) {
    const user = await this.repository.ensureUser(identity);
    const notification = await this.repository.markNotificationRead(user.id, notificationId);
    if (!notification) throw domainError('notification_not_found', 404);
    return notification;
  }

  async reviewSubmission(identity, submissionId, decision, reason) {
    if (!identity.isAdmin) throw domainError('admin_required', 403);
    const submission = await this.repository.getSubmission(submissionId);
    if (!submission) throw domainError('submission_not_found', 404);
    if (submission.status !== 'manual_review') throw domainError('submission_not_reviewable', 409);
    const now = this.providers.clock.now();
    const status = decision === 'approve' ? 'approved' : 'rejected';
    const reviewed = await this.repository.updateSubmission(submissionId, { status, reviewedAt: now.toISOString(), reviewedBy: identity.id, reviewReason: reason || null });
    const assignment = await this.repository.getAssignment(submission.userId, submission.assignmentId);
    const user = await this.repository.getUser(submission.userId);
    if (decision === 'approve') {
      const progressValue = Math.min(assignment.targetValue, assignment.progressValue + 1);
      const progressed = await this.repository.updateAssignment(assignment.id, { progressValue, status: 'active', updatedAt: now.toISOString() });
      if (progressValue >= assignment.targetValue) return { submission: reviewed, ...(await this.complete(user, progressed)) };
      return { submission: reviewed, assignment: progressed, completed: false };
    }
    const rejectedAttempts = await this.repository.countRejectedSubmissions(assignment.id);
    const updated = await this.repository.updateAssignment(assignment.id, { status: rejectedAttempts >= 3 ? 'abandoned' : 'rejected', updatedAt: now.toISOString() });
    return { submission: reviewed, assignment: updated, completed: false };
  }

  async reviewQueue(identity) {
    if (!identity.isAdmin) throw domainError('admin_required', 403);
    return this.repository.listReviewQueue();
  }

  async runScheduler() {
    const users = await this.repository.listUsers();
    const results = [];
    for (const user of users) {
      const identity = { id: user.id, displayName: user.displayName, timezone: user.timezone };
      const daily = await this.generateDaily(identity, `scheduler-daily-${dailyPeriod(this.providers.clock.now(), user.timezone).key}`);
      const weekly = await this.generateWeekly(identity, `scheduler-weekly-${cadenceStrategies.weekly.period(this.providers.clock.now(), user).key}`);
      const monthly = await this.generateMonthly(identity, `scheduler-monthly-${cadenceStrategies.monthly.period(this.providers.clock.now(), user).key}`);
      const periodKey = dailyPeriod(this.providers.clock.now(), user.timezone).key;
      const notification = await this.repository.createNotification({ userId: user.id, kind: 'quests_ready', dedupeKey: `quests-ready:${periodKey}`, title: 'New quests are ready', body: 'Your adventure awaits.' });
      await this.providers.notifications?.send({ userId: user.id, notification }).catch(() => {});
      results.push({ userId: user.id, daily: daily.length, weekly: Boolean(weekly), monthly: Boolean(monthly) });
    }
    return { processedUsers: results.length, users: results };
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
  return { userId, definitionId: definition.id, title: definition.title, description: definition.description, category: definition.category, rarity: definition.rarity, cadence: definition.cadence, verificationType: definition.verificationType, subjectTag: definition.subjectTag, targetValue: definition.targetValue, unit: definition.unit, xpReward: definition.xpReward, coinReward: definition.coinReward ?? 0, instructions: definition.instructions, periodKey: period.key, assignedAt: now.toISOString(), startsAt: period.startsAt.toISOString(), expiresAt: period.expiresAt.toISOString() };
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

function rankTitleForXp(totalXp) {
  return progressionEngine.rankTitleForXp(totalXp);
}
export { calculateProgression };
