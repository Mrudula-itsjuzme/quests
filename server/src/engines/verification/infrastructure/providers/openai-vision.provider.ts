import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiVisionClassification, AiVisionProvider } from './ai-vision-provider';

@Injectable()
export class OpenAiVisionProvider implements AiVisionProvider {
  constructor(private readonly config: ConfigService) {}

  async classify(imageRef: string, subjectTag: string): Promise<AiVisionClassification> {
    const apiKey = this.config.get<string>('ai.openAiApiKey');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: `Does this image contain: ${subjectTag}? Respond with JSON {"matches": boolean, "confidence": number 0-1}.` },
              { type: 'image_url', image_url: { url: imageRef } },
            ],
          },
        ],
        response_format: { type: 'json_object' },
      }),
    });
    if (!response.ok) {
      throw new Error(`openai_vision_error:${response.status}`);
    }
    const body = (await response.json()) as { choices: Array<{ message: { content: string } }> };
    const parsed = JSON.parse(body.choices[0].message.content) as { matches: boolean; confidence: number };
    return { matches: parsed.matches, confidence: parsed.confidence };
  }
}
