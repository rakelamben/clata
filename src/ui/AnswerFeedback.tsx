import { StyleSheet, Text, View } from 'react-native';

import type { WordItem } from '../domain/package/packageTypes';
import { RegisterBadge } from './RegisterBadge';
import { colors, fonts, radii, spacing } from './theme';

interface AnswerFeedbackProps {
  word: WordItem;
  isCorrect: boolean;
}

export function AnswerFeedback({ word, isCorrect }: AnswerFeedbackProps) {
  return (
    <View
      accessibilityLabel={`Umpan balik jawaban: ${isCorrect ? 'Benar' : 'Kurang tepat'}`}
      style={[
        styles.container,
        isCorrect ? styles.correctContainer : styles.incorrectContainer,
      ]}
    >
      <View style={styles.headerRow}>
        <Text
          style={[
            styles.statusTitle,
            isCorrect ? styles.correctTitle : styles.incorrectTitle,
          ]}
        >
          {isCorrect ? 'Benar!' : 'Kurang Tepat'}
        </Text>
        <RegisterBadge register={word.register} showExplanation={false} />
      </View>

      <Text style={styles.wordDetails}>
        <Text style={styles.wordText}>{word.text}</Text> ({word.meaning})
      </Text>

      {/* Tampilkan catatan pemakaian di umpan balik jawaban */}
      {word.catatan ? (
        <View style={styles.catatanBox}>
          <Text style={styles.catatanText}>{word.catatan}</Text>
        </View>
      ) : null}

      {word.register === 'netral' ? (
        <Text style={styles.netralText}>Bisa dipakai ke siapa saja</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: spacing.xs,
  },
  correctContainer: {
    backgroundColor: colors.tealTint,
    borderColor: colors.teal,
  },
  incorrectContainer: {
    backgroundColor: colors.magentaTint,
    borderColor: colors.magenta,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusTitle: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 16,
  },
  correctTitle: {
    color: colors.teal,
  },
  incorrectTitle: {
    color: colors.magenta,
  },
  wordDetails: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textPrimary,
  },
  wordText: {
    fontFamily: fonts.uiSemiBold,
  },
  catatanBox: {
    marginTop: spacing.xs,
    padding: spacing.xs + 2,
    backgroundColor: colors.surface,
    borderRadius: radii.control,
  },
  catatanText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
  netralText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.teal,
    fontStyle: 'italic',
  },
});
