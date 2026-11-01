import type { Register } from '../Register';

export interface PackageFileEntry {
  path: string;
  sizeBytes: number;
  sha256: string;
}

export interface PackagePublicKey {
  keyId: string;
  state: 'active' | 'revoked';
  publicKey: Uint8Array;
}

export interface PackageManifest {
  packageId: string;
  languageId: string;
  dialectId: string;
  packageVersion: string;
  schemaVersion: number;
  minimumAppVersion: string;
  registerMapping: Record<Register, string>;
  orthographyReference: string;
  createdAt: string;
  itemCounts: {
    units: number;
    words: number;
    sentences: number;
    dialogues: number;
    challenges: number;
  };
  files: PackageFileEntry[];
  keyId?: string;
  signatureReference?: string;
}

export interface UnitItem {
  unit_id: string;
  order: number;
  title: string;
}

export interface WordItem {
  id: string;
  text: string;
  meaning: string;
  part_of_speech: string;
  register: Register;
  catatan?: string;
  theme: string;
  unit_id: string;
  audio: string;
  status: string;
}

export interface SentenceItem {
  id: string;
  text: string;
  translation: string;
  word_ids: string[];
  focus_word_id: string;
  register: Register;
  unit_id: string;
  audio: string;
  status: string;
}

export interface DialogueRepairItem {
  text: string;
  translation: string;
  audio: string;
  next?: string;
  [key: string]: unknown;
}

export interface DialogueChoiceItem {
  text: string;
  translation: string;
  quality: 'pas' | 'kurang-pas' | 'tidak-nyambung' | string;
  type: string;
  next: string;
  audio: string;
  repair?: DialogueRepairItem;
  [key: string]: unknown;
}

export interface DialogueEndingItem {
  id: string;
  quality: 'pas' | 'kurang-pas' | string;
  feedback: string;
}

export interface DialogueNodeItem {
  id: string;
  speaker: string;
  text: string;
  translation: string;
  audio: string;
  choices: DialogueChoiceItem[];
  next?: string;
  [key: string]: unknown;
}

export interface DialogueItem {
  id: string;
  title: string;
  interlocutor: string;
  register: Register;
  unit_id?: string;
  audio?: string;
  status?: string;
  nodes: DialogueNodeItem[] | unknown[];
  endings: DialogueEndingItem[];
  maxNewWords?: number;
  estimatedDurationMinutes?: number;
  [key: string]: unknown;
}

export interface ChallengeRescuePhrase {
  id: string;
  text: string;
  translation: string;
  registerLabel?: string;
  audio: string;
}

export interface ChallengeItem {
  id: string;
  unit_id: string;
  title: string;
  estimatedDurationMinutes?: number;
  objective?: string;
  solo?: string;
  social?: string;
  completionCriteria?: string;
  safetyGuidance?: string;
  rescuePhrases?: ChallengeRescuePhrase[];
  status?: string;
  [key: string]: unknown;
}

export interface LoadedPackage {
  manifest: PackageManifest;
  units: UnitItem[];
  words: WordItem[];
  sentences: SentenceItem[];
  dialogues: DialogueItem[];
  challenges: ChallengeItem[];
}

export type PackageRejectReason =
  | 'ARCHIVE_CORRUPTED'
  | 'ARCHIVE_TOO_LARGE'
  | 'TOO_MANY_ENTRIES'
  | 'FILE_TOO_LARGE'
  | 'TOTAL_UNCOMPRESSED_TOO_LARGE'
  | 'DUPLICATE_PATH'
  | 'INVALID_PATH'
  | 'INVALID_MANIFEST'
  | 'UNSUPPORTED_SCHEMA'
  | 'APP_VERSION_TOO_LOW'
  | 'UNSUPPORTED_LANGUAGE'
  | 'UNSUPPORTED_DIALECT'
  | 'INVALID_VERSION'
  | 'UNKNOWN_KEY'
  | 'REVOKED_KEY'
  | 'INVALID_SIGNATURE'
  | 'NON_CANONICAL_SIGNATURE'
  | 'CHECKSUM_MISMATCH'
  | 'INVALID_CONTENT'
  | 'INVALID_REFERENCE'
  | 'INVALID_DIALOG_GRAPH'
  | 'FORBIDDEN_DATA_CONTAMINATION';

export interface PackageInstallResult {
  ok: boolean;
  reason?: PackageRejectReason;
  message?: string;
  packageId?: string;
  packageVersion?: string;
  archiveBytes?: number;
  extractedFilesCount?: number;
  installedPath?: string;
  bundleArchivePath?: string;
}
