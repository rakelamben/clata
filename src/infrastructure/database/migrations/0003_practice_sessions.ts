import type { Migration } from './Migration';

const sql = `
CREATE TABLE IF NOT EXISTS practice_sessions (
  session_id TEXT PRIMARY KEY NOT NULL,
  package_id TEXT NOT NULL,
  exercise_type TEXT NOT NULL CHECK (exercise_type IN ('guess_the_word','fill_the_gap')),
  unit_id TEXT,
  direction TEXT,
  question_count INTEGER NOT NULL CHECK (question_count BETWEEN 1 AND 20),
  current_index INTEGER NOT NULL DEFAULT 0 CHECK (current_index >= 0),
  answered_count INTEGER NOT NULL DEFAULT 0 CHECK (answered_count >= 0),
  correct_count INTEGER NOT NULL DEFAULT 0 CHECK (correct_count >= 0),
  status TEXT NOT NULL CHECK (status IN ('created','active','completed','interrupted','abandoned')),
  started_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY (package_id) REFERENCES installed_packages(package_id)
);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_active ON practice_sessions(package_id, status);
CREATE TABLE IF NOT EXISTS practice_questions (
  session_id TEXT NOT NULL,
  question_index INTEGER NOT NULL CHECK (question_index >= 0),
  question_id TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('guess_the_word','fill_the_gap')),
  target_item_id TEXT,
  sentence_id TEXT,
  question_json TEXT NOT NULL,
  answered INTEGER NOT NULL DEFAULT 0 CHECK (answered IN (0,1)),
  selected_option_id TEXT,
  correct INTEGER,
  PRIMARY KEY (session_id, question_index),
  UNIQUE (session_id, question_id),
  FOREIGN KEY (session_id) REFERENCES practice_sessions(session_id) ON DELETE CASCADE
);
`;

export const migration0003: Migration = { version: 3, name: 'practice_sessions', up: (database) => database.exec(sql) };
