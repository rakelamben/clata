import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii, spacing, touchTarget } from '../../../ui/theme';
import type { ChallengeVariantType } from '../domain/challengeTypes';

export function VariantSelector({
  selectedVariant,
  onSelectVariant,
}: {
  selectedVariant: ChallengeVariantType;
  onSelectVariant: (variant: ChallengeVariantType) => void;
}) {
  return (
    <View style={styles.container} accessibilityRole="tablist">
      <Pressable
        accessibilityRole="tab"
        accessibilityLabel="Latihan Mandiri (Versi Solo)"
        accessibilityState={{ selected: selectedVariant === 'solo' }}
        onPress={() => onSelectVariant('solo')}
        style={[styles.tab, selectedVariant === 'solo' && styles.activeTab]}
      >
        <Text style={[styles.tabText, selectedVariant === 'solo' && styles.activeTabText]}>
          Latihan Mandiri
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="tab"
        accessibilityLabel="Praktik Nyata (Versi Sosial)"
        accessibilityState={{ selected: selectedVariant === 'social' }}
        onPress={() => onSelectVariant('social')}
        style={[styles.tab, selectedVariant === 'social' && styles.activeTab]}
      >
        <Text style={[styles.tabText, selectedVariant === 'social' && styles.activeTabText]}>
          Praktik Nyata
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#EEF1F4',
    borderRadius: radii.control,
    padding: 3,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    minHeight: Math.max(38, touchTarget - 8),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.control - 2,
  },
  activeTab: {
    backgroundColor: colors.surface,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontFamily: fonts.uiMedium,
    fontSize: 13,
    color: colors.textSecondary,
    letterSpacing: 0.1,
  },
  activeTabText: {
    fontFamily: fonts.uiSemiBold,
    color: colors.navy,
  },
});
