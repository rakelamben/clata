export class PracticeError extends Error { constructor(message: string, readonly recoverable = true) { super(message); this.name = 'PracticeError'; } }
