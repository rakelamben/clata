import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Icon from 'react-native-remix-icon';

import { useApp } from '../../context/AppContext';
import { generateInterleavedUnitSessions } from '../../features/practice/domain/interleavedUnitGenerator';
import {
  generateWordGuessQuestions,
  WordGuessSessionEngine,
  type WordGuessOption,
  type WordGuessQuestion,
  type WordGuessSessionStats,
} from '../../features/practice/domain/wordGuessEngine';
import { selectFreeWordGuessItems } from '../../features/practice/domain/practiceFreeSelection';
import { WordGuessFeedbackSheet } from '../../features/practice/presentation/WordGuessFeedbackSheet';
import { WordGuessSummary } from '../../features/practice/presentation/WordGuessSummary';
import { playAudioSafe } from '../../features/vocabulary/audio/audioPlayback';
import { UnitProgressRepository } from '../../infrastructure/database/unitProgressRepository';
import { WordViewRepository } from '../../infrastructure/database/wordViewRepository';
import { AppPressable } from '../../ui/AppPressable';
import { colors, fonts, radii, spacing, touchTarget } from '../../ui/theme';

const unitProgressRepo = new UnitProgressRepository();
const wordViewRepo = new WordViewRepository();

export default function WordGuessScreen() {
  const { unitId, sessionId, mode } = useLocalSearchParams<{
    unitId?: string;
    sessionId?: string;
    mode?: string;
  }>();
  const { isInitialized, activePackageId, activePackageData } = useApp();

  // Cari unit dan kata-kata yang relevan untuk sesi ini
  const { sessionWords, allSentences, allWords } = useMemo(() => {
    if (!activePackageData) {
      return { sessionWords: [], allSentences: [], allWords: [] };
    }

    const { words, sentences, dialogues, units } = activePackageData;

    if (mode === 'free' || !unitId) {
      return {
        sessionWords: selectFreeWordGuessItems(words, 10),
        allSentences: sentences,
        allWords: words,
      };
    }

    const currentUnit = units.find((u) => u.unit_id === unitId);

    if (!currentUnit) {
      return {
        sessionWords: selectFreeWordGuessItems(words, 10),
        allSentences: sentences,
        allWords: words,
      };
    }

    const unitWords = words.filter((w) => w.unit_id === currentUnit.unit_id);
    const unitSentences = sentences.filter((s) => s.unit_id === currentUnit.unit_id);
    const unitDialogues = dialogues.filter((d) => d.unit_id === currentUnit.unit_id);

    const unitSessions = generateInterleavedUnitSessions(
      currentUnit.unit_id,
      unitWords,
      unitSentences,
      unitDialogues,
    );

    const activeSession = unitSessions.find((s) => s.sessionId === sessionId);
    const sWords = activeSession
      ? words.filter((w) => activeSession.itemIds.includes(w.id))
      : unitWords.slice(0, 10);

    return {
      sessionWords: sWords,
      allSentences: sentences,
      allWords: words,
    };
  }, [activePackageData, unitId, sessionId, mode]);

  // Inisialisasi engine soal sesi tebak kata
  const engine = useMemo(() => {
    if (sessionWords.length === 0) return null;
    const questions = generateWordGuessQuestions(
      sessionWords,
      allSentences,
      allWords,
    );
    return new WordGuessSessionEngine(questions);
  }, [sessionWords, allSentences, allWords]);

  const [currentQuestion, setCurrentQuestion] = useState<WordGuessQuestion | null>(() =>
    engine ? engine.getCurrentQuestion() : null,
  );
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [feedbackResult, setFeedbackResult] = useState<{
    isCorrect: boolean;
    explanation: string;
  } | null>(null);
  const [isSummaryVisible, setIsSummaryVisible] = useState(false);
  const [finalStats, setFinalStats] = useState<WordGuessSessionStats | null>(null);

  // Status progres soal
  const totalQuestions = engine ? engine.getTotalInitialCount() : sessionWords.length;
  const remainingQuestions = engine ? engine.getRemainingCount() : 0;
  const completedSoFar = Math.max(0, totalQuestions - remainingQuestions);
  const progressPercentage =
    totalQuestions > 0 ? Math.round((completedSoFar / totalQuestions) * 100) : 0;

  const handleSelectOption = (option: WordGuessOption) => {
    setSelectedOptionId(option.id);
    if (option.audio) {
      void playAudioSafe(option.audio);
    }
  };

  const handleSubmitAnswer = () => {
    if (!engine || !selectedOptionId) return;
    const result = engine.submitAnswer(selectedOptionId);
    setFeedbackResult(result);
  };

  const resolvedPackageId = activePackageId || activePackageData?.manifest?.packageId;

  const saveSessionProgress = async (stats: WordGuessSessionStats) => {
    if (resolvedPackageId && unitId && sessionId && mode !== 'free') {
      // 1. Simpan penyelesaian sesi ke SQLite
      const score = stats.accuracyPercentage;
      await unitProgressRepo.recordSessionCompletion(
        resolvedPackageId,
        unitId,
        sessionId,
        score,
      );

      // 2. Tandai seluruh kata pada sesi ini telah dilihat
      for (const w of sessionWords) {
        await wordViewRepo.recordWordView(resolvedPackageId, w.id);
      }
    }
  };

  const handleContinueAfterFeedback = () => {
    if (!engine) return;
    setFeedbackResult(null);
    setSelectedOptionId(null);

    const nextQ = engine.advanceNext();
    if (nextQ) {
      setCurrentQuestion(nextQ);
    } else {
      const stats = engine.getStats();
      setFinalStats(stats);
      setIsSummaryVisible(true);
      void saveSessionProgress(stats);
    }
  };

  const handleReturnToUnit = async () => {
    if (finalStats) {
      await saveSessionProgress(finalStats);
    }
    router.back();
  };

  const handlePressClose = () => {
    if (isSummaryVisible) {
      if (finalStats) {
        void saveSessionProgress(finalStats);
      }
      router.back();
      return;
    }

    Alert.alert(
      'Keluar Latihan?',
      'Progres latihan pada sesi ini tidak akan tersimpan jika kamu keluar sekarang.',
      [
        { text: 'Lanjut Latihan', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ],
    );
  };

  if (!isInitialized || !engine || !currentQuestion) {
    if (isSummaryVisible && finalStats) {
      return (
        <WordGuessSummary
          onReturnToUnit={() => void handleReturnToUnit()}
          stats={finalStats}
        />
      );
    }

    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.stateText}>Menyiapkan latihan Tebak Kata...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isSummaryVisible && finalStats) {
    return (
      <WordGuessSummary
        onReturnToUnit={() => void handleReturnToUnit()}
        stats={finalStats}
      />
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* 1. AppBar: Tombol X di kiri, Progress Bar di tengah, Persentase di kanan */}
      <View style={styles.appBar}>
        <AppPressable
          accessibilityLabel="Tutup sesi latihan tebak kata"
          accessibilityRole="button"
          onPress={handlePressClose}
          style={styles.closeButton}
        >
          <Icon color={colors.navy} name="close-line" size={24} />
        </AppPressable>

        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${Math.min(100, Math.max(0, progressPercentage))}%` },
            ]}
          />
        </View>

        <Text style={styles.progressText}>{progressPercentage}%</Text>
      </View>

      {/* 2. Body Atas: Chip "Tebak Kata" & Kotak Pertanyaan */}
      <View style={styles.bodyContainer}>
        <View style={styles.chipContainer}>
          <View style={styles.categoryChip}>
            <Text style={styles.categoryChipText}>
              {currentQuestion.isRetry ? 'Revisi • Tebak Kata' : 'Tebak Kata'}
            </Text>
          </View>
        </View>

        {/* Kotak Pertanyaan */}
        <View style={styles.questionCard}>
          <Text style={styles.questionWordText}>{currentQuestion.wordText}</Text>
          {Boolean(currentQuestion.exampleSentence) && (
            <Text style={styles.exampleSentenceText}>
              Contoh: {currentQuestion.exampleSentence}
            </Text>
          )}
        </View>

        {/* 3. Body Bawah: Pilihan Jawaban (A/B atau A/B/C) */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option) => {
            const isSelected = selectedOptionId === option.id;
            return (
              <AppPressable
                accessibilityLabel={`Pilihan ${option.label}: ${option.text}`}
                accessibilityRole="button"
                key={option.id}
                onPress={() => handleSelectOption(option)}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardSelected,
                ]}
              >
                {/* Kolom Kiri: Alphabet A/B/C */}
                <View
                  style={[
                    styles.letterBadge,
                    isSelected && styles.letterBadgeSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.letterText,
                      isSelected && styles.letterTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </View>

                {/* Kolom Tengah: Teks Jawaban Tebakan */}
                <Text
                  numberOfLines={2}
                  style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected,
                  ]}
                >
                  {option.text}
                </Text>

                {/* Kolom Kanan: Kosong atau Centang jika dipilih */}
                <View style={styles.checkContainer}>
                  {isSelected ? (
                    <Icon color={colors.primary} name="checkbox-circle-fill" size={22} />
                  ) : (
                    <View style={styles.emptyCircle} />
                  )}
                </View>
              </AppPressable>
            );
          })}
        </View>
      </View>

      {/* 4. Tombol Jawab di Paling Bawah Viewport */}
      <View style={styles.bottomBar}>
        <AppPressable
          accessibilityLabel="Kirim jawaban"
          accessibilityRole="button"
          disabled={!selectedOptionId}
          onPress={handleSubmitAnswer}
          style={[
            styles.submitButton,
            !selectedOptionId && styles.submitButtonDisabled,
          ]}
        >
          <Text
            style={[
              styles.submitButtonText,
              !selectedOptionId && styles.submitButtonTextDisabled,
            ]}
          >
            Jawab
          </Text>
        </AppPressable>
      </View>

      {/* 5. Bottom Sheet Umpan Balik Benar / Salah */}
      <WordGuessFeedbackSheet
        explanation={feedbackResult?.explanation ?? ''}
        isCorrect={Boolean(feedbackResult?.isCorrect)}
        onContinue={handleContinueAfterFeedback}
        visible={Boolean(feedbackResult)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  stateText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // 1. AppBar
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    minHeight: touchTarget,
    gap: spacing.md,
  },
  closeButton: {
    width: touchTarget,
    height: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.xs,
  },
  progressBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.navyTint,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  progressText: {
    fontFamily: fonts.uiBold,
    fontSize: 14,
    color: colors.navy,
    minWidth: 38,
    textAlign: 'right',
  },

  // 2. Body
  bodyContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
  },
  chipContainer: {
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  categoryChip: {
    backgroundColor: colors.navyTint,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
  },
  categoryChipText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 12,
    color: colors.navy,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Kotak Pertanyaan
  questionCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  questionWordText: {
    fontFamily: fonts.uiBold,
    fontSize: 26,
    lineHeight: 32,
    color: colors.navy,
    textAlign: 'center',
  },
  exampleSentenceText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // 3. Pilihan Jawaban
  optionsContainer: {
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: touchTarget + 8,
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.orangeTint,
  },
  letterBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.navyTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterBadgeSelected: {
    backgroundColor: colors.primary,
  },
  letterText: {
    fontFamily: fonts.uiBold,
    fontSize: 14,
    color: colors.navy,
  },
  letterTextSelected: {
    color: colors.surface,
  },
  optionText: {
    flex: 1,
    fontFamily: fonts.uiSemiBold,
    fontSize: 15,
    color: colors.navy,
    paddingHorizontal: spacing.md,
  },
  optionTextSelected: {
    color: colors.primary,
  },
  checkContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
  },

  // 4. Tombol Jawab di Bawah Viewport
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitButton: {
    height: touchTarget + 4,
    backgroundColor: colors.primary,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.border,
  },
  submitButtonText: {
    fontFamily: fonts.uiBold,
    fontSize: 16,
    color: colors.surface,
  },
  submitButtonTextDisabled: {
    color: colors.borderStrong,
  },
});
