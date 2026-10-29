import { describe, expect, it } from 'vitest';

import { validateContent } from '../../../tools/content-builder/src/validateContent';

describe('content builder rules', () => {
  it('rejects public POC content', () => {
    const result = validateContent({ units: [{ unit_id: 'u1' }], words: [{ id: 'w1', status: 'poc' }], sentences: [], dialogues: [], challenges: [], publicRelease: true });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'UNVERIFIED_PUBLIC_CONTENT')).toBe(true);
  });

  it('rejects sentence without exactly one gap', () => {
    const result = validateContent({ units: [], words: [], sentences: [{ id: 's1', level: 'L1', text: 'Sugeng enjing.' }], dialogues: [], challenges: [] });

    expect(result.issues.some((issue) => issue.code === 'INVALID_GAP_COUNT')).toBe(true);
  });
});
