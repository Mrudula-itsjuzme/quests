export interface AiVisionClassification {
  matches: boolean;
  confidence: number;
  labels?: string[];
}

/** Swappable behind config — OpenAI/Gemini/stub implementations are additive, never a rewrite. */
export interface AiVisionProvider {
  classify(imageRef: string, subjectTag: string): Promise<AiVisionClassification>;
}
