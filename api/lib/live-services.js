import { randomUUID } from 'node:crypto';
import { DomainEvents } from './domain-events.js';
import { calculateProgression, progressionEngine } from './progression-engine.js';

export class EligibilityService {
  async isEligible({ user, template, now }) {
    for (const rule of template.eligibilityRules || []) {
      if (!this.matchesRule({ user, rule, now })) return false;
    }
    return true;
  }

  matchesRule({ user, rule }) {
    const value = rule.ruleValue;
    if (rule.ruleType === 'everyone') return true;
    if (rule.ruleType === 'specific_user') return String(value) === user.id;
    if (rule.ruleType === 'level_min') return progressionEngine.levelFromXp(user.totalXp) >= Number(value);
    if (rule.ruleType === 'level_max') return progressionEngine.levelFromXp(user.totalXp) <= Number(value);
    if (rule.ruleType === 'new_user') return Number(user.totalXp || 0) === 0;
    if (rule.ruleType === 'returning_user') return Number(user.totalXp || 0) > 0;
    if (rule.ruleType === 'premium_user') return Boolean(user.isPremium);
    if (rule.ruleType === 'group') return (user.groups || []).includes(value);
    if (rule.ruleType === 'guild') return user.guildId === value;
    if (rule.ruleType === 'college') return user.college === value;
    if (rule.ruleType === 'location') return user.location === value;
    return false;
  }
}

export class AssignmentService {
  constructor({ repository, eligibilityService, events, clock }) {
    this.repository = repository;
    this.eligibilityService = eligibilityService;
    this.events = events;
    this.clock = clock;
  }

  async syncAvailable(identity) {
    const user = await this.repository.ensureUser(identity);
    const now = this.clock.now();
    await this.repository.expireAssignments(user.id, now);
    const templates = await this.repository.listLiveQuestTemplates({ now });
    const created = [];
    for (const template of templates) {
      if (await this.eligibilityService.isEligible({ user, template, now })) {
        const assignment = await this.repository.assignTemplateToUser({
          userId: user.id,
          template,
          now,
          expiresAt: template.expiresAt || endOfDay(now),
        });
        if (assignment.created) {
          created.push(assignment.assignment);
          await this.events.publish(DomainEvents.QuestAssigned, { userId: user.id, assignmentId: assignment.assignment.id, questTemplateId: template.id });
        }
      }
    }
    return created;
  }

  async assignTemplate(identity, questTemplateId, targets = {}) {
    if (!identity.isAdmin) throw domainError('admin_required', 403);
    const now = this.clock.now();
    const template = await this.repository.getQuestTemplate(questTemplateId);
    if (!template) throw domainError('quest_template_not_found', 404);
    const users = await this.repository.resolveAssignmentTargets(targets);
    const assigned = [];
    for (const user of users) {
      const result = await this.repository.assignTemplateToUser({ userId: user.id, template, now, expiresAt: targets.expiresAt || template.expiresAt || endOfDay(now) });
      assigned.push(result.assignment);
      if (result.created) await this.events.publish(DomainEvents.QuestAssigned, { userId: user.id, assignmentId: result.assignment.id, questTemplateId });
    }
    return { assignedCount: assigned.length, assignments: assigned };
  }
}

export class QuestService {
  constructor({ repository }) {
    this.repository = repository;
  }

  async create(identity, payload) {
    if (!identity.isAdmin) throw domainError('admin_required', 403);
    return this.repository.createQuestTemplate({ ...payload, createdBy: identity.id });
  }

  async update(identity, id, payload) {
    if (!identity.isAdmin) throw domainError('admin_required', 403);
    const updated = await this.repository.updateQuestTemplate(id, payload);
    if (!updated) throw domainError('quest_template_not_found', 404);
    return updated;
  }

  async archive(identity, id) {
    if (!identity.isAdmin) throw domainError('admin_required', 403);
    const updated = await this.repository.updateQuestTemplate(id, { status: 'archived' });
    if (!updated) throw domainError('quest_template_not_found', 404);
    return updated;
  }

