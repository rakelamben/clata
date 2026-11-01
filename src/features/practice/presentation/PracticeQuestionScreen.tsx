import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import RemixIcon from 'react-native-remix-icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppRuntime } from '../../../bootstrap/AppBootstrap';
import { getPracticeQuestion } from '../application/getPracticeQuestion';
import { submitPracticeAnswer } from '../application/submitPracticeAnswer';
import { completePracticeSession } from '../application/completePracticeSession';
import type { PracticeQuestion } from '../domain/practiceTypes';
import { AnswerOption } from './AnswerOption';
import { PracticeEmpty, PracticeError, PracticeLoading } from './PracticeStates';
import { PracticeFeedbackSheet } from './PracticeFeedbackSheet';
import { PracticeConfirmModal } from './PracticeConfirmModal';
import { PracticeSummaryIllustration } from './PracticeIllustrations';
import { colors, fonts, radii, spacing, touchTarget } from '../../../ui/theme';

export function PracticeQuestionScreen() {
  const insets = useSafeAreaInsets();
  const { container, profile } = useAppRuntime();
  const packageId = profile?.selectedPackageId ?? 'jawa-mataraman';
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();

  const [question, setQuestion] = useState<PracticeQuestion | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; answer: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [completionFailed, setCompletionFailed] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [confirmModal, setConfirmModal] = useState<'exit' | null>(null);
  const [playingAudio, setPlayingAudio] = useState(false);

  const loadIndex = async (nextIndex: number) => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    setSelected(null);
    setFeedback(null);
    setShowTranslation(false);

    const result = await getPracticeQuestion(container.practice, sessionId, nextIndex);
    if (!result.ok) {
      setError(result.error.message);
    } else {
      setQuestion(result.data);
    }
    setIndex(nextIndex);
    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;
    if (!sessionId) return () => { mounted = false; };

    void container.practice.getSession(sessionId).then(async (result) => {
      if (!mounted) return;
      if (!result.ok) {
        setError(result.error.message);
        setLoading(false);
        return;
      }
      if (!result.data) {
        setError('Sesi latihan tidak ditemukan.');
        setLoading(false);
        return;
      }

      setTotal(result.data.questionCount);
      setCorrectCount(result.data.correctCount);

      if (result.data.currentIndex >= result.data.questionCount) {
        const completion = await completePracticeSession(container.practice, sessionId);
        if (completion.ok) setCompleted(true);
        else setCompletionFailed(true);
        setLoading(false);
        return;
      }

      void loadIndex(result.data.currentIndex);
    });

    return () => {
      mounted = false;
      void container.audio.stop();
    };
  // Session route is immutable while mounted.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const handleAudioToggle = async (audioPath?: string | null) => {
    if (!audioPath) return;

    if (playingAudio) {
      await container.audio.stop();
      setPlayingAudio(false);
      return;
    }

    const sourceRes = container.audioSources.resolve(packageId, '1.0.0', audioPath);
    if (!sourceRes) return;

    setPlayingAudio(true);
    try {
      await container.audio.play({
        itemId: audioPath,
        uri: sourceRes,
        format: 'opus',
      });
    } catch {
      setPlayingAudio(false);
    }
  };

  const submit = async () => {
    if (!sessionId || !question || !selected || feedback) return;

    setSaving(true);
    const result = await submitPracticeAnswer(container.practice, {
      sessionId,
      questionId: question.questionId,
      optionId: selected,
    });
    setSaving(false);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    setFeedback({ correct: result.data.correct, answer: result.data.answerLabel });
    if (result.data.correct) {
      setCorrectCount((current) => current + 1);
    }
  };

  const handleNextQuestion = async () => {
    if (index + 1 >= total) {
      if (sessionId) {
        const completion = await completePracticeSession(container.practice, sessionId);
        if (completion.ok) {
          setCompleted(true);
        } else {
          setCompletionFailed(true);
        }
      }
    } else {
      void loadIndex(index + 1);
    }
  };

  const retryCompletion = async () => {
    if (!sessionId) return;
    const result = await completePracticeSession(container.practice, sessionId);
    if (result.ok) {
      setCompletionFailed(false);
      setCompleted(true);
    }
  };

  if (loading) return <PracticeLoading message="Memuat soal latihan…" />;
  if (error) return <PracticeError message={error} onRetry={() => void loadIndex(index)} />;

  // Summary View
  if (completed) {
    const isGuess = question?.type === 'guess_the_word';
    const summaryTitle = isGuess ? 'Tebak kata selesai' : 'Kalimat rumpang selesai';
    const incorrectCount = Math.max(0, total - correctCount);

    return (
      <View style={[styles.screen, { paddingTop: Math.max(insets.top, spacing.xs) }]}>
        <ScrollView
          contentContainerStyle={[styles.summaryContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summaryMain}>
            <View style={styles.summaryIllustrationWrap}>
              <PracticeSummaryIllustration width={260} height={180} />
            </View>

            <View style={styles.completedPill}>
              <Text style={styles.completedPillText}>Latihan selesai</Text>
            </View>

            <Text accessibilityRole="header" style={styles.summaryTitle}>
              {summaryTitle}
            </Text>
            <Text style={styles.summarySubtitle}>
              Kamu telah menyelesaikan seluruh soal latihan.
            </Text>

            {/* Result Cards */}
            <View style={styles.resultsRow} aria-label="Hasil latihan">
              <View style={[styles.resultCard, styles.resultCardCorrect]}>
                <RemixIcon name="checkbox-circle-fill" size={28} color={colors.teal} />
                <Text style={[styles.resultNumber, styles.resultNumberCorrect]}>
                  {correctCount}
                </Text>
                <Text style={styles.resultLabel}>Soal terjawab benar</Text>
              </View>

              <View style={[styles.resultCard, styles.resultCardIncorrect]}>
                <RemixIcon name="close-circle-fill" size={28} color={colors.magenta} />
                <Text style={[styles.resultNumber, styles.resultNumberIncorrect]}>
                  {incorrectCount}
                </Text>
                <Text style={styles.resultLabel}>Soal terjawab salah</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Fixed Bottom Footer */}
        <View style={[styles.summaryFooter, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Kembali ke Latihan"
            onPress={() => router.back()}
            style={styles.summaryButton}
          >
            <Text style={styles.summaryButtonText}>Kembali ke Latihan</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (completionFailed && !question) {
    return (
      <View style={[styles.screen, styles.centerScreen]}>
        <Text style={styles.summaryTitle}>Jawaban sudah lengkap</Text>
        <Text style={styles.errorText}>Sesi belum selesai tersimpan.</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => void retryCompletion()}
          style={styles.summaryButton}
        >
          <Text style={styles.summaryButtonText}>Coba simpan lagi</Text>
        </Pressable>
      </View>
    );
  }

  if (!question) {
    return <PracticeEmpty title="Belum ada materi untuk sesi ini." />;
  }

  const isGuess = question.type === 'guess_the_word';
  const screenTitle = isGuess ? 'Tebak kata' : 'Kalimat rumpang';
  const audioReference = isGuess
    ? question.prompt.audio?.path
    : question.audio?.path;
  const exampleSentence = isGuess ? question.exampleSentence?.text : undefined;

  return (
    <View style={styles.screen}>
      {/* Topbar */}
      <View style={[styles.topbar, { paddingTop: insets.top, minHeight: 52 + insets.top }]}>
        <Text accessibilityRole="header" style={styles.topbarTitle}>
          {screenTitle}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Keluar dari sesi"
          onPress={() => setConfirmModal('exit')}
          style={styles.closeButton}
        >
          <RemixIcon name="close-line" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      {/* Segmented Progress Bar */}
      <View style={styles.progressContainer}>
        {Array.from({ length: Math.max(total, 1) }).map((_, i) => (
          <View
            key={`step-${i}`}
            style={[
              styles.progressSegment,
              i <= index ? styles.progressSegmentFilled : styles.progressSegmentEmpty,
            ]}
          />
        ))}
      </View>

      {/* Main Question Body */}
      <ScrollView
        contentContainerStyle={[styles.questionContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {isGuess ? (
          /* Guess the Word Stage */
          <View style={styles.promptStage}>
            <Text style={styles.promptWord}>
              {question.prompt.lemma ?? question.prompt.meaning ?? 'Dengarkan kata'}
            </Text>

            {audioReference ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Putar audio"
                onPress={() => void handleAudioToggle(audioReference)}
                style={styles.promptAudioButton}
              >
                <RemixIcon
                  name={playingAudio ? 'stop-circle-fill' : 'volume-up-fill'}
                  size={24}
                  color={colors.primary}
                />
              </Pressable>
            ) : null}
          </View>
        ) : (
          /* Fill the Gap Stage */
          <View style={styles.gapStage}>
            <View style={styles.gapSentenceWrap}>
              <Text style={styles.gapSentence}>
                {question.beforeGap}
                <Text style={styles.gapBlank}> [ ... ] </Text>
                {question.afterGap}
              </Text>
            </View>

            {question.translation ? (
              <View style={styles.translationWrap}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={showTranslation ? 'Sembunyikan terjemahan' : 'Lihat terjemahan'}
                  onPress={() => setShowTranslation((prev) => !prev)}
                  style={styles.translationToggle}
                >
                  <RemixIcon name="translate-2" size={16} color={colors.teal} />
                  <Text style={styles.translationToggleText}>
                    {showTranslation ? 'Sembunyikan arti' : 'Lihat arti'}
                  </Text>
                </Pressable>
                {showTranslation ? (
                  <Text style={styles.translationText}>{question.translation}</Text>
                ) : null}
              </View>
            ) : null}

            {audioReference ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Putar audio kalimat"
                onPress={() => void handleAudioToggle(audioReference)}
                style={styles.gapAudioButton}
              >
                <RemixIcon
                  name={playingAudio ? 'stop-circle-fill' : 'volume-up-fill'}
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.gapAudioText}>Dengarkan kalimat</Text>
              </Pressable>
            ) : null}
          </View>
        )}

        {/* Answer Options */}
        <View style={styles.optionsStack} role="radiogroup" aria-label="Pilihan jawaban">
          {question.options.map((option, i) => (
            <AnswerOption
              key={option.optionId}
              letter={String.fromCharCode(65 + i)}
              label={option.label}
              selected={selected === option.optionId}
              disabled={saving || feedback !== null}
              onPress={() => setSelected(option.optionId)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Bottom Sticky Action */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Periksa jawaban"
          disabled={!selected || saving || feedback !== null}
          onPress={() => void submit()}
          style={[
            styles.submitButton,
            (!selected || saving || feedback !== null) && styles.submitButtonDisabled,
          ]}
        >
          <Text style={styles.submitButtonText}>
            {saving ? 'Menyimpan…' : 'Periksa jawaban'}
          </Text>
        </Pressable>
      </View>

      {/* Feedback Sheet */}
      <PracticeFeedbackSheet
        visible={feedback !== null}
        correct={feedback?.correct ?? false}
        correctAnswer={feedback?.correct ? undefined : feedback?.answer}
        example={exampleSentence}
        isLastQuestion={index + 1 >= total}
        onNext={handleNextQuestion}
      />

      {/* Exit Confirmation Modal */}
      <PracticeConfirmModal
        visible={confirmModal === 'exit'}
        type="exit"
        onConfirm={() => {
          setConfirmModal(null);
          router.back();
        }}
        onCancel={() => setConfirmModal(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerScreen: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  topbar: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  topbarTitle: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 18,
    color: colors.textPrimary,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 4,
    backgroundColor: colors.surface,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  progressSegmentFilled: {
    backgroundColor: colors.teal,
  },
  progressSegmentEmpty: {
    backgroundColor: '#E4E7EB',
  },
  questionContent: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  promptStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  promptWord: {
    fontFamily: fonts.display,
    fontSize: 32,
    color: colors.navy,
    textAlign: 'center',
  },
  promptAudioButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.navyTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gapStage: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  gapSentenceWrap: {
    paddingVertical: spacing.sm,
  },
  gapSentence: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 20,
    lineHeight: 28,
    color: colors.textPrimary,
  },
  gapBlank: {
    color: colors.teal,
    fontWeight: '700',
    backgroundColor: colors.tealTint,
  },
  translationWrap: {
    gap: spacing.xs,
  },
  translationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  translationToggleText: {
    fontFamily: fonts.uiMedium,
    fontSize: 13,
    color: colors.teal,
  },
  translationText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  gapAudioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  gapAudioText: {
    fontFamily: fonts.uiMedium,
    fontSize: 13,
    color: colors.primary,
  },
  optionsStack: {
    gap: spacing.md,
    marginTop: 'auto',
    paddingTop: spacing.lg,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitButton: {
    minHeight: touchTarget,
    backgroundColor: colors.primary,
    borderRadius: radii.control,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.45,
  },
  submitButtonText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 16,
    color: colors.surface,
  },
  summaryContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryMain: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  summaryFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  summaryIllustrationWrap: {
    marginVertical: spacing.xs,
  },
  completedPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.tealTint,
    borderRadius: 20,
  },
  completedPillText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 13,
    color: colors.teal,
  },
  summaryTitle: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 24,
    color: colors.navy,
    textAlign: 'center',
  },
  summarySubtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  resultsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  resultCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.card,
    borderWidth: 1.5,
    gap: spacing.xs,
  },
  resultCardCorrect: {
    backgroundColor: '#F3FAF8',
    borderColor: colors.teal,
  },
  resultCardIncorrect: {
    backgroundColor: '#FDF4F6',
    borderColor: colors.magenta,
  },
  resultNumber: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 32,
  },
  resultNumberCorrect: {
    color: colors.teal,
  },
  resultNumberIncorrect: {
    color: colors.magenta,
  },
  resultLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  summaryButton: {
    width: '100%',
    minHeight: touchTarget,
    backgroundColor: colors.primary,
    borderRadius: radii.control,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  summaryButtonText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 16,
    color: colors.surface,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.magenta,
  },
});
