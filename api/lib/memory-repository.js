import { randomUUID } from 'node:crypto';
import { progressionEngine } from './progression-engine.js';

export class MemoryQuestRepository {
  constructor({ definitions = [] } = {}) {
    this.definitions = definitions.map((item) => ({ ...item }));
    this.users = new Map();
    this.assignments = new Map();
    this.submissions = new Map();
    this.ledger = [];
    this.collectibles = [];
    this.capturedCards = [];
    this.idempotency = new Map();
    this.imageHashes = new Set();
    this.bonusPeriods = new Set();
    this.generationRuns = new Map();
    this.dailyStates = new Map();
    this.feedEntries = [];
    this.notifications = [];
    this.userRewards = [];
    this.inventory = [];
    this.coinLedger = [];
    this.communityPosts = [];
    this.communityLikes = [];
    this.communityComments = [];
    this.friendships = [];
  }

  // --- Community ---
  async createCommunityPost(post) {
    // Sharing the same capture twice returns the original post rather than
    // creating a duplicate, matching the partial unique index in Postgres.
    if (post.cardId) {
      const existing = this.communityPosts.find((item) => item.cardId === post.cardId);
      if (existing) return { post: await this.getCommunityPost(post.userId, existing.id), created: false };
    }
    const value = {
      id: randomUUID(),
      userId: post.userId,
      cardId: post.cardId || null,
      caption: post.caption || '',
      hashtags: post.hashtags || [],
      placeLabel: post.placeLabel || null,
      gps: post.gps || null,
      visibility: post.visibility || 'public',
      createdAt: new Date().toISOString(),
    };
    this.communityPosts.unshift(value);
    return { post: await this.getCommunityPost(post.userId, value.id), created: true };
  }

  async listCommunityPosts(viewerId, { scope = 'public', limit = 50 } = {}) {
    let posts = this.communityPosts.filter((item) => item.visibility === 'public');
    if (scope === 'friends') {
      const friendIds = new Set((await this.listFriends(viewerId)).filter((f) => f.status === 'accepted').map((f) => f.userId));
      posts = posts.filter((item) => friendIds.has(item.userId));
    }
    return posts.slice(0, Math.min(Number(limit) || 50, 100)).map((item) => this._decorateCommunityPost(viewerId, item));
  }

  async getCommunityPost(viewerId, postId) {
    const item = this.communityPosts.find((entry) => entry.id === postId);
    return item ? this._decorateCommunityPost(viewerId, item) : null;
  }

  _decorateCommunityPost(viewerId, item) {
    const author = this.users.get(item.userId);
    const card = item.cardId ? this.capturedCards.find((entry) => entry.id === item.cardId) : null;
    const totalXp = Number(author?.totalXp || 0);
    return clone({
      ...item,
      author: {
        userId: item.userId,
        displayName: author?.displayName || 'Adventurer',
        totalXp,
        rankTitle: progressionEngine.rankTitleForXp(totalXp),
      },
      discovery: card
        ? {
          itemName: card.itemName,
          cardTitle: card.cardTitle,
          rarityTier: card.rarityTier,
          rarityGrade: card.rarityGrade ?? null,
          rarityStars: card.rarityStars ?? null,
          speciesId: card.speciesId ?? null,
          imageRef: card.imageRef ?? null,
          capturedAt: card.capturedAt,
        }
        : null,
      likeCount: this.communityLikes.filter((like) => like.postId === item.id).length,
      commentCount: this.communityComments.filter((comment) => comment.postId === item.id).length,
      viewerLiked: this.communityLikes.some((like) => like.postId === item.id && like.userId === viewerId),
    });
  }

  async setCommunityPostLike(userId, postId, liked) {
    if (!this.communityPosts.some((item) => item.id === postId)) return null;
    const existing = this.communityLikes.findIndex((like) => like.postId === postId && like.userId === userId);
    if (liked && existing === -1) this.communityLikes.push({ postId, userId });
    if (!liked && existing !== -1) this.communityLikes.splice(existing, 1);
    return this.getCommunityPost(userId, postId);
  }

  async createCommunityComment(userId, postId, body) {
    if (!this.communityPosts.some((item) => item.id === postId)) return null;
    const value = { id: randomUUID(), postId, userId, displayName: this.users.get(userId)?.displayName || 'Adventurer', body, createdAt: new Date().toISOString() };
    this.communityComments.push(value);
    return clone(value);
  }

  async listCommunityComments(postId) {
    return this.communityComments.filter((item) => item.postId === postId).map(clone);
  }

