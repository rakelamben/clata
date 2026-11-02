import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-remix-icon';
import { AppPressable } from '../../../ui/AppPressable';
import { colors, fonts, radii, spacing } from '../../../ui/theme';

export interface DialogueLineBubbleProps {
  speaker: string;
  text: string;
  translation: string;
  audio?: string;
  isUser: boolean;
  isPlaying?: boolean;
  isRepair?: boolean;
  coachingNote?: string;
  onToggleAudio?: () => void;
}

export function DialogueLineBubble({
  speaker,
  text,
  translation,
  audio,
  isUser,
  isPlaying,
  isRepair,
  coachingNote,
  onToggleAudio,
}: DialogueLineBubbleProps) {
  const [showTranslation, setShowTranslation] = useState(false);
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [slideAnim] = useState(() => new Animated.Value(10));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <Animated.View
      style={[
        styles.bubbleContainer,
        isUser ? styles.userContainer : styles.partnerContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Header Row: Label Pembicara */}
      <View style={styles.headerRow}>
        <Text style={[styles.speakerName, isUser ? styles.userSpeaker : styles.partnerSpeaker]}>
          {isUser ? 'Kamu' : speaker}
          {isRepair ? (
            <Text style={styles.repairHint}>
              {isUser ? ' (Kurang Pas)' : ' (Belum Paham)'}
            </Text>
          ) : null}
        </Text>
      </View>

      {/* Main Bubble Card */}
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.partnerBubble,
          isRepair && styles.repairBubble,
        ]}
      >
        <Text style={styles.regionalText}>{text}</Text>

        {showTranslation ? (
          <Text style={styles.translationText}>{translation}</Text>
        ) : null}

        {coachingNote ? (
          <View style={styles.coachingBox}>
            <Icon color={colors.warning} name="information-line" size={16} />
            <Text style={styles.coachingText}>{coachingNote}</Text>
          </View>
        ) : null}

        {/* Footer controls: Audio & Toggle Terjemahan */}
        <View style={styles.controlRow}>
          {audio && onToggleAudio ? (
            <AppPressable
              accessibilityLabel={isPlaying ? 'Hentikan audio percakapan' : 'Putar audio percakapan'}
              accessibilityRole="button"
              onPress={onToggleAudio}
              style={styles.iconButton}
            >
              <Icon
                color={isPlaying ? colors.primary : colors.textSecondary}
                name={isPlaying ? 'stop-circle-line' : 'volume-up-line'}
                size={22}
              />
            </AppPressable>
          ) : null}

          <AppPressable
            accessibilityLabel={showTranslation ? 'Sembunyikan terjemahan' : 'Tampilkan terjemahan'}
            accessibilityRole="button"
            onPress={() => setShowTranslation((prev) => !prev)}
            style={styles.translationToggle}
          >
            <Icon color={colors.textSecondary} name="translate-2" size={16} />
            <Text style={styles.toggleLabel}>
              {showTranslation ? 'Tutup arti' : 'Lihat arti'}
            </Text>
          </AppPressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bubbleContainer: {
    marginVertical: spacing.xs,
    maxWidth: '85%',
  },
  userContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  partnerContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  headerRow: {
    marginBottom: spacing.xs / 2,
    paddingHorizontal: spacing.xs,
  },
  speakerName: {
    fontFamily: fonts.uiBold,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  userSpeaker: {
    color: colors.primary,
  },
  partnerSpeaker: {
    color: colors.textSecondary,
  },
  repairHint: {
    fontFamily: fonts.uiMedium,
    fontSize: 11,
    color: colors.warning,
    textTransform: 'none',
  },
  bubble: {
    padding: spacing.md,
    borderRadius: radii.card,
    borderWidth: 1,
  },
  repairBubble: {
    borderColor: colors.warning,
    backgroundColor: '#FFFDF5',
  },
  userBubble: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderTopRightRadius: 4,
  },
  partnerBubble: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderTopLeftRadius: 4,
  },
  regionalText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 17,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  translationText: {
    marginTop: spacing.sm,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
  },
  coachingBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFDF5',
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: radii.control,
    padding: spacing.xs + 2,
    marginTop: spacing.sm,
    gap: 6,
  },
  coachingText: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.warning,
    lineHeight: 18,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  iconButton: {
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  translationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 40,
    paddingVertical: spacing.xs,
  },
  toggleLabel: {
    fontFamily: fonts.uiMedium,
    fontSize: 12,
    color: colors.textSecondary,
  },
});
