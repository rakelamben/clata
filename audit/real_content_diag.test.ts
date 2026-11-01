import { describe, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DatabaseSync } = require('node:sqlite');
import type { DatabasePort } from '../src/infrastructure/database/DatabasePort';
import { runMigrations } from '../src/infrastructure/database/migrations/migrationRunner';
import { SQLitePackageStorage } from '../src/features/packages/infrastructure/sqlitePackageStorage';
import { SQLiteProgressRepository } from '../src/features/progress/data/progressRepository';
import { SQLitePracticeRepository } from '../src/features/practice/data/sqlitePracticeRepository';
import { SQLiteDialogueRepository } from '../src/features/dialogues/data/sqliteDialogueRepository';
import { startDialogueRun } from '../src/features/dialogues/application/startDialogueRun';
import { submitDialogueChoice } from '../src/features/dialogues/application/submitDialogueChoice';
import { pickPracticeWords } from '../src/features/practice/domain/contentPicker';

const PKG = 'jawa-mataraman';
const SRC = join(__dirname, '..', 'content', 'packages', PKG, 'source');
const log = (...a: unknown[]) => console.log('[DIAG]', ...a);

function createDb(): DatabasePort {
  const raw = new DatabaseSync(':memory:');
  const norm = (p: readonly unknown[] = []) => p.map((v) => (typeof v === 'boolean' ? (v ? 1 : 0) : v === undefined ? null : v));
  const port: DatabasePort = {
    async exec(sql) { raw.exec(sql); },
    async run(sql, params) { const r = raw.prepare(sql).run(...norm(params)); return { changes: Number(r.changes) }; },
    async get(sql, params) { return (raw.prepare(sql).get(...norm(params)) ?? null) as never; },
    async all(sql, params) { return raw.prepare(sql).all(...norm(params)) as never; },
    async transaction(work) { raw.exec('SAVEPOINT tx'); try { const o = await work(port); raw.exec('RELEASE tx'); return o; } catch (e) { raw.exec('ROLLBACK TO tx'); raw.exec('RELEASE tx'); throw e; } },
  };
  return port;
}

describe('Diagnosa', () => {
  it('akar masalah', async () => {
    const db = createDb();
    await runMigrations(db);
    const t = new Date('2026-10-31T09:00:00.000Z');
    const clock = { now: () => t };
    const storage = new SQLitePackageStorage(async () => db, () => t.toISOString());
    const enc = new TextEncoder();
    const entries = ['manifest.json', 'unit.json', 'kata.json', 'kalimat.json', 'dialog.json', 'challenge.json'].map((f) => ({ path: f, data: enc.encode(readFileSync(join(SRC, f), 'utf8')) }));
    const m = JSON.parse(readFileSync(join(SRC, 'manifest.json'), 'utf8'));
    log('registerMapping manifest:', JSON.stringify(m.registerMapping));
    await storage.stage({ packageId: PKG, languageId: m.languageId, dialectId: m.dialectId, packageVersion: m.packageVersion, schemaVersion: m.schemaVersion } as never, entries as never);
    await storage.activate(PKG);
    const progress = new SQLiteProgressRepository(db, 'dev', () => t.toISOString());
    const practice = new SQLitePracticeRepository(db, progress, clock, 'dev');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyRepo = practice as any;

    // 1. Gap SQL
    try {
      await db.all('SELECT package_id, item_id, unit_id, item_order, units.unit_order, payload_json FROM sentences JOIN units ON units.package_id = sentences.package_id AND units.item_id = sentences.unit_id JOIN installed_packages ON installed_packages.package_id = sentences.package_id AND installed_packages.install_state = ? WHERE sentences.package_id = ? AND (? IS NULL OR sentences.unit_id = ?)', ['active', PKG, null, null]);
      log('GAP SQL: OK');
    } catch (e) { log('GAP SQL ERROR:', (e as Error).message); }

    // 2. Guess drop reasons
    const words = await anyRepo.words(PKG, 'unit-1');
    const ordered = pickPracticeWords(words, { packageId: PKG, unitId: 'unit-1', count: words.length, seed: 'x', today: '2026-10-31' });
    log('pickPracticeWords hasil:', ordered.length, 'dari', words.length, '(dibatasi max 20)');
    const reasons: Record<string, string[]> = {};
    for (const target of ordered) {
      const tm = target.meaning.toLowerCase().trim();
      const pool = words.filter((c: { id: string; meaning: string; lemma: string }) => c.id !== target.id && c.meaning.toLowerCase().trim() !== tm && c.lemma.toLowerCase().trim() !== target.lemma.toLowerCase().trim());
      const same = pool.filter((c: { partOfSpeech?: string; theme?: string }) => c.partOfSpeech === target.partOfSpeech && c.theme === target.theme);
      const samePos = pool.filter((c: { partOfSpeech?: string; theme?: string }) => c.partOfSpeech === target.partOfSpeech && c.theme !== target.theme);
      const others = pool.filter((c: { partOfSpeech?: string }) => c.partOfSpeech !== target.partOfSpeech);
      const picked = [...same, ...samePos, ...others].slice(0, 3);
      const labels = [target.meaning, ...picked.map((p: { meaning: string }) => p.meaning)].map((s) => s.toLowerCase());
      const dup = new Set(labels).size !== labels.length;
      const key = dup ? 'AMBIGUOUS (arti pengecoh kembar)' : 'OK';
      (reasons[key] ??= []).push(`${target.lemma}=>[${labels.join('|')}]`);
    }
    for (const [k, v] of Object.entries(reasons)) log(`GUESS ${k}: ${v.length}`, v.slice(0, 4).join('  '));

    // 3. Dialog error
    const dialogue = new SQLiteDialogueRepository(db, progress, clock, 'dev');
    const st = await startDialogueRun({ dialogueRepository: dialogue, progressRepository: progress, clock, deviceId: 'dev', packageId: PKG, dialogueId: 'dialog-sapaan' });
    if (st.ok) {
      log('DIALOG nodes:', JSON.stringify(st.data.dialogue.nodes.map((n) => ({ id: n.id, next: (n as never as { next?: string }).next, choices: (n.choices ?? []).map((c) => ({ q: c.quality, next: c.next, ending: (c as never as { endingId?: string }).endingId })) }))));
      log('DIALOG endings:', JSON.stringify(st.data.dialogue.endings));
      let state = st.data.runState;
      for (let i = 0; i < 6; i++) {
        try {
          const r = await submitDialogueChoice({ dialogueRepository: dialogue, progressRepository: progress, clock, deviceId: 'dev', dialogue: st.data.dialogue, runState: state, choiceIndex: 0 });
          if (!r.ok) { log('DIALOG step', i, 'repo error:', JSON.stringify(r.error)); break; }
          log('DIALOG step', i, 'node', state.currentNodeId, '->', r.data.nextStep.type, r.data.nextStep.node?.id ?? r.data.nextStep.ending?.id);
          state = r.data.updatedState;
          if (r.data.nextStep.type === 'ending') break;
        } catch (e) { log('DIALOG step', i, 'throw:', e instanceof Error ? e.message : JSON.stringify(e)); break; }
      }
    } else log('DIALOG start error', JSON.stringify(st.error));
    const raw = JSON.parse(readFileSync(join(SRC, 'dialog.json'), 'utf8'))[0];
    log('DIALOG raw node[0]:', JSON.stringify(raw.nodes[0]).slice(0, 400));
    log('DIALOG raw keys node types:', JSON.stringify(raw.nodes.map((n: Record<string, unknown>) => Object.keys(n).join('/'))));
  }, 60000);
});
