import { useCallback, useEffect, useMemo, useState } from 'react';
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
import RemixIcon from 'react-native-remix-icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radii, spacing, touchTarget } from '../../../ui/theme';
import {
  type ChallengeCardItem,
  type ChallengeVariantType,
  getChallengeLevelLabel,
} from '../domain/challengeTypes';
import { VariantSelector } from './VariantSelector';
import { RescuePhraseDrawer } from './RescuePhraseDrawer';

type ChallengeDetailSheetProps = {
  visible: boolean;
  challenge: ChallengeCardItem | null;
  onClose: () => void;
  onToggleCheck: (challengeId: string, variant: ChallengeVariantType) => void;
  onPlayAudio?: (audioPath: string) => void;
};

export function ChallengeDetailSheet({
  visible,
  challenge,
  onClose,
  onToggleCheck,
  onPlayAudio,
}: ChallengeDetailSheetProps) {
  const insets = useSafeAreaInsets();
  const [variant, setVariant] = useState<ChallengeVariantType>('solo');
  const translateY = useMemo(() => new Animated.Value(600), []);

  const handleClose = useCallback(() => {
    Animated.timing(translateY, {
      toValue: 600,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  }, [translateY, onClose]);

  // Smooth slide-up on open, controlled without modal animation conflict
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

  // PanResponder to allow grabbing and dragging down the handle smoothly
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
          // If dragged down past threshold or swiped with velocity, slide all the way down
          if (gestureState.dy > 60 || gestureState.vy > 0.5) {
            handleClose();
          } else {
            // Rebound back to open position
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

  const currentVariant = challenge.checkedVariant ?? variant;
  const instructions = currentVariant === 'social' ? challenge.social : challenge.solo;
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
    onToggleCheck(challenge.id, currentVariant);
    handleClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none" // Menggunakan animasi kustom translateY untuk mencegah lompatan
      onRequestClose={handleClose}
    >
      <View style={styles.sheetOverlay}>
        {/* Transparent tap-out area without dark backdrop */}
        <Pressable
          style={styles.dismissArea}
          onPress={handleClose}
          accessibilityLabel="Tutup detail tantangan"
          accessibilityRole="button"
        />

        {/* Bottom Sheet Container with Animated translateY */}
        <Animated.View
          style={[
            styles.sheetContainer,
            {
              paddingBottom: Math.max(insets.bottom, spacing.md),
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Top Handle for grabbing and dragging down */}
          <View
            style={styles.handleWrapper}
            {...panResponder.panHandlers}
            accessibilityRole="adjustable"
            accessibilityLabel="Geser ke bawah untuk menutup"
          >
            <View style={styles.handleBar} />
          </View>

          {/* Scrollable Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* 1. Header Badge: Hanya Label Level (Pills waktu dan pills sudah selesai dihilangkan) */}
            <View style={styles.badgeRow}>
              <View style={[styles.levelBadge, levelBadgeStyle]}>
                <Text style={[styles.levelText, levelTextStyle]}>{levelLabel}</Text>
              </View>
            </View>

            {/* 2. Judul */}
            <Text style={styles.title}>{challenge.title}</Text>

            {/* 3. Penjelasan */}
            {challenge.objective ? (
              <Text style={styles.objective}>{challenge.objective}</Text>
            ) : null}

            {/* 4. Tab Praktik Mandiri / Praktik Sosial */}
            <VariantSelector
              selectedVariant={currentVariant}
              onSelectVariant={(v) => setVariant(v)}
            />

            {/* 5. Teks Langkah Praktik Langsung (Tanpa card & tanpa label langkah praktik) */}
            <Text style={styles.instructionText}>{instructions}</Text>

            {/* 6. Frasa Penyelamat */}
            {challenge.rescuePhrases && challenge.rescuePhrases.length > 0 ? (
              <View style={styles.rescueWrapper}>
                <RescuePhraseDrawer phrases={challenge.rescuePhrases} onPlayAudio={onPlayAudio} />
              </View>
            ) : null}

            {/* Action Buttons: Part of Scrollable Content */}
            <View style={styles.actionContainer}>
              {/* 7. Tombol Ulangi Tantangan (Hanya muncul jika sudah selesai, warna hijau pudar tema) */}
              {challenge.isChecked ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Ulangi Tantangan"
                  onPress={handleUncheck}
                  style={styles.retryButton}
                >
                  <RemixIcon name="refresh-line" size={18} color={colors.teal} />
                  <Text style={styles.retryButtonText}>Ulangi Tantangan</Text>
                </Pressable>
              ) : null}

              {/* 8. Tombol Mengerti */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Mengerti"
                onPress={handleClose}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Mengerti</Text>
              </Pressable>
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
    backgroundColor: 'transparent', // Tanpa backdrop gelap
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
  title: {
    fontFamily: fonts.bodyBold,
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
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 24,
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
    minHeight: touchTarget,
    backgroundColor: colors.primary,
    borderRadius: radii.control,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 16,
    color: colors.surface,
  },
  retryButton: {
    minHeight: touchTarget,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: '#BBE3DB',
    backgroundColor: '#EDF7F5', // Hijau pudar tema
  },
  retryButtonText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 14,
    color: colors.teal,
  },
});
