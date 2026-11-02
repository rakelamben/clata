import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-remix-icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppPressable } from '../../../ui/AppPressable';
import { colors, fonts, radii, spacing, touchTarget } from '../../../ui/theme';
import {
  type ChallengeCardItem,
  type ChallengeVariantType,
  getChallengeLevelLabel,
} from '../domain/challengeTypes';
import { RescuePhraseDrawer } from './RescuePhraseDrawer';
import { VariantSelector } from './VariantSelector';

export interface ChallengeDetailSheetProps {
  visible: boolean;
  challenge: ChallengeCardItem | null;
  onClose: () => void;
  onToggleCheck: (challengeId: string, variant: ChallengeVariantType) => void;
  onPlayAudio?: (audioPath: string) => void;
}

export function ChallengeDetailSheet({
  visible,
  challenge,
  onClose,
  onToggleCheck,
  onPlayAudio,
}: ChallengeDetailSheetProps) {
  const insets = useSafeAreaInsets();
  const [selectedVariantOverride, setSelectedVariantOverride] = useState<ChallengeVariantType | null>(null);
  const [prevChallengeId, setPrevChallengeId] = useState<string | null>(null);
  const translateY = useMemo(() => new Animated.Value(600), []);

  const currentChallengeId = challenge?.id ?? null;
  if (currentChallengeId !== prevChallengeId) {
    setPrevChallengeId(currentChallengeId);
    setSelectedVariantOverride(null);
  }

  const selectedVariant = selectedVariantOverride ?? challenge?.checkedVariant ?? 'solo';

  const handleClose = useCallback(() => {
    Animated.timing(translateY, {
      toValue: 600,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  }, [translateY, onClose]);

  useEffect(() => {
    if (visible) {
      translateY.setValue(600);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, translateY]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 4,
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dy > 0) {
            translateY.setValue(gestureState.dy);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy > 60 || gestureState.vy > 0.5) {
            handleClose();
          } else {
            Animated.spring(translateY, {
              toValue: 0,
              bounciness: 4,
              useNativeDriver: true,
            }).start();
          }
        },
      }),
    [translateY, handleClose],
  );

  if (!challenge) return null;

  const instructions = selectedVariant === 'social' ? challenge.social : challenge.solo;
  const levelLabel = getChallengeLevelLabel(challenge.level);

  const isLight = challenge.level === 'L1';
  const isMedium = challenge.level === 'L2';
  const levelBadgeStyle = isLight
    ? styles.levelBadgeLight
    : isMedium
      ? styles.levelBadgeMedium
      : styles.levelBadgeLarge;
  const levelTextStyle = isLight
    ? styles.levelTextLight
    : isMedium
      ? styles.levelTextMedium
      : styles.levelTextLarge;

  const handleUncheck = () => {
    onToggleCheck(challenge.id, selectedVariant);
    handleClose();
  };

  return (
    <Modal
      animationType="none"
      onRequestClose={handleClose}
      transparent
      visible={visible}
    >
      <View style={styles.sheetOverlay}>
        {/* Area sentuh transparan untuk menutup saat tap di luar */}
        <Pressable
          accessibilityLabel="Tutup detail tantangan"
          accessibilityRole="button"
          onPress={handleClose}
          style={styles.dismissArea}
        />

        {/* Bottom Sheet Container dengan Animated translateY */}
        <Animated.View
          style={[
            styles.sheetContainer,
            {
              paddingBottom: Math.max(insets.bottom, spacing.md),
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Top Handle untuk gestur seret ke bawah */}
          <View
            accessibilityLabel="Geser ke bawah untuk menutup"
            accessibilityRole="adjustable"
            style={styles.handleWrapper}
            {...panResponder.panHandlers}
          >
            <View style={styles.handleBar} />
          </View>

          {/* Konten Scrollable */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Baris Badge: Level & Durasi */}
            <View style={styles.badgeRow}>
              <View style={[styles.levelBadge, levelBadgeStyle]}>
                <Text style={[styles.levelText, levelTextStyle]}>Kesusahan: {levelLabel}</Text>
              </View>

              {/* {Boolean(challenge.estimatedDurationMinutes) && (
                <View style={styles.durationBadge}>
                  <Icon color={colors.textSecondary} name="time-line" size={13} />
                  <Text style={styles.durationText}>
                    {challenge.estimatedDurationMinutes} Menit
                  </Text>
                </View>
              )} */}
            </View>

            {/* 2. Judul Tantangan */}
            <Text style={styles.title}>{challenge.title}</Text>

            {/* 3. Penjelasan / Objektif */}
            {challenge.objective ? (
              <Text style={styles.objective}>{challenge.objective}</Text>
            ) : null}

            {/* 4. Tab Pemilih: Praktik Mandiri / Praktik Sosial */}
            <VariantSelector
              onSelectVariant={setSelectedVariantOverride}
              selectedVariant={selectedVariant}
            />

            {/* 5. Teks Langkah Praktik Langsung */}
            {instructions ? (
              <Text style={styles.instructionText}>{instructions}</Text>
            ) : null}

            {/* 6. Frasa Penyelamat */}
            {challenge.rescuePhrases && challenge.rescuePhrases.length > 0 ? (
              <View style={styles.rescueWrapper}>
                <RescuePhraseDrawer
                  onPlayAudio={onPlayAudio}
                  phrases={challenge.rescuePhrases}
                />
              </View>
            ) : null}

            {/* 7. Action Buttons */}
            <View style={styles.actionContainer}>
              {/* Tombol Ulangi Tantangan (Hanya muncul jika sudah selesai) */}
              {challenge.isChecked ? (
                <AppPressable
                  accessibilityLabel="Ulangi Tantangan"
                  accessibilityRole="button"
                  onPress={handleUncheck}
                  style={styles.retryButton}
                >
                  <Icon color={colors.teal} name="refresh-line" size={18} />
                  <Text style={styles.retryButtonText}>Ulangi Tantangan</Text>
                </AppPressable>
              ) : null}

              {/* Tombol Mengerti */}
              <AppPressable
                accessibilityLabel="Mengerti"
                accessibilityRole="button"
                onPress={handleClose}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Mengerti</Text>
              </AppPressable>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
  },
  dismissArea: {
    flex: 1,
  },
  sheetContainer: {
    maxHeight: '85%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  handleWrapper: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    minHeight: 36,
  },
  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  levelBadge: {
    borderRadius: radii.control,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
  },
  levelBadgeLight: {
    backgroundColor: colors.tealTint,
  },
  levelBadgeMedium: {
    backgroundColor: colors.navyTint,
  },
  levelBadgeLarge: {
    backgroundColor: colors.magentaTint,
  },
  levelText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 12,
  },
  levelTextLight: {
    color: colors.teal,
  },
  levelTextMedium: {
    color: colors.navy,
  },
  levelTextLarge: {
    color: colors.magenta,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.navyTint,
    borderRadius: radii.control,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    gap: 4,
  },
  durationText: {
    fontFamily: fonts.uiMedium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  title: {
    fontFamily: fonts.uiBold,
    fontSize: 22,
    color: colors.navy,
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  objective: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  instructionText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 23,
    paddingVertical: spacing.xs,
  },
  rescueWrapper: {
    marginTop: spacing.xs,
  },
  actionContainer: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  primaryButton: {
    minHeight: touchTarget + 4,
    backgroundColor: colors.primary,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: fonts.uiBold,
    fontSize: 16,
    color: colors.surface,
  },
  retryButton: {
    minHeight: touchTarget + 4,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#BBE3DB',
    backgroundColor: colors.tealTint,
  },
  retryButtonText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 14,
    color: colors.teal,
  },
});
