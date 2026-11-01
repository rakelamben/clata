import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import RemixIcon from 'react-native-remix-icon';
import { colors, fonts, radii, spacing, touchTarget } from '../../../ui/theme';
import type { RescuePhrase } from '../domain/challengeTypes';

export function RescuePhraseDrawer({
  phrases,
  onPlayAudio,
}: {
  phrases: readonly RescuePhrase[];
  onPlayAudio?: (audioPath: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!phrases || phrases.length === 0) return null;

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={expanded ? 'Tutup frasa bantuan' : 'Buka frasa bantuan'}
        onPress={() => setExpanded((prev) => !prev)}
        style={styles.toggleHeader}
      >
        <View style={styles.headerLeft}>
          <RemixIcon name="lifebuoy-line" size={18} color={colors.primary} />
          <Text style={styles.headerTitle}>Frasa bantuan</Text>
        </View>
        <RemixIcon
          name={expanded ? 'arrow-up-s-line' : 'arrow-down-s-line'}
          size={20}
          color={colors.textSecondary}
        />
      </Pressable>

      {expanded ? (
        <View style={styles.contentList}>
          <Text style={styles.helperNotice}>
            Gunakan frasa ini jika kamu merasa canggung atau buntu saat mencoba:
          </Text>
          {phrases.map((phrase) => (
            <View key={phrase.id} style={styles.phraseCard}>
              <View style={styles.phraseMain}>
                <Text style={styles.phraseText}>{phrase.text}</Text>
                <Text style={styles.phraseTranslation}>{phrase.translation}</Text>
                {phrase.registerLabel ? (
                  <View style={styles.registerBadge}>
                    <Text style={styles.registerLabel}>{phrase.registerLabel}</Text>
                  </View>
                ) : null}
              </View>

              {phrase.audio && onPlayAudio ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Putar audio ${phrase.text}`}
                  onPress={() => onPlayAudio(phrase.audio!)}
                  style={styles.audioButton}
                >
                  <RemixIcon name="volume-up-line" size={20} color={colors.primary} />
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.control,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  toggleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: touchTarget,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 14,
    color: colors.primary,
    letterSpacing: 0.1,
  },
  contentList: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  helperNotice: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  phraseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.border,
  },
  phraseMain: {
    flex: 1,
    gap: 2,
  },
  phraseText: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.navy,
  },
  phraseTranslation: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  registerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.tealTint,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 3,
  },
  registerLabel: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 11,
    color: colors.teal,
  },
  audioButton: {
    minWidth: touchTarget - 4,
    minHeight: touchTarget - 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
