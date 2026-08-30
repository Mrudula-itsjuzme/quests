import { describe, expect, it } from 'vitest';
import { normalizeTimezone } from './api';

describe('normalizeTimezone', () => {
  it('canonicalizes legacy Android timezone aliases', () => {
    expect(normalizeTimezone('Asia/Calcutta')).toBe('Asia/Kolkata');
  });

  it('trims user-editable timezone input and falls back to UTC', () => {
    expect(normalizeTimezone(' Asia/Kolkata ')).toBe('Asia/Kolkata');
    expect(normalizeTimezone('')).toBe('UTC');
  });
});
