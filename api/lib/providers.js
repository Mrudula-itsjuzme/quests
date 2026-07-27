import { createHash } from 'node:crypto';

export class ProviderNotConfiguredError extends Error {
  constructor(provider) {
    super(`${provider}_provider_not_configured`);
    this.code = 'provider_not_configured';
    this.provider = provider;
  }
}

export function createProviders({ mode = 'local', now = () => new Date(), aiVerifyUrl, providerSecret, notificationUrl } = {}) {
  if (mode === 'disabled') {
    return {
      capabilities: { health: false, photo: false },
      clock: { now },
      cache: new BoundedMemoryCache(500),
      scheduler: { async tick() { return { status: 'disabled' }; } },
      health: { async readMetric() { throw new ProviderNotConfiguredError('health'); } },
      storage: { async resolveUpload() { throw new ProviderNotConfiguredError('storage'); } },
      photo: { async verify() { throw new ProviderNotConfiguredError('photo'); } },
    };
  }

  if (mode === 'http') {
    const call = async (url, body) => {
      if (!url || !providerSecret) throw new ProviderNotConfiguredError('http');
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${providerSecret}` },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw invalidProof('provider_request_failed');
      return response.json();
    };
    return {
      capabilities: { health: false, photo: true },
      clock: { now },
      cache: new BoundedMemoryCache(500),
      scheduler: { async tick(callback) { return callback ? callback(now()) : { status: 'idle' }; } },
      health: { async readMetric() { throw new ProviderNotConfiguredError('health'); } },
      storage: {
        async resolveUpload(uploadId) {
          if (!/^[a-zA-Z0-9/_-]{8,240}$/.test(String(uploadId || '')) || String(uploadId).includes('..')) throw invalidProof('invalid_upload_reference');
          return { uploadId, objectKey: uploadId };
        },
      },
      photo: {
        async verify({ uploadId, subjectTag }) {
          const result = await call(aiVerifyUrl, { uploadId, subjectTag });
          const confidence = Number(result.confidence);
          if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1 || !result.perceptualHash) throw invalidProof('invalid_verification_response');
          return { confidence, imageHash: String(result.perceptualHash), metadata: result.metadata || {} };
        },
      },
      notifications: {
        async send(event) {
          if (!notificationUrl) return { status: 'disabled' };
          return call(notificationUrl, event);
        },
      },
    };
  }

  return {
    capabilities: { health: true, photo: true },
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
    notifications: { async send() { return { status: 'local' }; } },
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
