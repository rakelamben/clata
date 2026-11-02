import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-remix-icon';

import type { ChallengeRescuePhrase } from '../../../domain/package/packageTypes';
import { playAudioSafe } from '../../vocabulary/audio/audioPlayback';
import { AppPressable } from '../../../ui/AppPressable';
import { colors, fonts, radii, spacing, touchTarget } from '../../../ui/theme';

export function RescuePhraseDrawer({
  phrases,
  onPlayAudio,
}: {
  phrases: ChallengeRescuePhrase[];
  onPlayAudio?: (audioPath: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!phrases || phrases.length === 0) return null;

  const handlePlay = (audioPath?: string) => {
    if (!audioPath) return;
    if (onPlayAudio) {
      onPlayAudio(audioPath);
    } else {
      void playAudioSafe(audioPath);
    }
  };

  return (
    <View style={styles.container}>
      {/* Tombol Header Accordion */}
      <AppPressable
        accessibilityLabel={`Frasa penyelamat, ${phrases.length} frasa tersedia`}
        accessibilityRole="button"
        onPress={() => setIsExpanded((prev) => !prev)}
        style={styles.headerButton}
      >
        <View style={styles.headerLeft}>
          <Icon color={colors.primary} name="shield-check-line" size={18} />
          <Text style={styles.headerTitle}>Frasa Penyelamat</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{phrases.length}</Text>
          </View>
        </View>

        <Icon
          color={colors.textSecondary}
          name={isExpanded ? 'arrow-up-s-line' : 'arrow-down-s-line'}
          size={20}
        />
      </AppPressable>

      {/* Konten Frasa jika dibuka */}
      {isExpanded && (
        <View style={styles.contentList}>
          {phrases.map((phrase) => (
            <View key={phrase.id} style={styles.phraseCard}>
              <View style={styles.phraseTopRow}>
                <Text style={styles.phraseText}>{phrase.text}</Text>
                {Boolean(phrase.audio) && (
                  <AppPressable
                    accessibilityLabel="Putar audio frasa penyelamat"
                    accessibilityRole="button"
                    onPress={() => handlePlay(phrase.audio)}
                    style={styles.audioButton}
                  >
                    <Icon color={colors.primary} name="volume-up-line" size={18} />
                  </AppPressable>
                )}
              </View>

              <Text style={styles.phraseTranslation}>{phrase.translation}</Text>

              {Boolean(phrase.registerLabel) && (
                <View style={styles.registerBadge}>
                  <Text style={styles.registerText}>{phrase.registerLabel}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8F9FA',
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginVertical: spacing.xs,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: touchTarget - 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  headerTitle: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 14,
    color: colors.navy,
  },
  countBadge: {
    backgroundColor: colors.orangeTint,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  countText: {
    fontFamily: fonts.uiBold,
    fontSize: 11,
    color: colors.primary,
  },
  contentList: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  phraseCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
  },
  phraseTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  phraseText: {
    fontFamily: fonts.uiBold,
    fontSize: 15,
    color: colors.navy,
    flex: 1,
    paddingRight: spacing.sm,
  },
  audioButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.orangeTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phraseTranslation: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  registerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.navyTint,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  registerText: {
    fontFamily: fonts.uiMedium,
    fontSize: 11,
    color: colors.navy,
  },
});
