import type { AudioPlaybackState } from './audioTypes';

export interface AudioPort {
  play(input: { itemId: string; uri: string | number; format: 'opus' | 'm4a' | 'aac' }): Promise<void>;
  stop(): Promise<void>;
  getState(): AudioPlaybackState;
  getActiveItemId(): string | null;
  subscribe(listener: (state: AudioPlaybackState) => void): () => void;
  dispose(): void;
}
