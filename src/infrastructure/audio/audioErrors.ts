export class AudioPlaybackError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AudioPlaybackError';
  }
}