  async duplicate(identity, id) {
    if (!identity.isAdmin) throw domainError('admin_required', 403);
    const original = await this.repository.getQuestTemplate(id);
    if (!original) throw domainError('quest_template_not_found', 404);
    return this.repository.createQuestTemplate({
      ...original,
      id: `${original.id}-copy-${randomUUID().slice(0, 8)}`,
      title: `${original.title} Copy`,
      createdBy: identity.id,
      status: 'draft',
    });
  }
}

export class CampaignService {
  constructor({ repository, events, clock }) {
    this.repository = repository;
    this.events = events;
    this.clock = clock;
  }

  async create(identity, payload) {
    if (!identity.isAdmin) throw domainError('admin_required', 403);
    const campaign = await this.repository.createCampaign(payload);
    if (campaign.status === 'active') await this.events.publish(DomainEvents.CampaignStarted, { campaignId: campaign.id });
    return campaign;
  }

  async list(identity) {
    await this.repository.ensureUser(identity);
    return this.repository.listCampaigns({ now: this.clock.now(), visibility: 'public' });
  }
}

export class RewardService {
  constructor({ repository, events }) {
    this.repository = repository;
    this.events = events;
  }

  async grantCompletionRewards({ user, completion }) {
    const before = calculateProgression(Math.max(0, user.totalXp));
    const after = calculateProgression(completion.user.totalXp);
    if (after.level > before.level) await this.events.publish(DomainEvents.LevelUp, { userId: user.id, previousLevel: before.level, newLevel: after.level });
    if (completion.xpCredited || completion.bonusXp) await this.events.publish(DomainEvents.RewardGranted, { userId: user.id, xp: completion.xpCredited + completion.bonusXp });
  }
}

export class EventService {
  constructor({ repository, assignmentService, events, clock }) {
    this.repository = repository;
    this.assignmentService = assignmentService;
    this.events = events;
    this.clock = clock;
  }

  async launchFlashEvent(identity, payload) {
    if (!identity.isAdmin) throw domainError('admin_required', 403);
    const now = this.clock.now();
    const endsAt = new Date(now.getTime() + payload.durationMinutes * 60_000);
    const template = await this.repository.createQuestTemplate({
      ...payload.quest,
      startsAt: now.toISOString(),
      expiresAt: endsAt.toISOString(),
      status: 'active',
      createdBy: identity.id,
      source: 'flash_event',
    });
    const assignment = await this.assignmentService.assignTemplate(identity, template.id, { audience: 'everyone', expiresAt: endsAt.toISOString() });
    return { event: { id: randomUUID(), type: 'flash', questTemplateId: template.id, startsAt: now.toISOString(), endsAt: endsAt.toISOString() }, assignment };
  }
}

export class AnalyticsService {
  constructor({ repository }) {
    this.repository = repository;
  }

  async overview(identity) {
    if (!identity.isAdmin) throw domainError('admin_required', 403);
    return this.repository.getLiveAnalytics();
  }
}

export class LiveQuestEngine {
  constructor({ repository, providers, events }) {
    this.repository = repository;
    this.providers = providers;
    this.events = events;
    this.eligibility = new EligibilityService();
    this.assignments = new AssignmentService({ repository, eligibilityService: this.eligibility, events, clock: providers.clock });
    this.quests = new QuestService({ repository });
    this.campaigns = new CampaignService({ repository, events, clock: providers.clock });
    this.rewards = new RewardService({ repository, events });
    this.eventsService = new EventService({ repository, assignmentService: this.assignments, events, clock: providers.clock });
    this.analytics = new AnalyticsService({ repository });
  }

  async myQuests(identity) {
    await this.assignments.syncAvailable(identity);
    return this.repository.listMyQuestDashboard(identity.id, this.providers.clock.now());
  }
}

function endOfDay(now) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)).toISOString();
}

function domainError(code, status = 400) {
  const error = new Error(code);
  error.code = code;
  error.status = status;
  return error;
}
