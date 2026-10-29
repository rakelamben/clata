import type { StartupMetadataStore } from '../../bootstrap/bootstrapTypes';
import type { DatabasePort } from './DatabasePort';

export class SQLiteMetadataStore implements StartupMetadataStore {
  constructor(private readonly getDatabase: () => Promise<DatabasePort>, private readonly now: () => string = () => new Date().toISOString()) {}
  async getOnboardingCompleted() {
    const row = await (await this.getDatabase()).get<{ value_json: string }>('SELECT value_json FROM app_metadata WHERE key = ?', ['onboarding_completed']);
    return row ? JSON.parse(row.value_json) === true : false;
  }
  async setOnboardingCompleted(completed: boolean) {
    await (await this.getDatabase()).run('INSERT OR REPLACE INTO app_metadata(key, value_json, updated_at) VALUES (?, ?, ?)', ['onboarding_completed', JSON.stringify(completed), this.now()]);
  }
}
