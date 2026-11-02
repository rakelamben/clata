import { useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Icon from 'react-native-remix-icon';

import type { WordItem } from '../../../domain/package/packageTypes';
import type { Register } from '../../../domain/Register';
import { AppPressable } from '../../../ui/AppPressable';
import { RegisterBadge } from '../../../ui/RegisterBadge';
import { colors, fonts, radii, spacing } from '../../../ui/theme';
import { playAudioSafe, type AudioPlayStatus } from '../audio/audioPlayback';

interface WordFeedItemProps {
  word: WordItem;
  slideHeight: number;
  animatedStyle?: StyleProp<Animated.WithAnimatedValue<ViewStyle>>;
  onOpenRegister: (register: Register) => void;
}

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
  onOpenRegister,
}: WordFeedItemProps) {
  const [audioStatus, setAudioStatus] = useState<AudioPlayStatus>('idle');
  const posText = formatPartOfSpeech(word.part_of_speech);

  const handlePlayAudio = async () => {
    await playAudioSafe(word.audio, setAudioStatus);
  };

  return (
    <View style={[styles.slideContainer, { height: slideHeight }]}>
      <Animated.View style={[styles.content, animatedStyle]}>
        {/* 1. Lemma Utama (Gloock 48sp, Cardless) */}
        <View style={styles.lemmaContainer}>
          <Text accessibilityRole="header" style={styles.lemmaText}>
            {word.text}
          </Text>
        </View>

        {/* 2. Audio Pill (Pelafalan Penutur Asli) */}
        <View style={styles.audioRow}>
          <AppPressable
            accessibilityLabel={`Putar suara pelafalan kata ${word.text}`}
            accessibilityRole="button"
            onPress={() => void handlePlayAudio()}
            style={styles.audioPill}
          >
            <Icon
              color={audioStatus === 'playing' ? colors.primary : colors.navy}
              name={audioStatus === 'playing' ? 'volume-up-fill' : 'volume-up-line'}
              size={18}
            />
            <Text
              style={[
                styles.audioPillText,
                audioStatus === 'playing' && styles.audioPillTextActive,
                audioStatus === 'unavailable' && styles.audioPillTextMuted,
              ]}
            >
              {audioStatus === 'loading'
                ? 'Memuat...'
                : audioStatus === 'playing'
                  ? 'Memutar...'
                  : audioStatus === 'unavailable'
                    ? 'Audio belum tersedia'
                    : 'Pelafalan'}
            </Text>
          </AppPressable>
        </View>

        {/* 3. Arti & Kelas Kata */}
        <View style={styles.meaningContainer}>
          <Text style={styles.meaningText}>
            {posText ? <Text style={styles.partOfSpeech}>({posText}) </Text> : null}
            {word.meaning}
          </Text>
        </View>

        {/* 4. Badge Tingkat Tutur + Tombol Info (ℹ️) */}
        <View style={styles.registerRow}>
          <RegisterBadge register={word.register} showExplanation={false} />

          <AppPressable
            accessibilityLabel={`Pelajari tingkat tutur ${word.register}`}
            accessibilityRole="button"
            onPress={() => onOpenRegister(word.register)}
            style={styles.infoButton}
          >
            <Icon color={colors.navy} name="information-line" size={18} />
          </AppPressable>
        </View>

        {/* 5. Catatan Konteks (Opsional) */}
        {word.catatan ? (
          <View style={styles.catatanBox}>
            <Text style={styles.catatanText}>{word.catatan}</Text>
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
    paddingHorizontal: spacing.xl,
  },
  content: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  lemmaContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  lemmaText: {
    fontFamily: fonts.display,
    fontSize: 48,
    lineHeight: 56,
    color: colors.navy,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  audioRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 4,
    borderRadius: 24,
  },
  audioPillText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.navy,
  },
  audioPillTextActive: {
    color: colors.primary,
    fontFamily: fonts.bodySemiBold,
  },
  audioPillTextMuted: {
    color: colors.textSecondary,
  },
  meaningContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  meaningText: {
    fontFamily: fonts.body,
    fontSize: 20,
    lineHeight: 28,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  partOfSpeech: {
    fontFamily: fonts.bodyMedium,
    fontStyle: 'italic',
    color: colors.textSecondary,
    fontSize: 18,
  },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  infoButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navyTint,
  },
  catatanBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.control,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxWidth: 320,
  },
  catatanText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
