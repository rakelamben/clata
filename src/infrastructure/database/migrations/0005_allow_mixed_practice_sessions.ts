import type { Migration } from './Migration';

const sql = `
CREATE TABLE IF NOT EXISTS practice_sessions_v5 (
  session_id TEXT PRIMARY KEY NOT NULL,
  package_id TEXT NOT NULL,
  exercise_type TEXT NOT NULL CHECK (exercise_type IN ('guess_the_word','fill_the_gap','mixed')),
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

INSERT OR IGNORE INTO practice_sessions_v5 (
  session_id, package_id, exercise_type, unit_id, direction,
  question_count, current_index, answered_count, correct_count,
  status, started_at, completed_at
)
SELECT
  session_id, package_id, exercise_type, unit_id, direction,
  question_count, current_index, answered_count, correct_count,
  status, started_at, completed_at
FROM practice_sessions;

DROP TABLE practice_sessions;
ALTER TABLE practice_sessions_v5 RENAME TO practice_sessions;
CREATE INDEX IF NOT EXISTS idx_practice_sessions_active ON practice_sessions(package_id, status);
`;

export const migration0005: Migration = {
  version: 5,
  name: 'allow_mixed_practice_sessions',
  up: (database) => database.exec(sql),
};
