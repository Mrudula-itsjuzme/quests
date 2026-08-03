export type VerificationDecision = 'approved' | 'manual_review' | 'rejected';

export interface VerificationResult {
  decision: VerificationDecision;
  confidence?: number;
  imageHash?: string;
  metadata?: Record<string, unknown>;
}

export interface VerificationSubmissionInput {
  assignmentId: string;
  userId: string;
  subjectTag: string;
  text?: string;
  uploadId?: string;
}

/** One implementation per verification type. Never called directly by Quest Domain — always via VerificationPipeline. */
export interface VerificationStrategy {
  readonly type: string;
  verify(input: VerificationSubmissionInput): Promise<VerificationResult>;
}