  async deleteCommunityPost(userId, postId) {
    const index = this.communityPosts.findIndex((item) => item.id === postId && item.userId === userId);
    if (index === -1) return false;
    this.communityPosts.splice(index, 1);
    this.communityLikes = this.communityLikes.filter((like) => like.postId !== postId);
    this.communityComments = this.communityComments.filter((comment) => comment.postId !== postId);
    return true;
  }

  async listFriends(userId) {
    return this.friendships
      .filter((item) => (item.requesterId === userId || item.addresseeId === userId) && item.status !== 'blocked')
      .map((item) => {
        const otherId = item.requesterId === userId ? item.addresseeId : item.requesterId;
        const other = this.users.get(otherId);
        return {
          userId: otherId,
          displayName: other?.displayName || 'Adventurer',
          totalXp: Number(other?.totalXp || 0),
          streakDays: Number(other?.streakDays || 0),
          status: item.status,
          direction: item.requesterId === userId ? 'outgoing' : 'incoming',
        };
      });
  }

  async ensureUser(user) {
    const current = this.users.get(user.id) || { id: user.id, displayName: user.displayName || 'Adventurer', timezone: user.timezone || 'UTC', totalXp: 0, streakDays: 0, lastStreakPeriod: null, primaryPath: null, reminderTime: null, motionPreference: 'system', onboardingCompletedAt: null, tourVersionSeen: 0 };
    this.users.set(user.id, { ...current, ...user, totalXp: current.totalXp, streakDays: current.streakDays, lastStreakPeriod: current.lastStreakPeriod });
    return { ...this.users.get(user.id) };
  }

