export class VocabularyError extends Error {
  constructor(message: string, readonly recoverable = true) {
    super(message);
    this.name = 'VocabularyError';
  }
}
