import { EventEmitter2 } from '@nestjs/event-emitter';
import { GameEventType } from '../../../core/event-bus/game-events';
import { VerificationEventListener } from '../../verification/application/verification-event-listener.service';
import { QuestVerificationListener } from './quest-verification-listener.service';

/**
 * Verifies the Quest -> Verification -> Quest chain works purely through
 * the event bus: QuestSubmissionReceived is handled by Verification Engine,
 * which never touches QuestAssignment directly, and SubmissionVerified is
 * handled by Quest Engine, which never calls Verification Engine's pipeline
 * directly. No engine here imports the other's application service — only
 * the shared EventEmitter2 connects them, exactly like production.
 */
describe('Quest <-> Verification event round trip', () => {
  function makeAssignment(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      id: 'assignment-1',
      userId: 'user-1',
      definitionId: 'def-1',
      status: 'active',
      progressValue: 0,
      targetValue: 1,
      ...overrides,
    };
  }

  function setup(decision: 'approved' | 'manual_review' | 'rejected', verificationType = 'MANUAL') {
    const emitter = new EventEmitter2();

    const questSubmissionUpdate = jest.fn().mockResolvedValue({});
    const questSubmissionFindUnique = jest.fn().mockResolvedValue({ metadata: {} });
    const questAssignmentUpdate = jest.fn().mockResolvedValue({});
    const questAssignmentFindUnique = jest.fn().mockResolvedValue(makeAssignment());
    const questSubmissionCount = jest.fn().mockResolvedValue(0);

    const verificationPrisma = {
      questSubmission: { update: questSubmissionUpdate, findUnique: questSubmissionFindUnique },
    } as any;
    const questPrisma = {
      questAssignment: { findUnique: questAssignmentFindUnique, update: questAssignmentUpdate },
      questSubmission: { count: questSubmissionCount },
    } as any;

    const pipeline = { verify: jest.fn().mockResolvedValue({ decision, confidence: 0.9 }) } as any;
    const eventBusForVerification = { emit: (type: string, payload: unknown) => emitter.emit(type, payload) } as any;

    const lifecycle = {
      recordProgress: jest.fn().mockResolvedValue({ assignment: makeAssignment({ status: 'completed' }), completed: true }),
      abandon: jest.fn().mockResolvedValue(makeAssignment({ status: 'abandoned' })),
    } as any;
    const content = { getById: jest.fn().mockResolvedValue({ id: 'def-1', verificationType }) } as any;

    const verificationListener = new VerificationEventListener(verificationPrisma, pipeline, eventBusForVerification);
    const questListener = new QuestVerificationListener(questPrisma, lifecycle, content);

    emitter.on(GameEventType.QuestSubmissionReceived, (payload) => verificationListener.onQuestSubmissionReceived(payload));
    emitter.on(GameEventType.SubmissionVerified, (payload) => questListener.onSubmissionVerified(payload));

    return { emitter, lifecycle, questAssignmentUpdate, pipeline, questPrisma };
  }

  it('advances assignment progress when verification approves', async () => {
    const { emitter, lifecycle } = setup('approved', 'MANUAL');

    await emitter.emitAsync(GameEventType.QuestSubmissionReceived, {
      userId: 'user-1',
      assignmentId: 'assignment-1',
      submissionId: 'sub-1',
      verificationType: 'MANUAL',
      subjectTag: 'water',
      text: 'drank 2L',
    });

    expect(lifecycle.recordProgress).toHaveBeenCalledWith('assignment-1', 1);
  });

  it('marks the assignment rejected on a single rejection (below abandon threshold)', async () => {
    const { emitter, questAssignmentUpdate } = setup('rejected');

    await emitter.emitAsync(GameEventType.QuestSubmissionReceived, {
      userId: 'user-1',
      assignmentId: 'assignment-1',
      submissionId: 'sub-1',
      verificationType: 'MANUAL',
      subjectTag: 'water',
    });

    expect(questAssignmentUpdate).toHaveBeenCalledWith({
      where: { id: 'assignment-1' },
      data: { status: 'rejected' },
    });
  });

  it('marks the assignment pending_verification on manual_review', async () => {
    const { emitter, questAssignmentUpdate } = setup('manual_review');

    await emitter.emitAsync(GameEventType.QuestSubmissionReceived, {
      userId: 'user-1',
      assignmentId: 'assignment-1',
      submissionId: 'sub-1',
      verificationType: 'MANUAL',
      subjectTag: 'water',
    });

    expect(questAssignmentUpdate).toHaveBeenCalledWith({
      where: { id: 'assignment-1' },
      data: { status: 'pending_verification' },
    });
  });

  it('never calls Verification Engine services directly from Quest Engine (only the event bus connects them)', () => {
    const questListenerSource = QuestVerificationListener.toString();
    expect(questListenerSource).not.toContain('VerificationPipelineService');
  });
});
