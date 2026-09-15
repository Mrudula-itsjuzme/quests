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
  constructor({ apiKey, model = 'google/gemini-2.0-flash-001', fetchImpl = fetch, timeoutMs = 20_000, maxRetries = 1 } = {}) {
    this.apiKey = apiKey;
    this.model = model;
    this.fetchImpl = fetchImpl;
    this.timeoutMs = timeoutMs;
    this.maxRetries = maxRetries;
  }

  async identify(imageBase64) {
    if (!this.apiKey) throw new VisionClassificationError('vision_provider_not_configured');

    const prompt = `You are a field naturalist identifying the subject of a nature photograph for a wildlife-discovery game. Look at the photographed subject (animal, plant, landscape feature, or heritage site) and respond with ONLY a JSON object, no prose:
{"candidates": [{"commonName": "...", "scientificName": "... or null", "category": "Flora" | "Fauna" | "Landscape" | "Heritage", "element": "Fire" | "Water" | "Grass" | "Earth" | "Sky", "ecosystem": "short habitat description or null", "confidence": number between 0 and 1}]}

CRITICAL RULE: If the primary subject is heavily artificial, indoors, or not a valid nature/heritage subject (e.g., a computer, a car, a random household object), you MUST reject it by returning an empty candidates array: {"candidates": []}

Return the top candidate first, followed by up to 2 alternates if genuinely uncertain. Element guide: Fire = sky phenomena/heat/light events, Water = aquatic or water-associated subjects, Grass = plants/insects/small flora fauna, Earth = land mammals/geology, Sky = birds/aerial. Confidence reflects how certain you are of the identification, not how interesting the subject is.`;

    const request = {
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
    };

    let response;
    let lastError;
    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      try {
        response = await this.fetchImpl('https://openrouter.ai/api/v1/chat/completions', {
          ...request,
          signal: AbortSignal.timeout(this.timeoutMs),
        });
        if (response.ok) break;
        const retryable = response.status === 429 || response.status >= 500;
        if (!retryable || attempt === this.maxRetries) {
          throw new VisionClassificationError(retryable ? 'vision_provider_unavailable' : 'vision_provider_request_failed');
        }
      } catch (error) {
        if (error instanceof VisionClassificationError) throw error;
        lastError = error;
        if (attempt === this.maxRetries) {
          const timedOut = error?.name === 'TimeoutError' || error?.name === 'AbortError';
          throw new VisionClassificationError(timedOut ? 'vision_provider_timeout' : 'vision_provider_unreachable');
        }
      }
    }

    if (!response) {
      const timedOut = lastError?.name === 'TimeoutError' || lastError?.name === 'AbortError';
      throw new VisionClassificationError(timedOut ? 'vision_provider_timeout' : 'vision_provider_unreachable');
    }

    if (!response.ok) throw new VisionClassificationError('vision_provider_unavailable');

    let body;
    try {
      body = await response.json();
    } catch {
      throw new VisionClassificationError('vision_provider_invalid_response');
    }

    const content = body?.choices?.[0]?.message?.content;
    const parsed = parseJsonLoose(content);
    if (!parsed || !Array.isArray(parsed.candidates)) {
       throw new VisionClassificationError('vision_provider_invalid_response');
    }
    const candidates = parsed.candidates;
    if (candidates.length === 0) {
       throw new VisionClassificationError('vision_provider_invalid_subject'); // Custom error for invalid item rejection
    }

    const normalized = candidates
      .filter((candidate) => typeof candidate.commonName === 'string' && candidate.commonName.trim() && CATEGORIES.includes(candidate.category) && ELEMENTS.includes(candidate.element) && typeof candidate.confidence === 'number' && Number.isFinite(candidate.confidence))
      .map((candidate) => ({
        commonName: candidate.commonName.trim().slice(0, 160),
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
    return new OpenRouterVisionProvider({
      apiKey: config.OPENROUTER_API_KEY,
      model: config.OPENROUTER_VISION_MODEL,
      timeoutMs: config.VISION_PROVIDER_TIMEOUT_MS,
      maxRetries: config.VISION_PROVIDER_MAX_RETRIES,
    });
  }
  return new StubVisionProvider();
}

/** A species the AI identified that isn't in our curated catalog yet has no scarcity data to draw on. */
const UNCATALOGED_SPECIES_BASE_RARITY = 0.5;

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
    baseRarity: UNCATALOGED_SPECIES_BASE_RARITY,
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
