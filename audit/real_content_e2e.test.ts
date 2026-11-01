/**
 * Audit end-to-end dengan SQLite sungguhan (node:sqlite), migrasi asli,
 * konten paket Jawa Mataraman asli, dan repository asli yang dipakai aplikasi.
 * File ini hanya mencetak temuan (tidak meng-assert) agar tidak memblokir suite.
 */
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
import { SQLiteVocabularyRepository } from '../src/features/vocabulary/data/sqliteVocabularyRepository';
import { SQLiteDialogueRepository } from '../src/features/dialogues/data/sqliteDialogueRepository';
import { SQLiteChallengeRepository } from '../src/features/challenges/data/sqliteChallengeRepository';
import { validateDialogueGraph } from '../src/features/dialogues/domain/dialogueGraphValidator';
import { startDialogueRun } from '../src/features/dialogues/application/startDialogueRun';
import { submitDialogueChoice } from '../src/features/dialogues/application/submitDialogueChoice';
import { advanceDialogueNode } from '../src/features/dialogues/application/advanceDialogueNode';
import { recordWordViewed } from '../src/features/vocabulary/application/recordWordViewed';
import { validatePracticeQuestion } from '../src/features/practice/domain/questionValidation';

const PKG = 'jawa-mataraman';
const SRC = join(__dirname, '..', 'content', 'packages', PKG, 'source');

function createDb(): DatabasePort {
  const raw = new DatabaseSync(':memory:');
  const norm = (p: readonly unknown[] = []) => p.map((v) => (typeof v === 'boolean' ? (v ? 1 : 0) : v === undefined ? null : v));
  const port: DatabasePort = {
    async exec(sql) { raw.exec(sql); },
    async run(sql, params) { const r = raw.prepare(sql).run(...norm(params)); return { changes: Number(r.changes), lastInsertRowId: Number(r.lastInsertRowid) }; },
    async get(sql, params) { return (raw.prepare(sql).get(...norm(params)) ?? null) as never; },
    async all(sql, params) { return raw.prepare(sql).all(...norm(params)) as never; },
    async transaction(work) {
      raw.exec('SAVEPOINT tx');
      try { const out = await work(port); raw.exec('RELEASE tx'); return out; } catch (e) { raw.exec('ROLLBACK TO tx'); raw.exec('RELEASE tx'); throw e; }
    },
  };
  return port;
}

const log = (...a: unknown[]) => console.log('[AUDIT]', ...a);

