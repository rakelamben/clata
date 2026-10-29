import { useState } from 'react';
import RemixIcon from 'react-native-remix-icon';
import { Animated, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import type { AudioPort } from '../../../infrastructure/audio/AudioPort';
import type { AudioPlaybackState } from '../../../infrastructure/audio/audioTypes';
import type { VocabularyWord } from '../domain/vocabularyTypes';
import { AudioToggle } from './AudioToggle';
import { AppPressable } from '../../../ui/AppPressable';
import { colors, fonts, spacing, touchTarget } from '../../../ui/theme';

type Props = {
  word: VocabularyWord;
  slideHeight: number;
  animatedStyle?: StyleProp<Animated.WithAnimatedValue<ViewStyle>>;
  audio: AudioPort;
  audioUri: string | number | null;
  audioState: AudioPlaybackState;
  onAudioStateChange: (state: AudioPlaybackState) => void;
  onOpenTooltip?: (word: VocabularyWord) => void;
};

function formatPartOfSpeech(pos?: string): string {
  if (!pos) return '';
  switch (pos.toLowerCase()) {
    case 'verb':
      return 'verba';
    case 'noun':
      return 'nomina';
    case 'adjective':
      return 'adjektiva';
    case 'interjection':
      return 'interjeksi';
    case 'adverb':
      return 'adverbia';
    default:
      return pos;
  }
}

export function WordFeedItem({
  word,
  slideHeight,
  animatedStyle,
  audio,
  audioUri,
  audioState,
  onAudioStateChange,
  onOpenTooltip,
}: Props) {
  const [showAudioNote, setShowAudioNote] = useState(false);
  const state = audio.getActiveItemId() === word.id && audioState !== 'idle' ? audioState : 'stopped';
  const posText = formatPartOfSpeech(word.partOfSpeech);

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Kata, ${word.lemma}. ${word.meaning}.`}
      style={[styles.slideContainer, { height: slideHeight }]}
    >
      <Animated.View style={[styles.content, animatedStyle]}>
        {/* Lemma - Kata Utama (Tanpa Card) */}
        <View style={styles.lemmaContainer}>
          <Text style={styles.lemma} maxFontSizeMultiplier={1.4}>
            {word.lemma}
          </Text>
        </View>

        {/* Pronunciation & Audio Toggle Pill */}
        <View style={styles.pronunciationRow}>
          <View style={styles.pronunciationPill}>
            {word.level ? <Text style={styles.pronunciationText}>{word.level}</Text> : null}
            <AudioToggle
              wordId={word.id}
              wordLabel={word.lemma}
              reference={word.audio}
              uri={audioUri}
              audio={audio}
              state={state}
              onStateChange={onAudioStateChange}
              onUnavailable={() => {
                setShowAudioNote(true);
                setTimeout(() => setShowAudioNote(false), 2400);
              }}
            />
          </View>
        </View>

        {/* Meaning & Word Class */}
        <View style={styles.meaningContainer}>
          <Text style={styles.meaningText} maxFontSizeMultiplier={1.5}>
            {posText ? <Text style={styles.partOfSpeech}>({posText}) </Text> : null}
            {word.meaning}
          </Text>
        </View>

        {/* Action Row - Register Info Icon */}
        <View style={styles.actionRow}>
          <AppPressable
            accessibilityRole="button"
            accessibilityLabel={`Tingkat tutur: ${word.registerLabel ?? word.register}. Buka rincian.`}
            onPress={() => onOpenTooltip?.(word)}
            ringRadius={touchTarget / 2}
            style={({ pressed }) => [styles.infoButton, pressed && styles.infoButtonPressed]}
          >
            <RemixIcon name="information-line" size={24} color={colors.navy} accessible={false} />
          </AppPressable>
        </View>

        {showAudioNote ? (
          <View style={styles.audioNoteContainer} accessibilityRole="alert">
            <Text style={styles.audioNoteText}>Audio belum tersedia.</Text>
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  slideContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  content: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  lemmaContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  lemma: {
    fontFamily: fonts.display,
    fontSize: 48,
    lineHeight: 56,
    color: colors.navy,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  pronunciationRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pronunciationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.navyTint,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 24,
  },
  pronunciationText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: colors.textSecondary,
    paddingLeft: spacing.xs,
  },
  meaningContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  meaningText: {
    fontFamily: fonts.body,
    fontSize: 21,
    lineHeight: 30,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  partOfSpeech: {
    fontFamily: fonts.bodyMedium,
    fontStyle: 'italic',
    color: colors.textSecondary,
    fontSize: 19,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.sm,
  },
  infoButton: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: touchTarget / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navyTint,
  },
  infoButtonPressed: {
    backgroundColor: colors.border,
  },
  audioNoteContainer: {
    backgroundColor: colors.navyTint,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 8,
    marginTop: spacing.xs,
  },
  audioNoteText: {
    fontFamily: fonts.ui,
    fontSize: 13,
    color: colors.textSecondary,
  },
});
