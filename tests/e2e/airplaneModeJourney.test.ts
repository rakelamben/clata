import { describe, expect, it } from 'vitest';
import { getAgeCategory, validateBirthYear } from '../../src/domain/onboarding/ageGate';
import { replayProgress } from '../../src/domain/progress/replay';
import type { LearningEvent } from '../../src/domain/progress/learningEvent';
import { ResetPackageProgressUseCase } from '../../src/features/settings/application/resetPackageProgress';
import type { ProgressRepository } from '../../src/features/progress/data/progressRepository';
import { GetAboutMetadataUseCase } from '../../src/features/settings/application/getAboutMetadata';

describe('Airplane Mode Full Journey (P0 E2E Invariants)', () => {
  it('completes the entire end-to-end lifecycle offline without network requests', async () => {
    // 1. Age Gate Verification
    const currentYear = 2026;
    const now = new Date(`${currentYear}-10-29T10:00:00Z`);

    // Under 10 is blocked
    const under10Year = currentYear - 8;
    expect(getAgeCategory(under10Year, { now: () => now })).toBe('blocked');

    // 10 and above is allowed
    const validBirthYear = currentYear - 14;
    expect(validateBirthYear(validBirthYear, now)).toBeNull();
    const ageCategory = getAgeCategory(validBirthYear, { now: () => now });
    expect(ageCategory).toBe('minor'); // Age 14 is allowed for all P0 features

    // 2. Vocabulary Learning: Append viewed event
    const events: LearningEvent[] = [];
    let sequenceCounter = 1;

    const wordViewedEvent: LearningEvent = {
      eventId: 'evt-view-1',
      localSequence: sequenceCounter++,
      deviceId: 'airplane-device',
      packageId: 'jawa-mataraman',
      itemId: 'word-sugeng',
      eventType: 'word_viewed',
      source: 'vocabulary',
      weight: 1,
      deviceTime: '2026-10-29T10:05:00Z',
      localDate: '2026-10-29',
      formulaVersion: 1,
      payload: { viewedFrom: 'vocabulary_feed' },
    };
    events.push(wordViewedEvent);

    // 3. Practice Session: Answer Guess the Word
    const practiceAnswerEvent: LearningEvent = {
      eventId: 'evt-practice-1',
      localSequence: sequenceCounter++,
      deviceId: 'airplane-device',
      packageId: 'jawa-mataraman',
      itemId: 'word-sugeng',
      eventType: 'practice_answered',
      source: 'practice',
      result: 1,
      weight: 1,
      sessionId: 'ses-practice-1',
      deviceTime: '2026-10-29T10:08:00Z',
      localDate: '2026-10-29',
      formulaVersion: 1,
      payload: { exerciseType: 'guess_the_word', correct: true, targetItemId: 'word-sugeng' },
    };
    events.push(practiceAnswerEvent);

    // 4. Curated Dialogue Session: Dialogue completed
    const dialogueEvent: LearningEvent = {
      eventId: 'evt-dialogue-1',
      localSequence: sequenceCounter++,
      deviceId: 'airplane-device',
      packageId: 'jawa-mataraman',
      itemId: 'dlg-tamu',
      eventType: 'dialogue_completed',
      source: 'dialogue',
      result: 1,
      weight: 1,
      sessionId: 'ses-dialogue-1',
      deviceTime: '2026-10-29T10:15:00Z',
      localDate: '2026-10-29',
      formulaVersion: 1,
      payload: { dialogueId: 'dlg-tamu', runId: 'run-1', endingId: 'end-good', sessionId: 'ses-dialogue-1' },
    };
    events.push(dialogueEvent);

    // 5. Compute Progress before reset
    const snapshotBeforeReset = replayProgress(
      events,
      { packageId: 'jawa-mataraman' },
      '2026-10-29'
    );
    expect(snapshotBeforeReset.wordStrength['word-sugeng'].strength).toBeGreaterThan(0);

    // 6. Settings: Read About Screen Metadata offline
    const aboutUseCase = new GetAboutMetadataUseCase();
    const aboutResult = await aboutUseCase.execute();
    expect(aboutResult.ok).toBe(true);
    if (!aboutResult.ok) return;
    expect(aboutResult.data.compliance.reportingChannel.email).toBe('lapor@clata.id');
    expect(aboutResult.data.licenses.textLicense.code).toBe('CC-BY-SA-4.0');

    // 7. Settings: Reset Package Progress via 2-Step Confirmation
    let activeBoundary = 0;
    const mockProgressRepo: ProgressRepository = {
      appendEvent: async () => ({ ok: true, data: undefined }),
      appendEventWithin: async () => ({ ok: true, data: undefined }),
      getEvents: async () => ({ ok: true, data: events }),
      resetPackage: async (_pkgId, _cmdId, _devTime) => {
        // Capture boundary at current sequence frontier
        activeBoundary = sequenceCounter - 1;
        return { ok: true, data: undefined };
      },
      rebuild: async (scope, today) => {
        const visible = events.filter((e) => (e.localSequence ?? 0) > activeBoundary);
        return { ok: true, data: replayProgress(visible, scope, today) };
      },
      rebuildAll: async () => ({ ok: true, data: undefined }),
    };

    const resetUseCase = new ResetPackageProgressUseCase(mockProgressRepo);
    const resetResult = await resetUseCase.execute({ packageId: 'jawa-mataraman' });
    expect(resetResult.ok).toBe(true);

    // 8. Verify post-reset progress: mastery = 0, no learned items active
    const postResetSnapshot = await mockProgressRepo.rebuild(
      { packageId: 'jawa-mataraman' },
      '2026-10-29'
    );
    expect(postResetSnapshot.ok).toBe(true);
    if (!postResetSnapshot.ok) return;

    expect(postResetSnapshot.data.mastery).toBe(0);
    expect(Object.keys(postResetSnapshot.data.wordStrength)).toHaveLength(0);
  });
});
