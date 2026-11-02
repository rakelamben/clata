import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-remix-icon';

import type { WordItem } from '../../../domain/package/packageTypes';
import { AppPressable } from '../../../ui/AppPressable';
import { RegisterBadge } from '../../../ui/RegisterBadge';
import { colors, fonts, radii, spacing } from '../../../ui/theme';
import { playAudioSafe, type AudioPlayStatus } from '../audio/audioPlayback';

interface DictionaryWordCardProps {
  word: WordItem;
}

export function DictionaryWordCard({ word }: DictionaryWordCardProps) {
  const [audioStatus, setAudioStatus] = useState<AudioPlayStatus>('idle');

  const handlePlayAudio = async () => {
    await playAudioSafe(word.audio, setAudioStatus);
  };

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.wordInfo}>
          <Text style={styles.wordText}>{word.text}</Text>
          <Text style={styles.meaningText}>{word.meaning}</Text>
        </View>

        <AppPressable
          accessibilityLabel={`Putar audio kata ${word.text}`}
          accessibilityRole="button"
          onPress={() => void handlePlayAudio()}
          style={styles.audioButton}
        >
          <Icon
            color={
              audioStatus === 'playing'
                ? colors.primary
                : audioStatus === 'unavailable'
                  ? colors.textSecondary
                  : colors.navy
            }
            name={
              audioStatus === 'playing'
                ? 'volume-up-fill'
                : audioStatus === 'unavailable'
                  ? 'volume-mute-line'
                  : 'volume-up-line'
            }
            size={18}
          />
        </AppPressable>
      </View>

      <View style={styles.footerRow}>
        <RegisterBadge register={word.register} showExplanation={false} />

        {word.catatan ? (
          <Text numberOfLines={1} style={styles.catatanText}>
            {word.catatan}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  wordInfo: {
    flex: 1,
    gap: 2,
  },
  wordText: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.navy,
  },
  meaningText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
  audioButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navyTint,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  catatanText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    flexShrink: 1,
  },
});
