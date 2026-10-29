import { describe, expect, it } from 'vitest';

import { qualifiesWordView, ViewedExposureTracker } from '../../../src/features/vocabulary/domain/viewedRules';

describe('vocabulary viewed rules', () => {
  it('requires foreground and at least one second', () => {
    expect(qualifiesWordView(999, true)).toBe(false);
    expect(qualifiesWordView(1000, true)).toBe(true);
    expect(qualifiesWordView(1000, false)).toBe(false);
  });

  it('records one exposure per item per session', () => {
    const tracker = new ViewedExposureTracker();
    tracker.markVisible('word-1', 0, true);
    expect(tracker.qualifying(999, true)).toEqual([]);
    expect(tracker.qualifying(1000, true)).toEqual(['word-1']);
    expect(tracker.qualifying(2000, true)).toEqual([]);
  });

  it('does not count background time', () => {
    const tracker = new ViewedExposureTracker();
    tracker.markVisible('word-1', 0, true);
    tracker.markBackground();
    expect(tracker.qualifying(5000, true)).toEqual([]);
  });
});
