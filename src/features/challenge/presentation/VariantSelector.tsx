import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radii, spacing } from '../../../ui/theme';
import type { ChallengeVariantType } from '../domain/challengeTypes';

export function VariantSelector({
  selectedVariant,
  onSelectVariant,
}: {
  selectedVariant: ChallengeVariantType;
  onSelectVariant: (variant: ChallengeVariantType) => void;
}) {
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel="Pilih Praktik Mandiri"
        accessibilityRole="tab"
        accessibilityState={{ selected: selectedVariant === 'solo' }}
        onPress={() => onSelectVariant('solo')}
        style={[styles.tab, selectedVariant === 'solo' && styles.activeTab]}
      >
        <Text
          style={[
            styles.tabText,
            selectedVariant === 'solo' && styles.activeTabText,
          ]}
        >
          Praktik Mandiri
        </Text>
      </Pressable>

      <Pressable
        accessibilityLabel="Pilih Praktik Sosial"
        accessibilityRole="tab"
        accessibilityState={{ selected: selectedVariant === 'social' }}
        onPress={() => onSelectVariant('social')}
        style={[styles.tab, selectedVariant === 'social' && styles.activeTab]}
      >
        <Text
          style={[
            styles.tabText,
            selectedVariant === 'social' && styles.activeTabText,
          ]}
        >
          Praktik Sosial
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.navyTint,
    borderRadius: radii.card,
    padding: 4,
    marginVertical: spacing.sm,
    height: 48,
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.card - 4,
    paddingHorizontal: spacing.sm,
  },
  activeTab: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontFamily: fonts.uiMedium,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  activeTabText: {
    fontFamily: fonts.uiBold,
    color: colors.navy,
  },
});

