import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import type { AudioPort } from './AudioPort';
import type { AudioPlaybackState } from './audioTypes';

export class ExpoAudioAdapter implements AudioPort {
  private player: AudioPlayer | null = null;
  private playerSubscription: { remove(): void } | null = null;
  private sourceGeneration = 0;
  private state: AudioPlaybackState = 'idle';
  private currentItemId: string | null = null;
  private readonly listeners = new Set<(state: AudioPlaybackState) => void>();

  constructor() {
    void setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'doNotMix' }).catch(() => undefined);
  }

  private setState(state: AudioPlaybackState): void {
    this.state = state;
    for (const listener of this.listeners) listener(state);
  }

  private bindPlayerEvents(generation: number): void {
    if (!this.player) return;
    this.playerSubscription = this.player.addListener('playbackStatusUpdate', (status) => {
      if (generation !== this.sourceGeneration) return;
      if (status.error) this.setState('error');
      else if (status.mediaServicesDidReset) this.setState('interrupted');
      else if (status.didJustFinish) {
        this.currentItemId = null;
        this.setState('stopped');
      } else if (status.playing) this.setState('playing');
      else if (!status.isLoaded || status.isBuffering) this.setState('loading');
      else if (this.state === 'playing') this.setState('stopped');
    });
  }

  async play(input: { itemId: string; uri: string | number; format: 'opus' | 'm4a' | 'aac' }): Promise<void> {
    try {
      this.setState('loading');
      if (!this.player) {
        this.player = createAudioPlayer(null, { updateInterval: 250, downloadFirst: true });
      }
      if (this.currentItemId !== input.itemId) {
        this.player.pause();
        this.playerSubscription?.remove();
        this.playerSubscription = null;
        this.sourceGeneration += 1;
        this.player.replace(input.uri);
        this.currentItemId = input.itemId;
        this.bindPlayerEvents(this.sourceGeneration);
      } else {
        await this.player.seekTo(0);
      }
      this.player.play();
      this.currentItemId = input.itemId;
      this.setState('playing');
    } catch (error) {
      this.setState('error');
      throw error;
    }
  }

  async stop(): Promise<void> {
    this.player?.pause();
    this.currentItemId = null;
    this.setState('stopped');
  }

  getState(): AudioPlaybackState { return this.state; }
  getActiveItemId(): string | null { return this.currentItemId; }

  subscribe(listener: (state: AudioPlaybackState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  dispose(): void {
    this.sourceGeneration += 1;
    this.playerSubscription?.remove();
    this.playerSubscription = null;
    this.player?.release();
    this.player = null;
    this.currentItemId = null;
    this.setState('idle');
  }
}