describe('Audit E2E konten asli Jawa Mataraman', () => {
  it('menjalankan seluruh alur', async () => {
    const db = createDb();
    const mig = await runMigrations(db);
    log('Migrasi:', mig.ok ? 'OK' : mig.error);

    let t = new Date('2026-10-31T09:00:00.000Z');
    const clock = { now: () => t };
    const storage = new SQLitePackageStorage(async () => db, () => t.toISOString());
    const enc = new TextEncoder();
    const files = ['manifest.json', 'unit.json', 'kata.json', 'kalimat.json', 'dialog.json', 'challenge.json'];
    const entries = files.map((f) => ({ path: f, data: enc.encode(readFileSync(join(SRC, f), 'utf8')) }));
    const manifest = JSON.parse(readFileSync(join(SRC, 'manifest.json'), 'utf8'));
    await storage.stage({ packageId: PKG, languageId: manifest.languageId, dialectId: manifest.dialectId, packageVersion: manifest.packageVersion, schemaVersion: manifest.schemaVersion } as never, entries as never);
    await storage.activate(PKG);
    for (const tb of ['units', 'words', 'sentences', 'dialogues', 'challenges']) log(`Tabel ${tb}:`, (await db.get<{ c: number }>(`SELECT COUNT(*) c FROM ${tb}`))?.c);

    const progress = new SQLiteProgressRepository(db, 'dev', () => t.toISOString());
    const practice = new SQLitePracticeRepository(db, progress, clock, 'dev');
    const vocab = new SQLiteVocabularyRepository(db);
    const dialogue = new SQLiteDialogueRepository(db, progress, clock, 'dev');
    const challenge = new SQLiteChallengeRepository(db, clock);

    // ===== KATA =====
    const feed = await vocab.getFeedPage({ packageId: PKG, limit: 50 } as never);
    if (feed.ok) {
      log('KATA feed tampil:', feed.data.items.length, 'dari total', feed.data.totalMatching);
      log('KATA audio playable:', feed.data.items.filter((w) => w.audio).length, '| registerLabel terisi:', feed.data.items.filter((w) => w.registerLabel && w.registerLabel !== w.register).length);
      log('KATA contoh:', JSON.stringify(feed.data.items[0]));
    } else log('KATA feed gagal', feed.error);
    const filters = await vocab.getFilters(PKG);
    log('KATA filters:', JSON.stringify(filters.ok ? filters.data : filters.error));

    // ===== LATIHAN: unit & availability =====
    const units = await practice.getUnits(PKG);
    log('LATIHAN units:', JSON.stringify(units.ok ? units.data : units.error));
    for (const ex of ['guess_the_word', 'fill_the_gap', 'mixed'] as const) {
      for (const unit of [undefined, 'unit-1']) {
        const a = await practice.getAvailability(PKG, ex, unit);
        log(`LATIHAN availability ${ex} unit=${unit ?? 'semua'}:`, JSON.stringify(a.ok ? a.data : a.error));
      }
    }

    // ===== LATIHAN: jumlah soal riil per sesi =====
    for (const ex of ['guess_the_word', 'fill_the_gap', 'mixed'] as const) {
      const counts: number[] = [];
      for (let i = 0; i < 30; i++) {
        t = new Date(t.getTime() + 1000);
        const s = await practice.createSession({ packageId: PKG, exerciseType: ex, unitId: ex === 'mixed' ? undefined : 'unit-1', questionCount: 10, direction: 'word_to_meaning' });
        counts.push(s.ok ? s.data.questionCount : -1);
        if (s.ok) await practice.abandonSession(s.data.sessionId);
      }
      const hist = counts.reduce<Record<number, number>>((m, c) => ((m[c] = (m[c] ?? 0) + 1), m), {});
      log(`LATIHAN createSession ${ex} (minta 10, 30x): distribusi jumlah soal =`, JSON.stringify(hist));
    }

    // Diagnosa: kenapa soal guess_the_word dibuang
    const reasons: Record<string, number> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyRepo = practice as any;
    const origValidate = validatePracticeQuestion;
    for (let idx = 0; idx < 30; idx++) {
      const q = await anyRepo.buildQuestion(PKG, 'guess_the_word', 'word_to_meaning', 'unit-1', idx, 'seed-diag');
      if (!q) reasons['null (distraktor<3 / validasi gagal)'] = (reasons['null (distraktor<3 / validasi gagal)'] ?? 0) + 1;
      else reasons.ok = (reasons.ok ?? 0) + 1;
    }
    log('LATIHAN diagnosa buildQuestion guess 30 indeks:', JSON.stringify(reasons));
    // Rekonstruksi alasan validasi dengan audio
    const w0 = await db.get<{ payload_json: string }>('SELECT payload_json FROM words WHERE package_id = ? LIMIT 1', [PKG]);
    log('LATIHAN payload audio kata[0]:', JSON.stringify(JSON.parse(String(w0?.payload_json)).audio));
    void origValidate;

    // ===== LATIHAN: alur penuh guess -> profil =====
    t = new Date('2026-10-31T10:00:00.000Z');
    const g = await practice.createSession({ packageId: PKG, exerciseType: 'guess_the_word', unitId: 'unit-1', questionCount: 10, direction: 'word_to_meaning' });
    if (g.ok) {
      let ok = 0; let fail = 0; const errs: string[] = [];
      for (let i = 0; i < g.data.questionCount; i++) {
        const q = await practice.getQuestion(g.data.sessionId, i);
        if (!q.ok || !q.data) { fail++; continue; }
        const r = await practice.submitAnswer({ sessionId: g.data.sessionId, questionId: q.data.questionId, optionId: q.data.correctOptionId });
        if (r.ok) ok++; else { fail++; errs.push(r.error.message); }
      }
      const c = await practice.completeSession(g.data.sessionId);
      log(`LATIHAN guess full flow: soal=${g.data.questionCount} submit ok=${ok} gagal=${fail} errs=${JSON.stringify(errs)} complete=${c.ok ? 'OK' : c.error.message}`);
    }
    const gap = await practice.createSession({ packageId: PKG, exerciseType: 'fill_the_gap', unitId: 'unit-1', questionCount: 10 });
    if (gap.ok) {
      let ok = 0; const errs: string[] = [];
      for (let i = 0; i < gap.data.questionCount; i++) {
        const q = await practice.getQuestion(gap.data.sessionId, i);
        if (!q.ok || !q.data) continue;
        const r = await practice.submitAnswer({ sessionId: gap.data.sessionId, questionId: q.data.questionId, optionId: q.data.options.find((o) => o.optionId !== q.data!.correctOptionId)!.optionId });
        if (r.ok) ok++; else errs.push(r.error.message);
      }
      const c = await practice.completeSession(gap.data.sessionId);
      log(`LATIHAN gap full flow: soal=${gap.data.questionCount} submit ok=${ok} errs=${JSON.stringify(errs)} complete=${c.ok ? 'OK' : c.error.message}`);
    } else log('LATIHAN gap createSession gagal', gap.error.message);
    const mx = await practice.createSession({ packageId: PKG, exerciseType: 'mixed', questionCount: 10 });
    if (mx.ok) {
      let ok = 0; const errs: string[] = [];
      for (let i = 0; i < mx.data.questionCount; i++) {
        const q = await practice.getQuestion(mx.data.sessionId, i);
        if (!q.ok || !q.data) continue;
        const r = await practice.submitAnswer({ sessionId: mx.data.sessionId, questionId: q.data.questionId, optionId: q.data.correctOptionId });
        if (r.ok) ok++; else errs.push(r.error.message);
      }
      const c = await practice.completeSession(mx.data.sessionId);
      log(`LATIHAN mixed full flow: soal=${mx.data.questionCount} submit ok=${ok} errs=${JSON.stringify(errs)} complete=${c.ok ? 'OK' : c.error.message}`);
    } else log('LATIHAN mixed createSession gagal', mx.error.message);

    // ===== DIALOG =====
    const list = await dialogue.listDialogues(PKG);
    log('DIALOG list:', list.ok ? list.data.map((d) => d.id).join(',') : list.error);
    if (list.ok) {
      for (const d of list.data) {
        const graph = await dialogue.getDialogueGraph(PKG, d.id);
        if (!graph.ok) { log(`DIALOG ${d.id} graph gagal:`, graph.error.message); continue; }
        const v = validateDialogueGraph(graph.data);
        log(`DIALOG ${d.id} validasi:`, v.ok ? 'OK' : JSON.stringify(v.issues));
        const started = await startDialogueRun({ dialogueRepository: dialogue, progressRepository: progress, clock, deviceId: 'dev', packageId: PKG, dialogueId: d.id });
        if (!started.ok) { log(`DIALOG ${d.id} start gagal:`, started.error.message); continue; }
        let state = started.data.runState; let steps = 0; let ended = false; let err = '';
        while (steps < 20 && !ended) {
          steps++;
          const node = started.data.dialogue.nodes.find((n) => n.id === state.currentNodeId);
          const hasChoices = (node?.choices ?? []).length > 0;
          const correctIdx = Math.max(0, (node?.choices ?? []).findIndex((c) => c.quality === 'pas' || c.quality === 'cukup-pas'));
          try {
            const r = hasChoices
              ? await submitDialogueChoice({ dialogueRepository: dialogue, progressRepository: progress, clock, deviceId: 'dev', dialogue: started.data.dialogue, runState: state, choiceIndex: correctIdx })
              : await advanceDialogueNode({ dialogueRepository: dialogue, clock, dialogue: started.data.dialogue, runState: state });
            if (!r.ok) { err = JSON.stringify(r.error); break; }
            state = r.data.updatedState; ended = r.data.nextStep.type === 'ending';
          } catch (e) { err = e instanceof Error ? e.message : JSON.stringify(e); break; }
        }
        log(`DIALOG ${d.id} run: langkah=${steps} selesai=${ended} err=${err}`);
      }
    }

    // ===== TANTANGAN =====
    const ch = await challenge.getChallenges(PKG);
    log('TANTANGAN:', ch.ok ? ch.data.map((c) => `${c.id}/${c.level}/${c.title}`).join(' | ') : ch.error);
    if (ch.ok && ch.data[0]) {
      const tg = await challenge.toggleChallengeCheck({ packageId: PKG, challengeId: ch.data[0].id, variant: 'solo' });
      const after = await challenge.getChallenges(PKG);
      log('TANTANGAN toggle:', JSON.stringify(tg.ok ? tg.data : tg.error), '| tersimpan:', after.ok && after.data[0]?.isChecked);
    }

    // ===== STREAK =====
    const allWords = await db.all<{ item_id: string }>('SELECT item_id FROM words WHERE package_id = ? LIMIT 10', [PKG]);
    for (const day of ['2026-10-30T08:00:00.000Z', '2026-10-31T08:00:00.000Z']) {
      t = new Date(day);
      for (const w of allWords) {
        const r = await recordWordViewed(progress, { packageId: PKG, itemId: w.item_id, sessionId: `vocab-${day.slice(0, 10)}`, durationMs: 1500, deviceId: 'dev' }, clock);
        if (!r.ok) log('STREAK recordWordViewed gagal', r.error.message);
      }
    }
    t = new Date('2026-10-31T12:00:00.000Z');

    // ===== PROFIL =====
    const snap = await progress.rebuild({ packageId: PKG }, '2026-10-31');
    if (snap.ok) {
      log('PROFIL streak:', snap.data.currentStreak, '| activeDays:', JSON.stringify(snap.data.activeDays));
      log('PROFIL mastery:', snap.data.mastery.toFixed(2), '| level:', snap.data.level);
      log('PROFIL sessions started/completed:', snap.data.sessionsStarted, '/', snap.data.sessionsCompleted);
      log('PROFIL completionStats:', JSON.stringify(snap.data.completionStats));
      log('PROFIL dialogueScores:', JSON.stringify(snap.data.dialogueScores));
      log('PROFIL jumlah wordStrength/sentenceStrength:', Object.keys(snap.data.wordStrength).length, '/', Object.keys(snap.data.sentenceStrength).length);
    } else log('PROFIL rebuild gagal', snap.error.message);
    const ev = await db.all<{ event_type: string; c: number }>('SELECT event_type, COUNT(*) c FROM learning_events GROUP BY event_type');
    log('EVENTS:', JSON.stringify(ev));
    const zombies = await db.all<{ status: string; exercise_type: string; c: number }>('SELECT status, exercise_type, COUNT(*) c FROM practice_sessions GROUP BY status, exercise_type');
    log('PRACTICE_SESSIONS:', JSON.stringify(zombies));
  }, 60000);
});
