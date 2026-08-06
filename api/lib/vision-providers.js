const CATEGORIES = ['Mind', 'Body', 'Discovery'];

/**
 * Swappable behind config — new providers are additive (new file + one
 * factory branch), mirroring server/src/engines/ai-services' pattern.
 * classify() returns raw signal; rarityTierFromScore() below turns that
 * into a stable Bronze/Silver/Gold/Platinum tier independent of the model.
 */
export class VisionClassificationError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
    this.status = 502;
  }
}

/** Deterministic placeholder for local dev / no key configured. Never used in production if a key is required. */
export class StubVisionProvider {
  async classify(_imageBase64) {
    const seed = _imageBase64 ? hashToUnit(_imageBase64.slice(0, 64)) : Math.random();
    const category = CATEGORIES[Math.floor(seed * CATEGORIES.length) % CATEGORIES.length];
    return {
      itemName: 'Mysterious Object',
      category,
      rarityScore: seed,
      cardTitle: 'The Curious Find',
      description: 'A stubbed classification — configure VISION_PROVIDER=openrouter for real results.',
    };
  }
}

export class OpenRouterVisionProvider {
  constructor({ apiKey, model = 'google/gemini-2.0-flash-001' } = {}) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async classify(imageBase64) {
    if (!this.apiKey) throw new VisionClassificationError('vision_provider_not_configured');

    const prompt = `You are a whimsical collector's-card appraiser for a habit-tracking game. Look at the photographed item/scene and respond with ONLY a JSON object, no prose:
{"itemName": "short plain description of what is shown", "category": "Mind" | "Body" | "Discovery", "rarityScore": number between 0 and 1 (how visually striking/rare-feeling it is), "cardTitle": "a short quirky collectible-card name for this item", "description": "one playful sentence"}
Category guide: Mind = calm/indoor/reflective scenes, Body = fitness/food/physical activity, Discovery = outdoor/nature/exploration.`;

    let response;
    try {
      response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: imageBase64 } },
              ],
            },
          ],
          response_format: { type: 'json_object' },
        }),
        signal: AbortSignal.timeout(20_000),
      });
    } catch {
      throw new VisionClassificationError('vision_provider_unreachable');
    }

    if (!response.ok) throw new VisionClassificationError('vision_provider_request_failed');

    let body;
    try {
      body = await response.json();
    } catch {
      throw new VisionClassificationError('vision_provider_invalid_response');
    }

    const content = body?.choices?.[0]?.message?.content;
    const parsed = parseJsonLoose(content);
    if (!parsed || !CATEGORIES.includes(parsed.category) || typeof parsed.rarityScore !== 'number') {
      throw new VisionClassificationError('vision_provider_invalid_response');
    }

    return {
      itemName: String(parsed.itemName || 'Unknown Item').slice(0, 160),
      category: parsed.category,
      rarityScore: Math.min(1, Math.max(0, parsed.rarityScore)),
      cardTitle: String(parsed.cardTitle || 'Unnamed Card').slice(0, 80),
      description: String(parsed.description || '').slice(0, 400),
    };
  }
}

export function resolveVisionProvider(config) {
  if (config.VISION_PROVIDER === 'openrouter') {
    return new OpenRouterVisionProvider({ apiKey: config.OPENROUTER_API_KEY, model: config.OPENROUTER_VISION_MODEL });
  }
  return new StubVisionProvider();
}

export function rarityTierFromScore(score) {
  if (score >= 0.85) return 'Platinum';
  if (score >= 0.6) return 'Gold';
  if (score >= 0.35) return 'Silver';
  return 'Bronze';
}

function parseJsonLoose(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    const match = String(text).match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function hashToUnit(input) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) | 0;
  }
  return (Math.abs(hash) % 1000) / 1000;
}
