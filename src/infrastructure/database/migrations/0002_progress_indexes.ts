import type { Migration } from './Migration';

export const migration0002: Migration = {
  version: 2,
  name: 'progress_indexes',
  up: (database) => database.exec(`CREATE INDEX IF NOT EXISTS idx_words_unit ON words(package_id, unit_id, item_order); CREATE INDEX IF NOT EXISTS idx_sentences_unit ON sentences(package_id, unit_id, item_order); CREATE INDEX IF NOT EXISTS idx_dialogues_unit ON dialogues(package_id, unit_id, item_order); CREATE INDEX IF NOT EXISTS idx_rebuild_scope ON rebuild_markers(scope_type, scope_id);`),
};
