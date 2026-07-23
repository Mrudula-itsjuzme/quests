import { createHash } from 'node:crypto';

export class ProviderNotConfiguredError extends Error {
  constructor(provider) {
    super(`${provider}_provider_not_configured`);
    this.code = 'provider_not_configured';
    this.provider = provider;
  }
}

export function createProviders({ mode = 'local', now = () => new Date() } = {}) {
  if (mode === 'disabled') {
    return {
      clock: { now },
      cache: new BoundedMemoryCache(500),
      scheduler: { async tick() { return { status: 'disabled' }; } },
      health: { async readMetric() { throw new ProviderNotConfiguredError('health'); } },
      storage: { async resolveUpload() { throw new ProviderNotConfiguredError('storage'); } },
      photo: { async verify() { throw new ProviderNotConfiguredError('photo'); } },
    };
  }

  return {
    clock: { now },
    cache: new BoundedMemoryCache(500),
    scheduler: { async tick(callback) { return callback ? callback(now()) : { status: 'idle' }; } },
    health: {
      async readMetric({ value }) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric) || numeric < 0) throw invalidProof('invalid_health_metric');
        return numeric;
      },
    },
    storage: {
      async resolveUpload(uploadId) {
        if (!/^local_[a-zA-Z0-9_-]{8,80}$/.test(String(uploadId || ''))) throw invalidProof('invalid_upload_reference');
        return { uploadId, objectKey: `local/${uploadId}` };
      },
    },
    photo: {
      async verify({ uploadId, subjectTag }) {
        const hash = createHash('sha256').update(String(uploadId)).digest('hex');
        return { confidence: 0.8, imageHash: hash, decision: 'approved' };
      },
    },
  };
}

class BoundedMemoryCache {
  constructor(limit) {
    this.limit = limit;
    this.values = new Map();
  }

  get(key) { return this.values.get(key); }
  set(key, value) {
    if (this.values.size >= this.limit && !this.values.has(key)) this.values.delete(this.values.keys().next().value);
    this.values.set(key, value);
  }
  delete(key) { this.values.delete(key); }
}

function invalidProof(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}
