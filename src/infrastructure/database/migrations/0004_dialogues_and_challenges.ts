import type { Migration } from './Migration';

const sql = `
CREATE TABLE IF NOT EXISTS active_dialogue_runs (
  session_id TEXT PRIMARY KEY NOT NULL,
  run_id TEXT NOT NULL UNIQUE,
  package_id TEXT NOT NULL,
  package_version TEXT NOT NULL,
  graph_fingerprint TEXT NOT NULL,
  dialogue_id TEXT NOT NULL,
  current_node_id TEXT NOT NULL,
  sequence INTEGER NOT NULL DEFAULT 0,
  disconnected_attempts INTEGER NOT NULL DEFAULT 0,
  run_state_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_active_dialogue_runs_pkg ON active_dialogue_runs(package_id);

CREATE TABLE IF NOT EXISTS challenge_checks (
  package_id TEXT NOT NULL,
  challenge_id TEXT NOT NULL,
  checked_at TEXT NOT NULL,
  variant TEXT NOT NULL CHECK(variant IN ('solo', 'social')),
  PRIMARY KEY (package_id, challenge_id)
);
CREATE INDEX IF NOT EXISTS idx_challenge_checks_pkg ON challenge_checks(package_id);
`;

export const migration0004: Migration = {
  version: 4,
  name: 'dialogues_and_challenges',
  up: (database) => database.exec(sql),
};
