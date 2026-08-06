import { findSpeciesByCommonName, speciesCatalog } from './species-catalog.js';

const CATEGORIES = ['Flora', 'Fauna', 'Landscape', 'Heritage'];
const ELEMENTS = ['Fire', 'Water', 'Grass', 'Earth', 'Sky'];

/**
 * Swappable behind config — new providers are additive (new file + one
 * factory branch), mirroring server/src/engines/ai-services' pattern.
 * identify() returns raw candidates; the caller resolves each candidate
 * against the species catalog and hands the result to the Rarity Engine.
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
  async identify(imageBase64) {
    const seed = imageBase64 ? hashToUnit(imageBase64.slice(0, 64)) : Math.random();
    const pick = speciesCatalog[Math.floor(seed * speciesCatalog.length) % speciesCatalog.length];
    return {
      candidates: [
        {
          commonName: pick.commonName,
          scientificName: pick.scientificName,
          category: pick.category,
          element: pick.element,
          ecosystem: null,
          confidence: 0.5 + seed * 0.45,
        },
      ],
    };
  }
}

export class OpenRouterVisionProvider {
  constructor({ apiKey, model = 'google/gemini-2.0-flash-001' } = {}) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async identify(imageBase64) {
    if (!this.apiKey) throw new VisionClassificationError('vision_provider_not_configured');

    const prompt = `You are a field naturalist identifying the subject of a nature photograph for a wildlife-discovery game. Look at the photographed subject (animal, plant, landscape feature, or heritage site) and respond with ONLY a JSON object, no prose:
{"candidates": [{"commonName": "...", "scientificName": "... or null", "category": "Flora" | "Fauna" | "Landscape" | "Heritage", "element": "Fire" | "Water" | "Grass" | "Earth" | "Sky", "ecosystem": "short habitat description or null", "confidence": number between 0 and 1}]}
Return the top candidate first, followed by up to 2 alternates if genuinely uncertain. Element guide: Fire = sky phenomena/heat/light events, Water = aquatic or water-associated subjects, Grass = plants/insects/small flora fauna, Earth = land mammals/geology, Sky = birds/aerial. Confidence reflects how certain you are of the identification, not how interesting the subject is.`;

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
    const candidates = Array.isArray(parsed?.candidates) ? parsed.candidates : null;
    if (!candidates || candidates.length === 0) throw new VisionClassificationError('vision_provider_invalid_response');

    const normalized = candidates
      .filter((candidate) => CATEGORIES.includes(candidate.category) && ELEMENTS.includes(candidate.element) && typeof candidate.confidence === 'number')
      .map((candidate) => ({
        commonName: String(candidate.commonName || 'Unknown Subject').slice(0, 160),
        scientificName: candidate.scientificName ? String(candidate.scientificName).slice(0, 160) : null,
        category: candidate.category,
        element: candidate.element,
        ecosystem: candidate.ecosystem ? String(candidate.ecosystem).slice(0, 200) : null,
        confidence: Math.min(1, Math.max(0, candidate.confidence)),
      }));

    if (normalized.length === 0) throw new VisionClassificationError('vision_provider_invalid_response');
    return { candidates: normalized.sort((a, b) => b.confidence - a.confidence) };
  }
}

export function resolveVisionProvider(config) {
  if (config.VISION_PROVIDER === 'openrouter') {
    return new OpenRouterVisionProvider({ apiKey: config.OPENROUTER_API_KEY, model: config.OPENROUTER_VISION_MODEL });
  }
  return new StubVisionProvider();
}

/** Resolves an identification candidate against the species catalog, matching by common name. */
export function resolveCandidateSpecies(candidate) {
  const matched = findSpeciesByCommonName(candidate.commonName);
  if (matched) return matched;
  return {
    id: null,
    commonName: candidate.commonName,
    scientificName: candidate.scientificName,
    element: candidate.element,
    category: candidate.category,
    baseRarity: 0.5,
    nocturnal: false,
    sensitive: false,
    seasonalityMonths: [],
    encyclopedia: '',
  };
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
