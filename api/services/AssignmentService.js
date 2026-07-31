import { DomainEventBus, DomainEvents } from '../lib/domain-events.js';

export class AssignmentService {
  constructor(assignmentRepository, templateRepository, eventBus = new DomainEventBus()) {
    this.assignmentRepository = assignmentRepository;
    this.templateRepository = templateRepository;
    this.eventBus = eventBus;
  }

  async assignQuest(userId, questTemplateId, expiresAt = null) {
    const template = await this.templateRepository.getById(questTemplateId);
    if (!template) throw new Error('Quest template not found');

    const assignment = await this.assignmentRepository.create({
      userId,
      questTemplateId,
      expiresAt
    });

    await this.eventBus.publish(DomainEvents.QuestAssigned, {
      userId,
      assignmentId: assignment.id,
      questTemplateId
    });

    return assignment;
  }

  async getActiveAssignments(userId) {
    return this.assignmentRepository.listActiveByUser(userId);
  }

  async updateProgress(assignmentId, progressValue) {
    const assignment = await this.assignmentRepository.getById(assignmentId);
    if (!assignment) throw new Error('Assignment not found');
    if (['completed', 'expired', 'abandoned'].includes(assignment.status)) {
      throw new Error('Assignment is no longer active');
    }

    const template = await this.templateRepository.getById(assignment.questTemplateId);
    
    const targetValue = template.requirements?.targetValue || 1;
    const isCompleted = progressValue >= targetValue;
    
    const status = isCompleted ? 'completed' : 'active';
    
    const updated = await this.assignmentRepository.updateProgress(assignmentId, progressValue, status);

    if (isCompleted) {
      await this.eventBus.publish(DomainEvents.QuestCompleted, {
        userId: assignment.userId,
        assignmentId,
        questTemplateId: assignment.questTemplateId,
        xpReward: template.xpReward,
        coinReward: template.coinReward
      });
    }

    return { assignment: updated, isCompleted };
  }
}
