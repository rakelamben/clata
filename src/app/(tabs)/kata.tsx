import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { WordItem } from '../../domain/package/packageTypes';
import { colors, fonts, spacing } from '../../ui/theme';
import { WordCard } from '../../ui/WordCard';

const SAMPLE_WORDS: WordItem[] = [
  {
    id: 'kata-nedha',
    text: 'nedha',
    meaning: 'makan (krama)',
    part_of_speech: 'verb',
    register: 'sopan',
    catatan: 'Untuk diri sendiri.',
    theme: 'daily',
    unit_id: 'unit-1',
    audio: 'audio/kata-sugeng.opus',
    status: 'poc',
  },
  {
    id: 'kata-dhahar',
    text: 'dhahar',
    meaning: 'makan (krama inggil)',
    part_of_speech: 'verb',
    register: 'sopan',
    catatan: 'Untuk orang yang dihormati.',
    theme: 'daily',
    unit_id: 'unit-1',
    audio: 'audio/kata-sugeng.opus',
    status: 'poc',
  },
  {
    id: 'kata-mangan',
    text: 'mangan',
    meaning: 'makan (ngoko)',
    part_of_speech: 'verb',
    register: 'akrab',
    theme: 'daily',
    unit_id: 'unit-1',
    audio: 'audio/kata-sugeng.opus',
    status: 'poc',
  },
  {
    id: 'kata-kamar',
    text: 'kamar',
    meaning: 'kamar',
    part_of_speech: 'noun',
    register: 'netral',
    theme: 'daily',
    unit_id: 'unit-1',
    audio: 'audio/kata-sugeng.opus',
    status: 'poc',
  },
];

export default function KataScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text accessibilityRole="header" style={styles.title}>
          Kata
        </Text>

        <View style={styles.wordList}>
          {SAMPLE_WORDS.map((word) => (
            <WordCard key={word.id} word={word} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 32,
    color: colors.navy,
  },
  wordList: {
    gap: spacing.md,
  },
});
