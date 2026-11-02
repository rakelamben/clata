import { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Icon from 'react-native-remix-icon';

import type { WordItem } from '../../../domain/package/packageTypes';
import { AppPressable } from '../../../ui/AppPressable';
import { colors, fonts, radii, spacing, touchTarget } from '../../../ui/theme';
import { playAudioSafe } from '../../vocabulary/audio/audioPlayback';

export interface WordPrimerModalProps {
  visible: boolean;
  words: WordItem[];
  onClose: () => void;
  onContinue: () => void;
}

export function WordPrimerModal({
  visible,
  words,
  onClose,
  onContinue,
}: WordPrimerModalProps) {
  const [playingWordId, setPlayingWordId] = useState<string | null>(null);

  const handlePlayAudio = async (word: WordItem) => {
    if (!word.audio) return;
    setPlayingWordId(word.id);
    await playAudioSafe(word.audio, (status) => {
      if (status === 'idle' || status === 'unavailable' || status === 'error') {
        setPlayingWordId(null);
      }
    });
  };

  if (!visible) return null;

  return (
    <Modal
      animationType="slide"
      presentationStyle="fullScreen"
      transparent={false}
      visible={visible}
    >
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <StatusBar style="dark" />

        {/* 1. AppBar: Tombol X di kiri, Header */}
        <View style={styles.appBar}>
          <AppPressable
            accessibilityLabel="Tutup dan kembali"
            accessibilityRole="button"
            onPress={onClose}
            style={styles.closeButton}
          >
            <Icon color={colors.navy} name="close-line" size={24} />
          </AppPressable>
        </View>

        {/* 2. Judul di Tengah Atas */}
        <View style={styles.headerContainer}>
          <Text style={styles.titleText}>Kamu harus tahu kata ini</Text>
          <Text style={styles.subtitleText}>
            Pelajari sekilas kosakata baru ini sebelum memulai latihan.
          </Text>
        </View>

        {/* 3. Grid Card Kata (2 Kolom) */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.gridContainer}>
            {words.map((word) => {
              const isPlaying = playingWordId === word.id;
              return (
                <View key={word.id} style={styles.wordCard}>
                  <View style={styles.cardTopRow}>
                    <Text numberOfLines={1} style={styles.wordText}>
                      {word.text}
                    </Text>
                    {Boolean(word.audio) && (
                      <AppPressable
                        accessibilityLabel={`Dengarkan lafal kata ${word.text}`}
                        accessibilityRole="button"
                        onPress={() => void handlePlayAudio(word)}
                        style={styles.speakerButton}
                      >
                        <Icon
                          color={isPlaying ? colors.primary : colors.textSecondary}
                          name={isPlaying ? 'volume-up-fill' : 'volume-up-line'}
                          size={18}
                        />
                      </AppPressable>
                    )}
                  </View>

                  <Text numberOfLines={2} style={styles.meaningText}>
                    {word.meaning}
                  </Text>

                  {Boolean(word.register) && (
                    <View style={styles.tagBadge}>
                      <Text style={styles.tagText}>{word.register}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* 4. Bottom CTA: Tombol Lanjut */}
        <View style={styles.bottomBar}>
          <AppPressable
            accessibilityLabel="Lanjut ke latihan"
            accessibilityRole="button"
            onPress={onContinue}
            style={styles.continueButton}
          >
            <Text style={styles.continueButtonText}>Lanjut</Text>
          </AppPressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    minHeight: touchTarget,
  },
  closeButton: {
    width: touchTarget,
    height: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.xs,
  },
  headerContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    alignItems: 'center',
  },
  titleText: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 28,
    color: colors.navy,
    textAlign: 'center',
  },
  subtitleText: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  wordCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    minHeight: 100,
    justifyContent: 'space-between',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordText: {
    flex: 1,
    fontFamily: fonts.uiBold,
    fontSize: 16,
    color: colors.navy,
    paddingRight: spacing.xs,
  },
  speakerButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.navyTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meaningText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    marginVertical: spacing.xs,
  },
  tagBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.navyTint,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.control,
  },
  tagText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 11,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  bottomBar: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  continueButton: {
    height: touchTarget + 4,
    backgroundColor: colors.primary,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontFamily: fonts.uiBold,
    fontSize: 16,
    color: colors.surface,
  },
});
