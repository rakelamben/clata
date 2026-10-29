import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-remix-icon';
import { colors, radii, spacing } from '../../../ui/theme';
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
        accessibilityLabel={expanded ? 'Tutup frasa penyelamat' : 'Buka frasa penyelamat'}
        onPress={() => setExpanded((prev) => !prev)}
        style={styles.toggleHeader}
      >
        <View style={styles.headerLeft}>
          <Icon name="lifebuoy-line" size={18} color={colors.primary} />
          <Text style={styles.headerTitle}>Frasa Penyelamat</Text>
        </View>
        <Icon
          name={expanded ? 'arrow-up-s-line' : 'arrow-down-s-line'}
          size={20}
          color={colors.textSecondary}
        />
      </Pressable>

      {expanded ? (
        <View style={styles.contentList}>
          <Text style={styles.helperNotice}>
            Gunakan frasa ini jika kamu merasa canggung atau buntu saat berlatih:
          </Text>
          {phrases.map((phrase) => (
            <View key={phrase.id} style={styles.phraseCard}>
              <View style={styles.phraseMain}>
                <Text style={styles.phraseText}>{phrase.text}</Text>
                <Text style={styles.phraseTranslation}>{phrase.translation}</Text>
                {phrase.registerLabel ? (
                  <Text style={styles.registerLabel}>{phrase.registerLabel}</Text>
                ) : null}
              </View>

              {phrase.audio && onPlayAudio ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Putar audio ${phrase.text}`}
                  onPress={() => onPlayAudio(phrase.audio!)}
                  style={styles.audioButton}
                >
                  <Icon name="volume-up-line" size={20} color={colors.primary} />
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
  },
  toggleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    minHeight: 48,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  contentList: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  helperNotice: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  phraseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background ?? '#F9F9F9',
    padding: spacing.sm,
    borderRadius: 4,
  },
  phraseMain: {
    flex: 1,
  },
  phraseText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  phraseTranslation: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  registerLabel: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  audioButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
});
