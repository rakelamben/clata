import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-remix-icon';
import { colors, radii, spacing } from '../../../ui/theme';

export function DialogueLineBubble({
  speaker,
  text,
  translation,
  audio,
  isUser,
  isPlaying,
  onToggleAudio,
}: {
  speaker: string;
  text: string;
  translation: string;
  audio?: string;
  isUser: boolean;
  isPlaying?: boolean;
  onToggleAudio?: () => void;
}) {
  const [showTranslation, setShowTranslation] = useState(false);

  return (
    <View style={[styles.bubbleContainer, isUser ? styles.userContainer : styles.partnerContainer]}>
      {/* Speaker Name Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.speakerName, isUser ? styles.userSpeaker : styles.partnerSpeaker]}>
          {isUser ? 'Kamu' : speaker}
        </Text>
      </View>

      {/* Main Text Content */}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.partnerBubble]}>
        <Text style={styles.regionalText}>{text}</Text>

        {showTranslation ? (
          <Text style={styles.translationText}>{translation}</Text>
        ) : null}

        {/* Footer controls: Audio & Translation Toggle */}
        <View style={styles.controlRow}>
          {audio && onToggleAudio ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isPlaying ? 'Hentikan audio percakapan' : 'Putar audio percakapan'}
              accessibilityState={{ busy: isPlaying }}
              onPress={onToggleAudio}
              style={styles.iconButton}
            >
              <Icon
                name={isPlaying ? 'stop-circle-line' : 'volume-up-line'}
                size={22}
                color={isPlaying ? colors.primary : colors.textSecondary}
              />
            </Pressable>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showTranslation ? 'Sembunyikan terjemahan' : 'Tampilkan terjemahan'}
            onPress={() => setShowTranslation((prev) => !prev)}
            style={styles.translationToggle}
          >
            <Icon name="translate-2" size={16} color={colors.textSecondary} />
            <Text style={styles.toggleLabel}>
              {showTranslation ? 'Tutup arti' : 'Lihat arti'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
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
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  userSpeaker: {
    color: colors.primary,
  },
  partnerSpeaker: {
    color: colors.textSecondary,
  },
  bubble: {
    padding: spacing.md,
    borderRadius: radii.card,
    borderWidth: 1,
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
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 24,
  },
  translationText: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  iconButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  translationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 44,
    paddingVertical: spacing.xs,
  },
  toggleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
