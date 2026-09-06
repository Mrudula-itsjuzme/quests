import '@testing-library/jest-dom';
import { webcrypto } from 'node:crypto';

// Node 18's WebCrypto global is unreliable inside Vitest's sandboxed
// environments (ReferenceError: crypto is not defined) even though the
// project targets Node >= 22. Expose the real webcrypto implementation so
// tests that sign/verify JWTs (jose) and mint captures work on every
// supported runtime.
if (typeof globalThis.crypto === 'undefined' || typeof globalThis.crypto.subtle !== 'object') {
  globalThis.crypto = webcrypto;
}