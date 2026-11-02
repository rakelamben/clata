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
  generateFillGapQuestions,
  SentenceFillGapSessionEngine,
  type SentenceFillGapQuestion,
  type SentenceFillGapStats,
} from '../../features/practice/domain/sentenceFillGapEngine';
import { selectFreeFillGapItems } from '../../features/practice/domain/practiceFreeSelection';
import { SentenceFeedbackSheet } from '../../features/practice/presentation/SentenceFeedbackSheet';
import { SentenceSummary } from '../../features/practice/presentation/SentenceSummary';
import { playAudioSafe } from '../../features/vocabulary/audio/audioPlayback';
import { UnitProgressRepository } from '../../infrastructure/database/unitProgressRepository';
import { WordViewRepository } from '../../infrastructure/database/wordViewRepository';
import { AppPressable } from '../../ui/AppPressable';
import { colors, fonts, radii, spacing, touchTarget } from '../../ui/theme';

const unitProgressRepo = new UnitProgressRepository();
const wordViewRepo = new WordViewRepository();

export default function SentenceFillGapScreen() {
  const { unitId, sessionId, mode } = useLocalSearchParams<{
    unitId?: string;
    sessionId?: string;
    mode?: string;
  }>();
  const { isInitialized, activePackageId, activePackageData } = useApp();

  // Cari unit dan kalimat-kalimat yang relevan untuk sesi ini
  const { sessionSentences, allWords } = useMemo(() => {
    if (!activePackageData) {
      return { sessionSentences: [], allWords: [] };
    }

    const { words, sentences, dialogues, units } = activePackageData;

    if (mode === 'free' || !unitId) {
      return {
        sessionSentences: selectFreeFillGapItems(sentences, 8),
        allWords: words,
      };
    }

    const currentUnit = units.find((u) => u.unit_id === unitId);

    if (!currentUnit) {
      return {
        sessionSentences: selectFreeFillGapItems(sentences, 8),
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
    const sSentences = activeSession
      ? sentences.filter((s) => activeSession.itemIds.includes(s.id))
      : unitSentences.slice(0, 6);

    return {
      sessionSentences: sSentences,
      allWords: words,
    };
  }, [activePackageData, unitId, sessionId, mode]);

  // Inisialisasi engine soal kalimat rumpang
  const engine = useMemo(() => {
    if (sessionSentences.length === 0) return null;
    const questions = generateFillGapQuestions(sessionSentences, allWords);
    return new SentenceFillGapSessionEngine(questions);
  }, [sessionSentences, allWords]);

  const [currentQuestion, setCurrentQuestion] = useState<SentenceFillGapQuestion | null>(() =>
    engine ? engine.getCurrentQuestion() : null,
  );
  const [, setSlotsState] = useState(0); // Trigger re-render saat slot berubah
  const [feedbackResult, setFeedbackResult] = useState<{
    isCorrect: boolean;
    explanation: string;
  } | null>(null);
  const [isSummaryVisible, setIsSummaryVisible] = useState(false);
  const [finalStats, setFinalStats] = useState<SentenceFillGapStats | null>(null);

  // Progres soal
  const totalQuestions = engine ? engine.getTotalInitialCount() : sessionSentences.length;
  const remainingQuestions = engine ? engine.getRemainingCount() : 0;
  const completedSoFar = Math.max(0, totalQuestions - remainingQuestions);
  const progressPercentage =
    totalQuestions > 0 ? Math.round((completedSoFar / totalQuestions) * 100) : 0;

  const currentSlots = engine ? engine.getCurrentSlots() : [];
  const availablePoolChips = engine ? engine.getAvailablePoolChips() : [];
  const isAllFilled = engine ? engine.isAllSlotsFilled() : false;

  // Interaksi Duolingo: Mengetuk chip pada pool memasukkannya ke slot kosong pertama
  const handlePressPoolChip = (chipId: string) => {
    if (!engine) return;
    const placed = engine.placeChipInFirstEmptySlot(chipId);
    if (placed) {
      setSlotsState((prev) => prev + 1);
    }
  };

  // Interaksi Duolingo: Mengetuk chip pada slot mengembalikannya ke pool pilihan
  const handlePressSlot = (slotIndex: number) => {
    if (!engine) return;
    const removed = engine.removeChipFromSlot(slotIndex);
    if (removed) {
      setSlotsState((prev) => prev + 1);
    }
  };

  const handlePlayAudio = (audioPath?: string) => {
    if (!audioPath) return;
    void playAudioSafe(audioPath);
  };

  const handleSubmitAnswer = () => {
    if (!engine || !isAllFilled) return;
    const result = engine.submitAnswer();
    setFeedbackResult(result);
  };

  const resolvedPackageId = activePackageId || activePackageData?.manifest?.packageId;

  const saveSessionProgress = async (stats: SentenceFillGapStats) => {
    if (resolvedPackageId && unitId && sessionId && mode !== 'free') {
      // 1. Simpan penyelesaian sesi ke SQLite
      const score = stats.accuracyPercentage;
      await unitProgressRepo.recordSessionCompletion(
        resolvedPackageId,
        unitId,
        sessionId,
        score,
      );

      // 2. Tandai seluruh kata fokus pada kalimat sesi ini telah dilihat
      for (const s of sessionSentences) {
        if (s.focus_word_id) {
          await wordViewRepo.recordWordView(resolvedPackageId, s.focus_word_id);
        }
        if (s.word_ids) {
          for (const wid of s.word_ids) {
            await wordViewRepo.recordWordView(resolvedPackageId, wid);
          }
        }
      }
    }
  };

  const handleContinueAfterFeedback = () => {
    if (!engine) return;
    setFeedbackResult(null);

    const nextQ = engine.advanceNext();
    setSlotsState((prev) => prev + 1);

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
        <SentenceSummary
          onReturnToUnit={() => void handleReturnToUnit()}
          stats={finalStats}
        />
      );
    }

    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.stateText}>Menyiapkan latihan Kalimat Rumpang...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isSummaryVisible && finalStats) {
    return (
      <SentenceSummary
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
          accessibilityLabel="Tutup sesi latihan kalimat rumpang"
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

      {/* 2. Body Atas: Chip "Kalimat rumpang" & Kotak Pertanyaan Abu-abu Tipis */}
      <View style={styles.bodyContainer}>
        <View style={styles.chipContainer}>
          <View style={styles.categoryChip}>
            <Text style={styles.categoryChipText}>
              {currentQuestion.isRetry ? 'Revisi • Kalimat Rumpang' : 'Kalimat Rumpang'}
            </Text>
          </View>
        </View>

        {/* Container Pertanyaan Abu-abu Tipis (#F5F5F5) */}
        <View style={styles.questionCard}>
          <View style={styles.sentenceTokensContainer}>
            {currentQuestion.tokens.map((token, idx) => {
              if (token.type === 'text') {
                return (
                  <Text key={`text-${idx}`} style={styles.sentenceStaticText}>
                    {token.text}
                  </Text>
                );
              }

              // Slot Rumpang Interaktif
              const filledChip = currentSlots[token.slotIndex];
              return (
                <AppPressable
                  accessibilityLabel={
                    filledChip
                      ? `Slot ${token.slotIndex + 1} terisi kata ${filledChip.text}, klik untuk menghapus`
                      : `Slot ${token.slotIndex + 1} kosong`
                  }
                  accessibilityRole="button"
                  key={`slot-${token.slotIndex}`}
                  onPress={() => handlePressSlot(token.slotIndex)}
                  style={[
                    styles.slotBox,
                    filledChip ? styles.slotBoxFilled : styles.slotBoxEmpty,
                  ]}
                >
                  {filledChip ? (
                    <Text style={styles.slotChipText}>{filledChip.text}</Text>
                  ) : (
                    <Text style={styles.slotPlaceholderText}>___</Text>
                  )}
                </AppPressable>
              );
            })}
          </View>

          {/* Baris Bawah Kotak: Terjemahan Indonesia & Tombol Speaker Audio */}
          <View style={styles.questionBottomRow}>
            <Text numberOfLines={2} style={styles.translationText}>
              {currentQuestion.translation}
            </Text>
            {Boolean(currentQuestion.audio) && (
              <AppPressable
                accessibilityLabel="Putar audio pengucapan kalimat"
                accessibilityRole="button"
                onPress={() => handlePlayAudio(currentQuestion.audio)}
                style={styles.speakerButton}
              >
                <Icon color={colors.primary} name="volume-up-line" size={20} />
              </AppPressable>
            )}
          </View>
        </View>

        {/* 3. Body Bawah: Group Pilihan Jawaban dengan Chip (Flex-Wrap) */}
        <View style={styles.poolSection}>
          <Text style={styles.poolLabel}>Pilih kata yang tepat:</Text>
          <View style={styles.poolChipsContainer}>
            {availablePoolChips.map((chip) => (
              <AppPressable
                accessibilityLabel={`Pilih kata ${chip.text}`}
                accessibilityRole="button"
                key={chip.id}
                onPress={() => handlePressPoolChip(chip.id)}
                style={styles.poolChip}
              >
                <Text style={styles.poolChipText}>{chip.text}</Text>
              </AppPressable>
            ))}
          </View>
        </View>
      </View>

      {/* 4. Tombol Jawab di Paling Bawah Viewport */}
      <View style={styles.bottomBar}>
        <AppPressable
          accessibilityLabel="Kirim jawaban susunan kalimat"
          accessibilityRole="button"
          disabled={!isAllFilled}
          onPress={handleSubmitAnswer}
          style={[
            styles.submitButton,
            !isAllFilled && styles.submitButtonDisabled,
          ]}
        >
          <Text
            style={[
              styles.submitButtonText,
              !isAllFilled && styles.submitButtonTextDisabled,
            ]}
          >
            Jawab
          </Text>
        </AppPressable>
      </View>

      {/* 5. Bottom Sheet Umpan Balik Benar / Salah */}
      <SentenceFeedbackSheet
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

  // Container Pertanyaan Abu-abu Tipis
  questionCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  sentenceTokensContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
  },
  sentenceStaticText: {
    fontFamily: fonts.uiBold,
    fontSize: 18,
    lineHeight: 26,
    color: colors.navy,
  },

  // Slot Rumpang
  slotBox: {
    minWidth: 54,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  slotBoxEmpty: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  slotBoxFilled: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  slotPlaceholderText: {
    fontFamily: fonts.uiBold,
    fontSize: 16,
    color: colors.textSecondary,
    letterSpacing: 2,
  },
  slotChipText: {
    fontFamily: fonts.uiBold,
    fontSize: 15,
    color: colors.primary,
  },

  // Baris Bawah Kotak Pertanyaan
  questionBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  translationText: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  speakerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  // 3. Pool Chip Pilihan
  poolSection: {
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  poolLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textSecondary,
    paddingLeft: spacing.xs,
  },
  poolChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    minHeight: 100,
  },
  poolChip: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm + 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  poolChipText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 15,
    color: colors.navy,
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
