import { describe, expect, it } from 'vitest';

import {
  getCachedPlaybackRate,
  setCachedPlaybackRate,
  resolveAudioSource,
} from '../../../src/features/vocabulary/audio/audioPlayback';

describe('AudioPlayback', () => {
  it('updates and retrieves cached playback rate', () => {
    setCachedPlaybackRate(1.0);
    expect(getCachedPlaybackRate()).toBe(1.0);

    setCachedPlaybackRate(0.8);
    expect(getCachedPlaybackRate()).toBe(0.8);

    setCachedPlaybackRate(1.0);
  });

  it('resolves bundled audio sources cleanly', () => {
    const resolved = resolveAudioSource('audio/kata-sugeng.opus');
    expect(resolved).toBeTruthy();

    const nonExistent = resolveAudioSource('invalid/path.mp3');
    expect(nonExistent).toBeNull();
  });
});
