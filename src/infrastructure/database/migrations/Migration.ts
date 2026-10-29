import type { DatabasePort } from '../DatabasePort';

export type Migration = { version: number; name: string; up: (database: DatabasePort) => Promise<void> };
