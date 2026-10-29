export type ChallengeVariantType = 'solo' | 'social';

export type ChallengeLevel = 'L1' | 'L2' | 'L3';

export type RescuePhrase = {
  readonly id: string;
  readonly text: string;
  readonly translation: string;
  readonly audio?: string;
  readonly registerLabel?: string;
};

export type Challenge = {
  readonly id: string;
  readonly packageId: string;
  readonly unitId: string;
  readonly level: ChallengeLevel;
  readonly title: string;
  readonly estimatedDurationMinutes?: number;
  readonly objective?: string;
  readonly solo: string;
  readonly social: string;
  readonly safetyGuidance?: string;
  readonly rescuePhrases?: readonly RescuePhrase[];
  readonly status?: string;
};

export type ChallengeCheckRecord = {
  readonly packageId: string;
  readonly challengeId: string;
  readonly checkedAt: string;
  readonly variant: ChallengeVariantType;
};

export type ChallengeCardItem = Challenge & {
  readonly isChecked: boolean;
  readonly checkedVariant?: ChallengeVariantType;
  readonly checkedAt?: string;
};
