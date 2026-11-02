import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Icon from 'react-native-remix-icon';
import { router } from 'expo-router';

import { useApp } from '../../context/AppContext';
import {
  generateQuickQuizItems,
  type QuickQuizQuestion,
} from '../../features/practice/domain/practiceFreeSelection';
import type { FillGapChip } from '../../features/practice/domain/sentenceFillGapEngine';
import { SentenceFeedbackSheet } from '../../features/practice/presentation/SentenceFeedbackSheet';
import { playAudioSafe } from '../../features/vocabulary/audio/audioPlayback';
import { AppPressable } from '../../ui/AppPressable';
import { colors, fonts, radii, spacing, touchTarget } from '../../ui/theme';

export default function QuickQuizScreen() {
  const { isInitialized, activePackageData } = useApp();

  const [sessionKey, setSessionKey] = useState(0);

  // Buat 10 soal campuran (5 Tebak Kata + 5 Kalimat Rumpang) secara acak lintas unit
  const quizItems = useMemo<QuickQuizQuestion[]>(() => {
    if (!activePackageData || sessionKey < 0) return [];
    return generateQuickQuizItems(activePackageData.words, activePackageData.sentences, 5, 5);
  }, [activePackageData, sessionKey]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // State untuk Tebak Kata
  const [selectedWordOptionId, setSelectedWordOptionId] = useState<string | null>(null);

  // State untuk Kalimat Rumpang (Duolingo-style slots & pool seragam dengan fill-gap)
  const [filledSlotChips, setFilledSlotChips] = useState<(FillGapChip | null)[]>([]);
  const [availablePoolChips, setAvailablePoolChips] = useState<FillGapChip[]>([]);

  // State Sheet Feedback
  const [feedbackResult, setFeedbackResult] = useState<{
    isCorrect: boolean;
    explanation: string;
  } | null>(null);

  const currentItem = quizItems[currentIndex];

  // Inisialisasi state interaksi setiap kali soal berganti
  const initCurrentQuestionState = (item?: QuickQuizQuestion) => {
    setSelectedWordOptionId(null);
    setFeedbackResult(null);

    if (item && item.type === 'fill_gap') {
      const q = item.data;
      setFilledSlotChips(new Array(q.blankCount).fill(null));
      setAvailablePoolChips([...q.poolChips]);
    }
  };

  const [lastInitIndex, setLastInitIndex] = useState(-1);
  if (currentIndex !== lastInitIndex && currentItem) {
    setLastInitIndex(currentIndex);
    initCurrentQuestionState(currentItem);
  }

  // Handler Kalimat Rumpang: Klik chip pool (memasukkan ke slot kosong pertama & hapus dari pool)
  const handleSelectPoolChip = (chipId: string) => {
    const chipIndex = availablePoolChips.findIndex((c) => c.id === chipId);
    if (chipIndex === -1) return;

    const firstEmptyIndex = filledSlotChips.findIndex((slot) => slot === null);
    if (firstEmptyIndex === -1) return;

    const selectedChip = availablePoolChips[chipIndex];
    const nextSlots = [...filledSlotChips];
    nextSlots[firstEmptyIndex] = selectedChip;
    setFilledSlotChips(nextSlots);

    const nextPool = [...availablePoolChips];
    nextPool.splice(chipIndex, 1);
    setAvailablePoolChips(nextPool);
  };

  // Handler Kalimat Rumpang: Klik slot untuk mengembalikan chip ke pool
  const handleRemoveSlotChip = (slotIndex: number) => {
    const chipInSlot = filledSlotChips[slotIndex];
    if (!chipInSlot) return;

    const nextSlots = [...filledSlotChips];
    nextSlots[slotIndex] = null;
    setFilledSlotChips(nextSlots);

    setAvailablePoolChips((prev) => [...prev, chipInSlot]);
  };

  // Submit Jawaban
  const handleSubmitAnswer = () => {
    if (!currentItem) return;

    if (currentItem.type === 'word_guess') {
      if (!selectedWordOptionId) return;
      const q = currentItem.data;
      const isCorrect = selectedWordOptionId === q.correctOptionId;
      if (isCorrect) {
        setCorrectCount((prev) => prev + 1);
      } else {
        setIncorrectCount((prev) => prev + 1);
      }
      setFeedbackResult({
        isCorrect,
        explanation: `${q.wordText} artinya "${q.wordMeaning}".`,
      });
    } else {
      const q = currentItem.data;
      const userAnswers = filledSlotChips.map((c) => c?.text ?? '');
      const isCorrect =
        userAnswers.length === q.correctTokens.length &&
        userAnswers.every(
          (ans, idx) => ans.trim().toLowerCase() === q.correctTokens[idx]?.trim().toLowerCase(),
        );
      if (isCorrect) {
        setCorrectCount((prev) => prev + 1);
      } else {
        setIncorrectCount((prev) => prev + 1);
      }
      setFeedbackResult({
        isCorrect,
        explanation: `${q.fullText} artinya "${q.translation}".`,
      });
    }
  };

  const handleNextQuestion = () => {
    setFeedbackResult(null);
    if (currentIndex + 1 < quizItems.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setIsFinished(false);
    setLastInitIndex(-1);
    setSessionKey((prev) => prev + 1);
  };

  const handleConfirmExit = () => {
    Alert.alert(
      'Keluar dari Latihan Cepat?',
      'Progres latihan saat ini tidak akan disimpan.',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Keluar', style: 'destructive', onPress: () => router.back() },
      ],
    );
  };

  if (!isInitialized || quizItems.length === 0) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.stateText}>Menyiapkan latihan cepat lintas unit...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Tampilan Summary Akhir Sesi Gabungan (Seragam dengan WordGuessSummary & SentenceSummary)
  if (isFinished) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.summaryContainer}>
          {/* 1. Icon Selesai */}
          <View style={styles.trophyCircle}>
            <Icon color={colors.primary} name="trophy-fill" size={48} />
          </View>

          {/* 2. Teks Selesai */}
          <Text style={styles.summaryTitle}>Latihan selesai</Text>
          <Text style={styles.summarySubtitle}>
            Hebat! Kamu telah menuntaskan seluruh soal latihan cepat campuran ini.
          </Text>

          {/* 3. Cards Total Benar & Total Salah */}
          <View style={styles.cardsRow}>
            {/* Card Benar */}
            <View style={[styles.statCard, { borderColor: colors.teal }]}>
              <View style={[styles.statIconCircle, { backgroundColor: colors.tealTint }]}>
                <Icon color={colors.teal} name="checkbox-circle-fill" size={24} />
              </View>
              <Text style={[styles.statNumberText, { color: colors.teal }]}>
                {correctCount}
              </Text>
              <Text style={styles.statLabelText}>Jawaban Benar</Text>
            </View>

            {/* Card Salah / Perlu Revisi */}
            <View style={[styles.statCard, { borderColor: colors.border }]}>
              <View style={[styles.statIconCircle, { backgroundColor: colors.orangeTint }]}>
                <Icon color={colors.primary} name="refresh-line" size={24} />
              </View>
              <Text style={[styles.statNumberText, { color: colors.primary }]}>
                {incorrectCount}
              </Text>
              <Text style={styles.statLabelText}>Perlu Revisi</Text>
            </View>
          </View>
        </View>

        {/* 4. Action Buttons di Bottom Bar */}
        <View style={styles.summaryBottomBar}>
          <AppPressable
            accessibilityLabel="Kembali ke tab latihan"
            accessibilityRole="button"
            onPress={() => router.back()}
            style={styles.summaryPrimaryButton}
          >
            <Text style={styles.summaryPrimaryText}>Kembali ke unit</Text>
          </AppPressable>

          <AppPressable
            accessibilityLabel="Ulangi latihan cepat dengan soal acak baru"
            accessibilityRole="button"
            onPress={handleRestart}
            style={styles.summarySecondaryButton}
          >
            <Text style={styles.summarySecondaryText}>Coba Latihan Cepat Baru</Text>
          </AppPressable>
        </View>
      </SafeAreaView>
    );
  }

  const totalQuestions = quizItems.length;
  const progressPercent =
    totalQuestions > 0 ? Math.round((currentIndex / totalQuestions) * 100) : 0;
  const isFillGapReady =
    currentItem.type === 'fill_gap' &&
    filledSlotChips.length > 0 &&
    filledSlotChips.every((slot) => slot !== null);
  const isSubmitDisabled =
    currentItem.type === 'word_guess' ? !selectedWordOptionId : !isFillGapReady;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* 1. AppBar: Tombol X di kiri, Progress Bar di tengah, Persentase di kanan */}
      <View style={styles.appBar}>
        <AppPressable
          accessibilityLabel="Tutup latihan"
          accessibilityRole="button"
          onPress={handleConfirmExit}
          style={styles.closeButton}
        >
          <Icon color={colors.navy} name="close-line" size={24} />
        </AppPressable>

        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${Math.min(100, Math.max(0, progressPercent))}%` },
            ]}
          />
        </View>

        <Text style={styles.progressText}>{progressPercent}%</Text>
      </View>

      {/* 2. Body Area */}
      <View style={styles.bodyContainer}>
        {/* Chip Tipe Soal (Seragam dengan word-guess & fill-gap) */}
        <View style={styles.chipContainer}>
          <View style={styles.categoryChip}>
            <Text style={styles.categoryChipText}>
              {currentItem.type === 'word_guess' ? 'Tebak Kata' : 'Kalimat Rumpang'}
            </Text>
          </View>
        </View>

        {/* Soal Tipe: Tebak Kata (Seragam dengan word-guess.tsx) */}
        {currentItem.type === 'word_guess' ? (
          <>
            <View style={styles.questionCard}>
              <Text style={styles.questionWordText}>{currentItem.data.wordText}</Text>
              {Boolean(currentItem.data.exampleSentence) && (
                <Text style={styles.exampleSentenceText}>
                  Contoh: {currentItem.data.exampleSentence}
                </Text>
              )}
            </View>

            <View style={styles.optionsContainer}>
              {currentItem.data.options.map((option) => {
                const isSelected = selectedWordOptionId === option.id;
                return (
                  <AppPressable
                    accessibilityLabel={`Pilihan ${option.label}: ${option.text}`}
                    accessibilityRole="button"
                    key={option.id}
                    onPress={() => setSelectedWordOptionId(option.id)}
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
          </>
        ) : null}

        {/* Soal Tipe: Kalimat Rumpang (Seragam dengan fill-gap.tsx) */}
        {currentItem.type === 'fill_gap' ? (
          <>
            {/* Container Pertanyaan Abu-abu Tipis (#F5F5F5) */}
            <View style={styles.fillGapQuestionCard}>
              <View style={styles.sentenceTokensContainer}>
                {currentItem.data.tokens.map((token, idx) => {
                  if (token.type === 'text') {
                    return (
                      <Text key={`text-${idx}`} style={styles.sentenceStaticText}>
                        {token.text}
                      </Text>
                    );
                  }

                  const filledChip = filledSlotChips[token.slotIndex];
                  return (
                    <AppPressable
                      accessibilityLabel={
                        filledChip
                          ? `Slot ${token.slotIndex + 1} terisi kata ${filledChip.text}, klik untuk menghapus`
                          : `Slot ${token.slotIndex + 1} kosong`
                      }
                      accessibilityRole="button"
                      key={`slot-${token.slotIndex}`}
                      onPress={() => handleRemoveSlotChip(token.slotIndex)}
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
                  {currentItem.data.translation}
                </Text>
                {Boolean(currentItem.data.audio) && (
                  <AppPressable
                    accessibilityLabel="Putar audio pengucapan kalimat"
                    accessibilityRole="button"
                    onPress={() => void playAudioSafe(currentItem.data.audio)}
                    style={styles.speakerButton}
                  >
                    <Icon color={colors.primary} name="volume-up-line" size={20} />
                  </AppPressable>
                )}
              </View>
            </View>

            {/* Pilihan Kata dengan Chip (Flex-Wrap) */}
            <View style={styles.poolSection}>
              <Text style={styles.poolLabel}>Pilih kata yang tepat:</Text>
              <View style={styles.poolChipsContainer}>
                {availablePoolChips.map((chip) => (
                  <AppPressable
                    accessibilityLabel={`Pilih kata ${chip.text}`}
                    accessibilityRole="button"
                    key={chip.id}
                    onPress={() => handleSelectPoolChip(chip.id)}
                    style={styles.poolChip}
                  >
                    <Text style={styles.poolChipText}>{chip.text}</Text>
                  </AppPressable>
                ))}
              </View>
            </View>
          </>
        ) : null}
      </View>

      {/* 3. Tombol Jawab di Paling Bawah Viewport (Seragam) */}
      <View style={styles.bottomBar}>
        <AppPressable
          accessibilityLabel="Kirim jawaban"
          accessibilityRole="button"
          disabled={isSubmitDisabled}
          onPress={handleSubmitAnswer}
          style={[
            styles.submitButton,
            isSubmitDisabled && styles.submitButtonDisabled,
          ]}
        >
          <Text
            style={[
              styles.submitButtonText,
              isSubmitDisabled && styles.submitButtonTextDisabled,
            ]}
          >
            Jawab
          </Text>
        </AppPressable>
      </View>

      {/* Bottom Sheet Feedback Hasil Jawaban */}
      <SentenceFeedbackSheet
        explanation={feedbackResult?.explanation ?? ''}
        isCorrect={feedbackResult?.isCorrect ?? false}
        onContinue={handleNextQuestion}
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

  // Tebak Kata: Kotak Pertanyaan
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

  // Tebak Kata: Pilihan Jawaban
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

  // Kalimat Rumpang: Kotak Pertanyaan Abu-abu Tipis (#F5F5F5)
  fillGapQuestionCard: {
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

  // Kalimat Rumpang: Pool Chip Pilihan
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

  // Tombol Jawab di Bawah Viewport
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

  // Layar Summary
  summaryContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  trophyCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.orangeTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  summaryTitle: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.navy,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  summarySubtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1.5,
    padding: spacing.lg,
    alignItems: 'center',
  },
  statIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  statNumberText: {
    fontFamily: fonts.uiBold,
    fontSize: 28,
    marginBottom: 2,
  },
  statLabelText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 13,
    color: colors.textSecondary,
  },
  summaryBottomBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  summaryPrimaryButton: {
    height: touchTarget + 4,
    backgroundColor: colors.primary,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryPrimaryText: {
    fontFamily: fonts.uiBold,
    fontSize: 16,
    color: colors.surface,
  },
  summarySecondaryButton: {
    height: touchTarget + 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summarySecondaryText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 15,
    color: colors.navy,
  },
});