  async getUser(userId) { return clone(this.users.get(userId)); }
  async listUsers() { return [...this.users.values()].map(clone); }
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
  async createReplacementAssignment(item, replacedAssignmentId) {
    const [created] = await this.createAssignments([{ ...item, replacedAssignmentId }]);
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
  async hasSimilarImageHash(userId, hash, threshold = 0.95) {
    return [...this.imageHashes].some((value) => {
      const [storedUserId, ...hashParts] = value.split(':');
      return storedUserId === userId && hashSimilarity(hashParts.join(':'), hash) >= threshold;
    });
  }
  async hasGlobalSimilarImageHash(userId, hash, threshold = 0.95) {
    return [...this.imageHashes].some((value) => {
      const [storedUserId, ...hashParts] = value.split(':');
      return storedUserId !== userId && hashSimilarity(hashParts.join(':'), hash) >= threshold;
    });
  }
  async countRecentRejectedSubmissions(userId, since) {
    return [...this.submissions.values()].filter((item) => item.userId === userId && item.status === 'rejected' && new Date(item.createdAt) >= since).length;
  }
  async createSubmission(submission) {
    const imageKey = submission.imageHash ? `${submission.userId}:${submission.imageHash}` : null;
    if (imageKey && this.imageHashes.has(imageKey)) throw conflict('duplicate_submission');
    const value = { id: randomUUID(), createdAt: new Date().toISOString(), ...submission };
    this.submissions.set(value.id, value);
    if (imageKey) this.imageHashes.add(imageKey);
    return clone(value);
  }
  async countRejectedSubmissions(assignmentId) { return [...this.submissions.values()].filter((item) => item.assignmentId === assignmentId && item.status === 'rejected').length; }
  async getSubmission(submissionId) { return clone(this.submissions.get(submissionId)); }
  async listReviewQueue() {
    return [...this.submissions.values()].filter((item) => item.status === 'manual_review').sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).map(clone);
  }
  async updateSubmission(submissionId, patch) {
    const current = this.submissions.get(submissionId);
    if (!current) return null;
    const updated = { ...current, ...patch };
    this.submissions.set(submissionId, updated);
    return clone(updated);
  }
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
      if (['Discovery', 'Weekly', 'Monthly'].includes(assignment.category)) {
        const assetId = `${assignment.definitionId}:${assignment.id}`;
        this.collectibles.push({ userId, assetId, questId: assignment.id, title: assignment.title, category: assignment.category, rarity: assignment.rarity, caption: `Earned by completing ${assignment.title}.`, unlockedAt: now.toISOString() });
      }
      const level = levelFromXp(this.users.get(userId).totalXp);
      for (const reward of defaultLevelRewards.filter((item) => item.level <= level)) {
        if (!this.userRewards.some((item) => item.userId === userId && item.level === reward.level)) {
          this.userRewards.push({ ...reward, userId, status: 'claimable', unlockedAt: now.toISOString(), claimedAt: null });
        }
      }
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
  async createCapturedCard(card) {
    const value = { id: randomUUID(), status: 'final', capturedAt: new Date().toISOString(), serverReceivedAt: new Date().toISOString(), ...card };
    this.capturedCards.unshift(value);
    // Provisional (pending human verification) captures don't credit XP until approved — blueprint §6/§21.
    if (value.status === 'final' && value.xpAwarded > 0) {
      const user = this.users.get(value.userId);
      if (user) user.totalXp += value.xpAwarded;
    }
    // Coins follow the same rule as XP: only credited once the capture is final.
    if (value.status === 'final' && value.coinsAwarded > 0) {
      const ledgerKey = `capture:${value.id}`;
      if (!this.coinLedger.some((entry) => entry.ledgerKey === ledgerKey)) {
        this.coinLedger.push({ ledgerKey, userId: value.userId, cardId: value.id, amount: value.coinsAwarded, reason: 'capture_reward' });
      }
    }
    return clone(value);
  }
  async getCoinBalance(userId) {
    return this.coinLedger.filter((entry) => entry.userId === userId).reduce((sum, entry) => sum + entry.amount, 0);
  }
  async getCapturedCards(userId) { return this.capturedCards.filter((item) => item.userId === userId).map(clone); }
  async getCapturedCardById(userId, cardId) {
    const item = this.capturedCards.find((entry) => entry.userId === userId && entry.id === cardId);
    return item ? clone(item) : null;
  }
  async getCapturedCardByCaptureId(userId, captureId) {
    const item = this.capturedCards.find((entry) => entry.userId === userId && entry.captureId === captureId);
    return item ? clone(item) : null;
  }
  async updateCapturedCard(userId, cardId, patch) {
    const item = this.capturedCards.find((entry) => entry.userId === userId && entry.id === cardId);
    if (!item) return null;
    Object.assign(item, patch);
    return clone(item);
  }
  async getLastCaptureLocation(userId) {
    const item = this.capturedCards.find((entry) => entry.userId === userId && entry.gps);
    return item ? { gps: item.gps, capturedAt: item.capturedAt } : null;
  }
  async hasCapturedSpecies(userId, speciesId) {
    return this.capturedCards.some((item) => item.userId === userId && item.speciesId === speciesId && item.status !== 'rejected');
  }
  async hasAnyCaptureOfSpecies(speciesId) {
    return this.capturedCards.some((item) => item.speciesId === speciesId && item.status !== 'rejected');
  }
  async getSpeciesDiscoveryStats(speciesId) {
    const notRejected = this.capturedCards.filter((item) => item.status !== 'rejected');
    return {
      speciesCount: notRejected.filter((item) => item.speciesId === speciesId).length,
      totalCount: notRejected.length,
    };
  }
  async hasSimilarCaptureImageHash(userId, hash, threshold = 0.95) {
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    return this.capturedCards.some((item) => item.userId === userId && item.imageHash && new Date(item.capturedAt).getTime() >= tenMinutesAgo && hashSimilarity(item.imageHash, hash) >= threshold);
  }
  async hasGlobalSimilarCaptureImageHash(userId, hash, threshold = 0.98) {
    return this.capturedCards.some((item) => item.userId !== userId && item.imageHash && hashSimilarity(item.imageHash, hash) >= threshold);
  }
  async createFeedEntry(entry) {
    if (this.feedEntries.some((item) => item.submissionId === entry.submissionId)) return clone(this.feedEntries.find((item) => item.submissionId === entry.submissionId));
    const value = { id: randomUUID(), createdAt: new Date().toISOString(), ...entry };
    this.feedEntries.unshift(value);
    return clone(value);
  }
  async listFeed() { return this.feedEntries.slice(0, 100).map(clone); }
  async listLeaderboard(userId) {
    const ranked = [...this.users.values()].sort((a, b) => b.totalXp - a.totalXp);
    return ranked.map((user, index) => ({ position: index + 1, userId: user.id, displayName: user.displayName, totalXp: user.totalXp, rankTitle: rankTitleForPosition(index, ranked.length), isCurrentUser: user.id === userId }));
  }
  async listRewards(userId) { return this.userRewards.filter((item) => item.userId === userId).map(clone); }
  async claimRewards(userId) {
    const now = new Date().toISOString();
    const claimed = this.userRewards.filter((item) => item.userId === userId && item.status === 'claimable');
    for (const item of claimed) {
      item.status = 'claimed'; item.claimedAt = now;
      if (item.rewardType === 'xp') {
        const key = `${userId}:level-reward:${item.level}`;
        if (!this.ledger.some((entry) => entry.key === key)) {
          this.ledger.push({ key, userId, amount: item.amount, reason: 'level_reward', createdAt: now });
          this.users.get(userId).totalXp += item.amount;
        }
      } else if (!this.inventory.some((entry) => entry.userId === userId && entry.itemKey === item.rewardKey)) {
        this.inventory.push({ userId, itemKey: item.rewardKey, itemType: item.rewardType, quantity: item.amount, label: item.label, acquiredAt: now });
      }
    }
    return claimed.map(clone);
  }
  async createNotification(notification) {
    if (notification.dedupeKey) {
      const existing = this.notifications.find((item) => item.userId === notification.userId && item.dedupeKey === notification.dedupeKey);
      if (existing) return clone(existing);
    }
    const value = { id: randomUUID(), readAt: null, createdAt: new Date().toISOString(), ...notification };
    this.notifications.unshift(value);
    return clone(value);
  }
  async listNotifications(userId) { return this.notifications.filter((item) => item.userId === userId).map(clone); }
  async markNotificationRead(userId, notificationId) {
    const item = this.notifications.find((entry) => entry.userId === userId && entry.id === notificationId);
    if (!item) return null;
    item.readAt = new Date().toISOString();
    return clone(item);
  }
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

const defaultLevelRewards = [
  { level: 5, rewardType: 'chest', rewardKey: 'bronze_chest', amount: 1, label: 'Bronze Chest' },
  { level: 10, rewardType: 'badge', rewardKey: 'steadfast_badge', amount: 1, label: 'Steadfast Badge' },
  { level: 18, rewardType: 'chest', rewardKey: 'mythril_chest', amount: 1, label: 'Mythril Chest' },
  { level: 19, rewardType: 'title', rewardKey: 'path_scholar', amount: 1, label: 'Path Scholar' },
  { level: 20, rewardType: 'badge', rewardKey: 'rare_path_badge', amount: 1, label: 'Rare Path Badge' },
  { level: 21, rewardType: 'xp', rewardKey: 'silver_arrival_bonus', amount: 250, label: 'Silver Arrival Bonus' },
  { level: 40, rewardType: 'title', rewardKey: 'golden_wayfarer', amount: 1, label: 'Golden Wayfarer' },
  { level: 60, rewardType: 'chest', rewardKey: 'platinum_chest', amount: 1, label: 'Platinum Chest' },
  { level: 80, rewardType: 'title', rewardKey: 'mythril_explorer', amount: 1, label: 'Mythril Explorer' },
  { level: 100, rewardType: 'badge', rewardKey: 'diamond_legend', amount: 1, label: 'Diamond Legend' },
  { level: 120, rewardType: 'title', rewardKey: 'ascendant', amount: 1, label: 'The Ascendant' },
];
function levelFromXp(totalXp) {
  let remaining = totalXp;
  let level = 1;
  const cost = (value) => value <= 20 ? 250 : value <= 40 ? 500 : value <= 60 ? 750 : value <= 80 ? 1000 : value <= 100 ? 1500 : 2000;
  while (remaining >= cost(level)) { remaining -= cost(level); level += 1; }
  return level;
}
function rankTitleForPosition(index, total) {
  const percentile = total ? ((index + 1) / total) * 100 : 100;
  if (percentile <= .1) return 'Legend Circle';
  if (percentile <= 1) return 'Mythril Knight';
  if (percentile <= 5) return 'Pathfinder';
  if (percentile <= 10) return 'Guardian';
  if (percentile <= 25) return 'Scout';
  return 'Adventurer';
}
function hashSimilarity(left, right) {
  const a = String(left || '');
  const b = String(right || '');
  if (!a || a.length !== b.length) return a === b ? 1 : 0;
  if (/^[a-f0-9]+$/i.test(a) && /^[a-f0-9]+$/i.test(b)) {
    let differingBits = 0;
    for (let index = 0; index < a.length; index += 1) differingBits += bitCount(parseInt(a[index], 16) ^ parseInt(b[index], 16));
    return 1 - differingBits / (a.length * 4);
  }
  let equal = 0;
  for (let index = 0; index < a.length; index += 1) if (a[index] === b[index]) equal += 1;
  return equal / a.length;
}
function bitCount(value) { let bits = value; let count = 0; while (bits) { count += bits & 1; bits >>>= 1; } return count; }
