import { dailyPeriod, weeklyPeriod } from './time.js';

export const cadenceStrategies = Object.freeze({
  daily: Object.freeze({
    period(now, user) { return dailyPeriod(now, user.timezone); },
    categories: Object.freeze(['Mind', 'Body', 'Discovery']),
  }),
  weekly: Object.freeze({
    period(now) { return weeklyPeriod(now); },
    categories: Object.freeze(['Weekly']),
  }),
});

export function createVerificationStrategies({ providers, repository }) {
  return Object.freeze({
    AUTO: Object.freeze({
      async progress(assignment, payload) {
        const value = await providers.health.readMetric({ subjectTag: assignment.subjectTag, value: payload.value });
        return { progressValue: Math.min(assignment.targetValue, value) };
      },
      async submit() { throw domainError('auto_quest_requires_health_progress', 409); },
    }),
    TEXT: Object.freeze({
      async submit(assignment, payload) {
        const text = String(payload.text || '').trim();
        if (text.length < 8 || text.length > 10_000) throw domainError('invalid_text_proof', 400);
        if (assignment.unit === 'words' && text.split(/\s+/).filter(Boolean).length < assignment.targetValue) throw domainError('text_target_not_met', 400);
        return { decision: 'approved', imageHash: null, confidence: null };
      },
    }),
    PHOTO: Object.freeze({
      async submit(assignment, payload, user) {
        const upload = await providers.storage.resolveUpload(payload.uploadId);
        const result = await providers.photo.verify({ uploadId: upload.uploadId, subjectTag: assignment.subjectTag });
        if (await repository.hasImageHash(user.id, result.imageHash)) throw domainError('duplicate_submission', 409);
        return {
          decision: result.confidence >= 0.75 ? 'approved' : result.confidence >= 0.5 ? 'manual_review' : 'rejected',
          imageHash: result.imageHash,
          confidence: result.confidence,
        };
      },
    }),
  });
}

function domainError(code, status) {
  const error = new Error(code);
  error.code = code;
  error.status = status;
  return error;
}
