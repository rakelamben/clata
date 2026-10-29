import { useState } from 'react';
import RemixIcon from 'react-native-remix-icon';
import { StyleSheet, Text, View } from 'react-native';

import type { AudioPort } from '../../../infrastructure/audio/AudioPort';
import type { AudioPlaybackState } from '../../../infrastructure/audio/audioTypes';
import type { VocabularyWord } from '../domain/vocabularyTypes';
import { AudioToggle } from './AudioToggle';
import { AppPressable } from '../../../ui/AppPressable';
import { colors, fonts, radii, spacing, touchTarget } from '../../../ui/theme';

type Props = {
  word: VocabularyWord;
  audio: AudioPort;
  audioUri: string | number | null;
  audioState: AudioPlaybackState;
  onAudioStateChange: (state: AudioPlaybackState) => void;
};

const REGISTER_DETAILS: Record<string, { title: string; note: string }> = {
  ngoko: {
    title: 'Ngoko',
    note: 'Tingkat tutur santai dan akrab. Digunakan saat berbicara dengan teman sebaya, kerabat dekat, atau orang yang lebih muda.',
  },
  familiar: {
    title: 'Ngoko (Akrab)',
    note: 'Tingkat tutur santai dan akrab. Digunakan saat berbicara dengan teman sebaya, kerabat dekat, atau orang yang lebih muda.',
  },
  'ngoko-alus': {
    title: 'Ngoko Alus',
    note: 'Variasi ngoko yang menyelipkan kata krama untuk menghormati lawan bicara tanpa meninggalkan suasana akrab.',
  },
  neutral: {
    title: 'Netral / Ngoko Alus',
    note: 'Tingkat tutur sedang atau netral, dapat digunakan dalam percakapan sehari-hari dengan rasa saling menghargai.',
  },
  krama: {
    title: 'Krama',
    note: 'Tingkat tutur halus dan sopan. Digunakan untuk berbicara dengan orang tua, tokoh masyarakat, atau situasi resmi.',
  },
  formal: {
    title: 'Krama (Halus)',
    note: 'Tingkat tutur halus dan sopan. Digunakan untuk berbicara dengan orang tua, tokoh masyarakat, atau situasi resmi.',
  },
  'krama-inggil': {
    title: 'Krama Inggil',
    note: 'Kosakata penghormatan tertinggi, khusus ditujukan kepada orang yang sangat dihormati atau sesepuh.',
  },
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

export function DictionaryWordCard({
  word,
  audio,
  audioUri,
  audioState,
  onAudioStateChange,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [showAudioNote, setShowAudioNote] = useState(false);

  const state = audio.getActiveItemId() === word.id && audioState !== 'idle' ? audioState : 'stopped';
  const posText = formatPartOfSpeech(word.partOfSpeech);
  const registerText = word.registerLabel ?? word.register;
  const registerNote =
    REGISTER_DETAILS[word.register.toLowerCase()]?.note ??
    'Tingkat tutur bahasa daerah yang mengekspresikan tata krama dan rasa hormat sesuai relasi penutur.';

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Kata ${word.lemma}. ${word.meaning}. Tingkat tutur ${registerText}.`}
      style={styles.card}
    >
      {/* Top Row: Lemma + Pronunciation di kiri, Audio toggle di kanan */}
      <View style={styles.topRow}>
        <View style={styles.lemmaContainer}>
          <Text style={styles.lemma} maxFontSizeMultiplier={1.4}>
            {word.lemma}
          </Text>
          {word.level ? (
            <Text style={styles.pronunciation}>{word.level}</Text>
          ) : null}
        </View>

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
            setTimeout(() => setShowAudioNote(false), 2600);
          }}
        />
      </View>

      {/* Definisi: Kelas kata + Makna */}
      <View style={styles.definition}>
        <Text style={styles.meaningText} maxFontSizeMultiplier={1.4}>
          {posText ? <Text style={styles.partOfSpeech}>({posText}) </Text> : null}
          {word.meaning}
        </Text>
      </View>

      {/* Accordion Tingkat Tutur */}
      <View style={styles.accordionContainer}>
        <AppPressable
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          accessibilityLabel={`Tingkat tutur: ${registerText}. ${expanded ? 'Tutup rincian' : 'Buka rincian'}.`}
          onPress={() => setExpanded((prev) => !prev)}
          ringRadius={8}
          style={({ pressed }) => [styles.accordionHeader, pressed && styles.accordionHeaderPressed]}
        >
          <View style={styles.accordionHeaderLeft}>
            <RemixIcon name="information-line" size={16} color={colors.navy} accessible={false} />
            <Text style={styles.registerLabel}>{registerText}</Text>
          </View>
          <RemixIcon
            name={expanded ? 'arrow-up-s-line' : 'arrow-down-s-line'}
            size={18}
            color={colors.textSecondary}
            accessible={false}
          />
        </AppPressable>

        {expanded ? (
          <View style={styles.accordionBody}>
            <Text style={styles.registerNoteText}>{registerNote}</Text>
          </View>
        ) : null}
      </View>

      {/* Catatan Audio jika tidak tersedia */}
      {showAudioNote ? (
        <View style={styles.audioNoteContainer} accessibilityRole="alert">
          <Text style={styles.audioNoteText}>
            Audio belum tersedia. Ejaan tetap dapat dibaca.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  lemmaContainer: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  lemma: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.navy,
  },
  pronunciation: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
  definition: {
    paddingVertical: spacing.xs / 2,
  },
  meaningText: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  partOfSpeech: {
    fontFamily: fonts.bodyMedium,
    fontStyle: 'italic',
    color: colors.textSecondary,
    fontSize: 15,
  },
  accordionContainer: {
    backgroundColor: colors.navyTint,
    borderRadius: 8,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: touchTarget - 8,
  },
  accordionHeaderPressed: {
    backgroundColor: colors.border,
  },
  accordionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  registerLabel: {
    fontFamily: fonts.uiMedium,
    fontSize: 13,
    color: colors.navy,
  },
  accordionBody: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    paddingTop: spacing.xs,
  },
  registerNoteText: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  audioNoteContainer: {
    backgroundColor: colors.navyTint,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 6,
  },
  audioNoteText: {
    fontFamily: fonts.ui,
    fontSize: 13,
    color: colors.textSecondary,
  },
});
