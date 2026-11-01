import { StyleSheet, Text, View } from 'react-native';

import type { WordItem } from '../domain/package/packageTypes';
import { RegisterBadge } from './RegisterBadge';
import { colors, fonts, radii, spacing } from './theme';

interface WordCardProps {
  word: WordItem;
}

export function WordCard({ word }: WordCardProps) {
  return (
    <View accessibilityLabel={`${word.text}: ${word.meaning}`} style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.wordInfo}>
          <Text style={styles.wordText}>{word.text}</Text>
          <Text style={styles.meaningText}>{word.meaning}</Text>
        </View>

        <RegisterBadge register={word.register} showExplanation={false} />
      </View>

      {/* Catatan teks pemakaian (opsional, maks 120 karakter) */}
      {word.catatan ? (
        <View style={styles.catatanContainer}>
          <Text style={styles.catatanLabel}>Catatan:</Text>
          <Text style={styles.catatanText}>{word.catatan}</Text>
        </View>
      ) : null}

      {word.register === 'netral' ? (
        <Text style={styles.netralNote}>Bisa dipakai ke siapa saja</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  wordInfo: {
    flex: 1,
    gap: 2,
  },
  wordText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 18,
    color: colors.navy,
  },
  meaningText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
  catatanContainer: {
    backgroundColor: colors.navyTint,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.control,
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  catatanLabel: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 12,
    color: colors.navy,
  },
  catatanText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.navy,
    flex: 1,
  },
  netralNote: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.teal,
    fontStyle: 'italic',
  },
});
