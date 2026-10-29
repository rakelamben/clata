import type { Challenge } from './challengeTypes';

export function assertNoLearningEventEmitted(
  eventCountBefore: number,
  eventCountAfter: number,
): boolean {
  if (eventCountAfter !== eventCountBefore) {
    throw new Error(
      `Invariant violation: Challenge interaction emitted a learning event! Before: ${eventCountBefore}, After: ${eventCountAfter}`,
    );
  }
  return true;
}

export function getSafetyGuidanceForChallenge(challenge: Challenge): string {
  if (challenge.safetyGuidance && challenge.safetyGuidance.trim().length > 0) {
    return challenge.safetyGuidance;
  }
  return 'Lakukan latihan dengan nyaman di tempat yang aman. Kamu bebas berhenti kapan saja.';
}

export function getDefaultRescuePhrases(challenge: Challenge): NonNullable<Challenge['rescuePhrases']> {
  if (challenge.rescuePhrases && challenge.rescuePhrases.length > 0) {
    return challenge.rescuePhrases;
  }
  return [
    {
      id: 'rescue-sugeng',
      text: 'Sugeng enjing / Sugeng siang.',
      translation: 'Selamat pagi / Selamat siang.',
      registerLabel: 'Netral / Sopan',
    },
    {
      id: 'rescue-matur-nuwun',
      text: 'Matur nuwun sanget.',
      translation: 'Terima kasih banyak.',
      registerLabel: 'Krama / Sopan',
    },
  ];
}
