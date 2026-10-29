import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../../../ui/theme';
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
        accessibilityLabel="Varian Solo (Latihan Mandiri)"
        accessibilityState={{ selected: selectedVariant === 'solo' }}
        onPress={() => onSelectVariant('solo')}
        style={[styles.tab, selectedVariant === 'solo' && styles.activeTab]}
      >
        <Text style={[styles.tabText, selectedVariant === 'solo' && styles.activeTabText]}>
          Versi Solo
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="tab"
        accessibilityLabel="Varian Sosial (Interaksi Nyata)"
        accessibilityState={{ selected: selectedVariant === 'social' }}
        onPress={() => onSelectVariant('social')}
        style={[styles.tab, selectedVariant === 'social' && styles.activeTab]}
      >
        <Text style={[styles.tabText, selectedVariant === 'social' && styles.activeTabText]}>
          Versi Sosial
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.border,
    borderRadius: radii.control,
    padding: 3,
    marginVertical: spacing.sm,
  },
  tab: {
    flex: 1,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.control - 2,
  },
  activeTab: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '700',
  },
});
