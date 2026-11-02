import type { ChallengeItem } from '../../../domain/package/packageTypes';

export type ChallengeLevel = 'L1' | 'L2' | 'L3';
export type ChallengeVariantType = 'solo' | 'social';

export interface ChallengeCardItem extends ChallengeItem {
  level: ChallengeLevel;
  isChecked: boolean;
  checkedVariant?: ChallengeVariantType;
  completedAt?: string | null;
}

/**
 * Menghitung tingkat kesulitan tantangan secara dinamis dari estimasi durasi menit.
 * (Menjaga integritas arsitektur tanpa field 'level' statis di skema paket).
 */
export function computeChallengeLevel(
  estimatedDurationMinutes?: number,
): ChallengeLevel {
  if (!estimatedDurationMinutes || estimatedDurationMinutes <= 3) {
    return 'L1';
  }
  if (estimatedDurationMinutes <= 7) {
    return 'L2';
  }
  return 'L3';
}

/**
 * Mendapatkan label human-friendly untuk tingkat tantangan
 */
export function getChallengeLevelLabel(level: ChallengeLevel): string {
  switch (level) {
    case 'L1':
      return 'Ringan';
    case 'L2':
      return 'Sedang';
    case 'L3':
      return 'Besar';
  }
}

export const CHALLENGE_LEVEL_OPTIONS: {
  label: string;
  value: ChallengeLevel | undefined;
}[] = [
  { label: 'Semua Tingkat', value: undefined },
  { label: 'Ringan', value: 'L1' },
  { label: 'Sedang', value: 'L2' },
  { label: 'Besar', value: 'L3' },
];
