import RemixIcon from 'react-native-remix-icon';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, spacing, touchTarget } from '../../../ui/theme';

export type PreparationPhase = 'preparing' | 'ready' | 'failed';

type Props = {
  stages: readonly string[];
  stageIndex: number;
  phase: PreparationPhase;
  errorMessage?: string | null;
};

/**
 * Renders the three preparation steps as a labelled list. Each row is a single
 * accessible element so a screen reader announces "label, status" instead of
 * walking through decorative numbers and icons.
 */
export function PreparationList({ stages, stageIndex, phase, errorMessage }: Props) {
  return (
    <View
      accessibilityRole="list"
      accessibilityLabel="Langkah persiapan"
      style={styles.list}
    >
      {stages.map((label, index) => {
        const done = phase === 'ready' || index < stageIndex;
        const active = phase === 'preparing' && index === stageIndex;
        const status = done ? 'selesai' : active ? 'sedang diproses' : 'menunggu';

        return (
          <View
            key={label}
            accessible
            accessibilityRole="text"
            accessibilityLabel={`${label}, ${status}`}
            style={styles.row}
          >
            <View style={[styles.marker, done && styles.markerDone, active && styles.markerActive]}>
              {done ? (
                <RemixIcon name="check-line" size={16} color={colors.surface} accessible={false} />
              ) : active ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text allowFontScaling={false} style={styles.markerNumber}>
                  {index + 1}
                </Text>
              )}
            </View>
            <Text style={[styles.label, done && styles.labelDone, active && styles.labelActive]}>
              {label}
            </Text>
          </View>
        );
      })}

      {phase === 'failed' && errorMessage ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    marginTop: spacing.xl,
    gap: spacing.xs,
  },
  row: {
    minHeight: touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  marker: {
    width: 24,
    height: 24,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
  },
  markerDone: {
    borderColor: colors.teal,
    backgroundColor: colors.teal,
  },
  markerActive: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  markerNumber: {
    color: colors.textSecondary,
    fontFamily: fonts.uiMedium,
    fontSize: 12,
    lineHeight: 16,
  },
  label: {
    flex: 1,
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
  },
  labelDone: {
    color: colors.teal,
  },
  labelActive: {
    color: colors.navy,
    fontFamily: fonts.bodySemiBold,
  },
  error: {
    marginTop: spacing.md,
    color: colors.magenta,
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
  },
});
