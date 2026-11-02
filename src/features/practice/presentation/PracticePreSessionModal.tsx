import { Modal, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Icon, { type IconName } from 'react-native-remix-icon';

import { AppPressable } from '../../../ui/AppPressable';
import { colors, fonts, radii, spacing, touchTarget } from '../../../ui/theme';

export type PreSessionType = 'quick' | 'word_guess' | 'fill_gap' | 'dialogue';

export interface PreSessionPoint {
  icon: IconName;
  text: string;
}

export interface PreSessionConfig {
  type: PreSessionType;
  title: string;
  points: [PreSessionPoint, PreSessionPoint, PreSessionPoint];
  buttonText: string;
}

export const PRE_SESSION_PRESETS: Record<PreSessionType, PreSessionConfig> = {
  quick: {
    type: 'quick',
    title: 'Uji Kemampuan Cepat',
    points: [
      {
        icon: 'information-line',
        text: 'Ukur penguasaan kosakata dan kalimat campuran saat ini',
      },
      {
        icon: 'bar-chart-2-line',
        text: 'Pantau refleks dan pemahaman bahasamu secara bertahap',
      },
      {
        icon: 'checkbox-multiple-line',
        text: 'Pilihan ganda, jawab santai tanpa batasan waktu',
      },
    ],
    buttonText: 'Mulai Sekarang',
  },
  word_guess: {
    type: 'word_guess',
    title: 'Latihan Tebak Kata',
    points: [
      {
        icon: 'information-line',
        text: 'Asah daya ingat arti kosakata bahasa daerah',
      },
      {
        icon: 'volume-up-line',
        text: 'Disertai audio pelafalan asli penutur lokal',
      },
      {
        icon: 'checkbox-multiple-line',
        text: 'Pilihan ganda dengan umpan balik ragam tutur instan',
      },
    ],
    buttonText: 'Mulai Tebak Kata',
  },
  fill_gap: {
    type: 'fill_gap',
    title: 'Kalimat Rumpang',
    points: [
      {
        icon: 'information-line',
        text: 'Latih ketepatan memilih kata dalam kalimat utuh',
      },
      {
        icon: 'translate-2',
        text: 'Terdapat kalimat panduan dan konteks terjemahan',
      },
      {
        icon: 'checkbox-multiple-line',
        text: 'Biasakan konteks tata bahasa dan ragam tutur yang pas',
      },
    ],
    buttonText: 'Mulai Kalimat Rumpang',
  },
  dialogue: {
    type: 'dialogue',
    title: 'Praktik Percakapan',
    points: [
      {
        icon: 'information-line',
        text: 'Simulasi dialog situasi nyata dengan mitra bicara',
      },
      {
        icon: 'user-smile-line',
        text: 'Uji kecocokan ragam tutur sopan maupun akrab',
      },
      {
        icon: 'checkbox-multiple-line',
        text: 'Alur percakapan interaktif bercabang multi-ending',
      },
    ],
    buttonText: 'Mulai Percakapan',
  },
};

interface PracticePreSessionModalProps {
  visible: boolean;
  config: PreSessionConfig | null;
  onClose: () => void;
  onStart: () => void;
}

export function PracticePreSessionModal({
  visible,
  config,
  onClose,
  onStart,
}: PracticePreSessionModalProps) {
  if (!config) return null;

  return (
    <Modal
      accessibilityViewIsModal
      animationType="slide"
      onRequestClose={onClose}
      transparent={false}
      visible={visible}
    >
      {/* Status Bar OS: Teks/ikon gelap di atas latar putih */}
      <StatusBar style="dark" />

      <SafeAreaView style={styles.fullScreenContainer}>
        {/* 1. Header: Tombol Tutup (X) di kiri atas */}
        <View style={styles.topRow}>
          <AppPressable
            accessibilityLabel="Tutup pra-sesi latihan"
            accessibilityRole="button"
            onPress={onClose}
            style={styles.closeButton}
          >
            <Icon color={colors.navy} name="close-line" size={26} />
          </AppPressable>
        </View>

        {/* 2. Area Icon: Tepat Center Vertically di tinggi yang tersisa */}
        <View style={styles.illustrationCenterArea}>
          <View style={styles.illustrationBadge}>
            <Icon color={colors.navy} name="graduation-cap-fill" size={54} />
            <View style={styles.illustrationSecondaryIcon}>
              <Icon color={colors.primary} name="book-open-fill" size={24} />
            </View>
          </View>
        </View>

        {/* 3. Susunan Bawah: Judul dan Poin Penjelasan ditempatkan tepat di atas button CTA */}
        <View style={styles.bottomSection}>
          <Text accessibilityRole="header" style={styles.title}>
            {config.title}
          </Text>

          <View style={styles.pointsCard}>
            {config.points.map((point, index) => (
              <View key={index} style={styles.pointRow}>
                <View style={styles.pointIconCircle}>
                  <Icon color={colors.navy} name={point.icon} size={18} />
                </View>
                <Text style={styles.pointText}>{point.text}</Text>
              </View>
            ))}
          </View>

          <AppPressable
            accessibilityLabel={`${config.buttonText} untuk memulai latihan`}
            accessibilityRole="button"
            onPress={onStart}
            style={styles.startButton}
          >
            <Text style={styles.startButtonText}>{config.buttonText}</Text>
          </AppPressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xl,
    borderRadius: 0,
    borderWidth: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
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
  illustrationCenterArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationBadge: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.navyTint,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 0,
  },
  illustrationSecondaryIcon: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.orangeTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSection: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 32,
    color: colors.navy,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  pointsCard: {
    backgroundColor: '#F2F2F2',
    borderRadius: radii.card,
    padding: spacing.md + 2,
    gap: spacing.md,
    borderWidth: 0,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  pointIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  pointText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  startButton: {
    backgroundColor: colors.primary,
    borderRadius: 28,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    borderWidth: 0,
  },
  startButtonText: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.surface,
    letterSpacing: 0.2,
  },
});
