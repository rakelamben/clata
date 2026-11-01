import type { DatabasePort, DatabaseTransaction } from '../src/infrastructure/database/DatabasePort';

export class AuditMockDatabase implements DatabasePort {
  public words: Array<{
    package_id: string;
    item_id: string;
    unit_id: string;
    item_order: number;
    unit_order: number;
    register: string;
    payload_json: string;
  }> = [];

  public units: Array<{
    package_id: string;
    item_id: string;
    unit_order: number;
    title: string;
  }> = [];

  public sentences: Array<{
    package_id: string;
    item_id: string;
    unit_id: string;
    item_order: number;
    unit_order: number;
    payload_json: string;
  }> = [];

  public itemStrengthCache: Array<{
    package_id: string;
    item_type: string;
    item_id: string;
    strength: number;
    last_result: number;
    last_reviewed_at?: string;
  }> = [];

  public learningEvents: any[] = [];
  public practiceSessions: any[] = [];
  public practiceQuestions: any[] = [];
  public installedPackages = [{ package_id: 'jawa-mataraman', install_state: 'active' }];
  public eventSequence = 1;

  async exec(_sql: string): Promise<void> {}

  async run(sql: string, params: readonly unknown[] = []): Promise<{ changes: number; lastInsertRowId?: number }> {
    // console.log('RUN SQL:', sql, params);
    if (sql.includes('INSERT INTO practice_sessions')) {
      this.practiceSessions.push({
        session_id: params[0],
        package_id: params[1],
        exercise_type: params[2],
        unit_id: params[3],
        direction: params[4],
        question_count: params[5],
        status: params[6],
        started_at: params[7],
        current_index: 0,
        answered_count: 0,
        correct_count: 0,
      });
      return { changes: 1 };
    }
    if (sql.includes('INSERT INTO practice_questions')) {
      this.practiceQuestions.push({
        session_id: params[0],
        question_index: params[1],
        question_id: params[2],
        question_type: params[3],
        target_item_id: params[4],
        sentence_id: params[5],
        question_json: params[6],
        answered: 0,
        selected_option_id: null,
        correct: null,
      });
      return { changes: 1 };
    }
    if (sql.includes('INSERT INTO learning_events')) {
      this.learningEvents.push({
        event_id: params[0],
        local_sequence: params[1],
        device_id: params[2],
        package_id: params[3],
        item_id: params[4],
        event_type: params[5],
        source: params[6],
        result: params[7],
        weight: params[8],
        session_id: params[9],
        device_time: params[10],
        received_time: params[11],
        local_date: params[12],
        formula_version: params[13],
        payload_json: params[14],
        sync_status: params[15],
      });
      return { changes: 1 };
    }
    if (sql.includes('UPDATE app_event_sequence')) {
      this.eventSequence = Number(params[0]);
      return { changes: 1 };
    }
    if (sql.includes('INSERT OR REPLACE INTO rebuild_markers')) {
      return { changes: 1 };
    }
    if (sql.includes('UPDATE practice_questions')) {
      return { changes: 1 };
    }
    if (sql.includes('UPDATE practice_sessions')) {
      return { changes: 1 };
    }
    return { changes: 0 };
  }

  async get<T>(sql: string, params: readonly unknown[] = []): Promise<T | null> {
    if (sql.includes('installed_packages')) {
      const pkg = this.installedPackages.find((p) => p.package_id === params[0]);
      return (pkg ? { package_id: pkg.package_id } : null) as T;
    }
    if (sql.includes('SELECT next_sequence FROM app_event_sequence')) {
      return { next_sequence: this.eventSequence } as T;
    }
    if (sql.includes('SELECT event_id FROM learning_events')) {
      const existing = this.learningEvents.find((e) => e.event_id === params[0]);
      return (existing ? { event_id: existing.event_id } : null) as T;
    }
    if (sql.includes('SELECT item_id FROM words')) {
      const matched = this.words.find((w) => w.package_id === params[0] && w.item_id === params[1]);
      return (matched ? { item_id: matched.item_id } : null) as T;
    }
    if (sql.includes('SELECT boundary_local_sequence FROM package_reset_boundaries')) {
      return null;
    }
    if (sql.includes('SELECT * FROM practice_sessions WHERE session_id = ?')) {
      const session = this.practiceSessions.find((s) => s.session_id === params[0]);
      return (session ?? null) as T;
    }
    if (sql.includes('SELECT question_json, question_index, answered, selected_option_id, correct FROM practice_questions')) {
      const q = this.practiceQuestions.find((pq) => pq.session_id === params[0] && pq.question_id === params[1]);
      return (q ?? null) as T;
    }
    return null;
  }

  async all<T>(sql: string, params: readonly unknown[] = []): Promise<T[]> {
    if (sql.includes('FROM units')) {
      const packageId = params[1] as string;
      const matched = this.units.filter((u) => u.package_id === packageId);
      return matched.map((u) => ({
        item_id: u.item_id,
        title: u.title,
        unit_order: u.unit_order,
        word_count: this.words.filter((w) => w.package_id === packageId && w.unit_id === u.item_id).length,
        sentence_count: this.sentences.filter((s) => s.package_id === packageId && s.unit_id === u.item_id).length,
        dialogue_count: 0,
      })) as T[];
    }
    if (sql.includes('FROM words')) {
      // params: ['word', 'active', packageId, unitId ?? null, unitId ?? null]
      // params[2] is packageId, params[3] is unitId
      const packageId = params[2] as string;
      const unitId = params[3] as string | null;
      let matched = this.words.filter((w) => w.package_id === packageId && (!unitId || w.unit_id === unitId));
      const res = matched.map((w) => {
        const cache = this.itemStrengthCache.find((c) => c.package_id === w.package_id && c.item_id === w.item_id && c.item_type === 'word');
        return {
          package_id: w.package_id,
          item_id: w.item_id,
          unit_id: w.unit_id,
          item_order: w.item_order,
          unit_order: w.unit_order,
          register: w.register,
          payload_json: w.payload_json,
          strength: cache?.strength,
          last_result: cache?.last_result,
        };
      });
      return res as T[];
    }
    if (sql.includes('FROM sentences')) {
      const packageId = params[1] as string;
      let matched = this.sentences.filter((s) => s.package_id === packageId);
      return matched as T[];
    }
    if (sql.includes('FROM units')) {
      const packageId = params[1] as string;
      const matched = this.units.filter((u) => u.package_id === packageId);
      return matched.map((u) => ({ item_id: u.item_id, title: u.title, unit_order: u.unit_order })) as T[];
    }
    return [];
  }

  async transaction<T>(callback: (transaction: DatabaseTransaction) => Promise<T>): Promise<T> {
    return callback(this);
  }
}
