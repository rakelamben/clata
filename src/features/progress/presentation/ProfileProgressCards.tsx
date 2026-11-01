import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import RemixIcon from 'react-native-remix-icon';

import { colors, fonts, radii, spacing, touchTarget } from '../../../ui/theme';

type ProfileProgressCardsProps = {
  currentStreak: number;
  masteryPercentage: number;
  currentLevel: number;
  highestLevel: number;
};

export function ProfileProgressCards({
  currentStreak,
  masteryPercentage,
  currentLevel,
  highestLevel,
}: ProfileProgressCardsProps) {
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showMasteryModal, setShowMasteryModal] = useState(false);

  return (
    <>
      <View style={styles.cardsRow}>
        {/* Kartu 1: Runtutan Hari (Rasio 1/1, Background Kuning Emas dengan Api Bergaris Putih) */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Runtutan harian ${currentStreak} hari. Ketuk untuk info runtutan hari.`}
          onPress={() => setShowStreakModal(true)}
          style={({ pressed }) => [
            styles.squareCard,
            styles.streakCard,
            pressed && styles.cardPressed,
          ]}
        >
          {/* Background SVG with warm aura and big flame */}
          <StreakFlameCardBackground />

          {/* Top-Left Content: Number & "Runtutan Hari" */}
          <View style={styles.streakCopy}>
            <Text style={styles.streakNumber}>{currentStreak}</Text>
            <Text style={styles.streakLabel}>Runtutan Hari</Text>
          </View>
        </Pressable>

        {/* Kartu 2: Mastery Circle (Rasio 1/1) */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Tingkat penguasaan ${masteryPercentage} persen, tingkat L${currentLevel}. Ketuk untuk info mastery.`}
          onPress={() => setShowMasteryModal(true)}
          style={({ pressed }) => [
            styles.squareCard,
            styles.masteryCard,
            pressed && styles.cardPressed,
          ]}
        >
          {/* Komponen 1: Label "Penguasaan" */}
          <Text style={styles.masteryTitle}>Penguasaan</Text>

          {/* Komponen 2: Progress loader diperbesar dan vertically center */}
          <View style={styles.masteryCircleWrap}>
            <MasteryCircleProgress percentage={masteryPercentage} size={106} strokeWidth={9} />
          </View>
        </Pressable>
      </View>

      {/* Modal Dialog Info Runtutan Hari */}
      <Modal
        visible={showStreakModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStreakModal(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowStreakModal(false)}
          accessibilityRole="button"
          accessibilityLabel="Tutup dialog info runtutan hari"
        >
          <Pressable style={styles.dialogCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.dialogIconCircle}>
              <FlameIcon size={36} />
            </View>

            <Text accessibilityRole="header" style={styles.dialogTitle}>
              Pertahankan Runtutan Hari!
            </Text>

            <View style={styles.dialogStepsContainer}>
              <View style={styles.stepRow}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.stepText}>
                  Akses tab <Text style={styles.stepBold}>Kata</Text> setiap hari.
                </Text>
              </View>

              <View style={styles.stepRow}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.stepText}>
                  Scroll dan pelajari minimal <Text style={styles.stepBold}>10 kata</Text>.
                </Text>
              </View>

              <View style={styles.streakHighlightBox}>
                <Text style={styles.streakHighlightText}>
                  🔥 Runtutan hari Anda terus berlanjut!!!
                </Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Mengerti"
              onPress={() => setShowStreakModal(false)}
              style={styles.dialogPrimaryBtn}
            >
              <Text style={styles.dialogPrimaryBtnText}>Mengerti</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal Dialog Info Mastery */}
      <Modal
        visible={showMasteryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMasteryModal(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowMasteryModal(false)}
          accessibilityRole="button"
          accessibilityLabel="Tutup dialog info mastery"
        >
          <Pressable style={styles.dialogCard} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.dialogIconCircle, { backgroundColor: colors.tealTint }]}>
              <RemixIcon name="medal-line" size={32} color={colors.teal} />
            </View>

            <Text accessibilityRole="header" style={styles.dialogTitle}>
              Tingkat Penguasaan
            </Text>

            <View style={styles.masteryPillRow}>
              <View style={styles.dialogMasteryPill}>
                <Text style={styles.dialogMasteryPillText}>
                  Tingkat L{currentLevel} · {masteryPercentage}% Kuasai
                </Text>
              </View>
              <Text style={styles.highestLevelNote}>
                Tertinggi dicapai: Tingkat L{highestLevel}
              </Text>
            </View>

            <Text style={styles.masteryDescription}>
              Skor mastery mengukur kemahiran bahasa Anda secara menyeluruh berdasarkan rumus resmi:
            </Text>

            <View style={styles.formulaList}>
              <View style={styles.formulaItem}>
                <RemixIcon name="book-open-line" size={16} color={colors.primary} />
                <Text style={styles.formulaText}>
                  <Text style={styles.stepBold}>Kosakata (50%)</Text>: Kekuatan kata yang telah dipelajari & dilatih.
                </Text>
              </View>

              <View style={styles.formulaItem}>
                <RemixIcon name="puzzle-line" size={16} color={colors.primary} />
                <Text style={styles.formulaText}>
                  <Text style={styles.stepBold}>Kalimat Rumpang (25%)</Text>: Ketepatan melengkapi kalimat.
                </Text>
              </View>

              <View style={styles.formulaItem}>
                <RemixIcon name="chat-voice-line" size={16} color={colors.primary} />
                <Text style={styles.formulaText}>
                  <Text style={styles.stepBold}>Dialog Kurasi (25%)</Text>: Skor pemahaman percakapan nyata.
                </Text>
              </View>
            </View>

            <Text style={styles.masteryFooterNote}>
              Tingkat belajar dimulai dari L1 (Pemula) hingga L5 (Mahir).
            </Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Mengerti"
              onPress={() => setShowMasteryModal(false)}
              style={styles.dialogPrimaryBtn}
            >
              <Text style={styles.dialogPrimaryBtnText}>Mengerti</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

/** Streak Card Background with Warm Aura & Big Flame with White Outline */
function StreakFlameCardBackground() {
  return (
    <RemixIcon name="meteor-fill" size={45} color={colors.primary} />
  );
}

/** SVG Flame Icon for Dialog Circle */
function FlameIcon({ size = 32 }: { size?: number }) {
  return (
    <Svg viewBox="0 0 32 32" width={size} height={size} accessible={false}>
      {/* Outer flame */}
      <Path
        d="M16 2 C16 7, 21 10, 21 16 C21 21, 17 25, 12 25 C7 25, 4 21, 5 16 C5 12, 8 7, 11 5 C11 9, 13 11, 14 11 C15 7, 16 2, 16 2 Z"
        fill="#FF5722"
      />
      <Path
        d="M16 3 C13 7, 13 10, 10 13 C7 16, 7 20, 9 23 C11 26, 15 28, 18 28 C23 28, 27 24, 27 19 C27 13, 22 9, 21 5 C20 7, 18 8, 16 8 C16 5, 16 3, 16 3 Z"
        fill={colors.primary}
      />
      {/* Inner yellow glow */}
      <Path
        d="M17 14 C17 17, 19 19, 19 22 C19 24.5, 17 26.5, 15 26.5 C13 26.5, 12 25, 12 23 C12 21, 14 18, 15 17 C16 17, 16 16, 17 14 Z"
        fill="#FFD54F"
      />
    </Svg>
  );
}

/** Circular Mastery Progress Component */
function MasteryCircleProgress({
  percentage,
  size = 106,
  strokeWidth = 9,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}) {
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percentage));
  const strokeDashoffset = circumference * (1 - clamped / 100);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        {/* Track circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.tealTint}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.teal}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      {/* Center text - pure bold percentage number */}
      <View style={[StyleSheet.absoluteFill, styles.circleCenterWrap]}>
        <Text style={styles.circlePercentText}>{clamped}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  squareCard: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radii.card + 4,
    overflow: 'hidden',
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  // Streak Card (Golden Yellow with White Outline Flame)
  streakCard: {
    backgroundColor: colors.magentaTint,
    borderWidth: 1,
    borderColor: colors.magenta,
  },
  streakCopy: {
    gap: 0,
    zIndex: 2,
  },
  streakNumber: {
    fontFamily: fonts.bodyBold,
    fontSize: 42,
    lineHeight: 36,
    color: colors.navy,
    marginBottom: 12
  },
  streakLabel: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.navy,
  },
  // Mastery Card (Light)
  masteryCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  masteryTitle: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    textAlign: 'center',
    color: colors.navy,
  },
  masteryCircleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCenterWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circlePercentText: {
    fontFamily: fonts.bodyBold,
    fontSize: 24,
    color: colors.navy,
    lineHeight: 28,
  },
  // Dialog / Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 46, 68, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: radii.sheet,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  dialogIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.navy,
    textAlign: 'center',
  },
  dialogStepsContainer: {
    width: '100%',
    gap: spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 12,
    color: colors.surface,
  },
  stepText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  stepBold: {
    fontFamily: fonts.bodyBold,
    color: colors.navy,
  },
  streakHighlightBox: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FDBA74',
    borderRadius: radii.control,
    padding: spacing.md,
    marginTop: spacing.xs,
    alignItems: 'center',
  },
  streakHighlightText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 13,
    color: '#C2410C',
    textAlign: 'center',
  },
  masteryPillRow: {
    alignItems: 'center',
    gap: 4,
  },
  dialogMasteryPill: {
    backgroundColor: colors.tealTint,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.teal,
  },
  dialogMasteryPillText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 13,
    color: colors.teal,
  },
  highestLevelNote: {
    fontFamily: fonts.ui,
    fontSize: 11,
    color: colors.textSecondary,
  },
  masteryDescription: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  formulaList: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: radii.control,
    padding: spacing.md,
    gap: spacing.sm,
  },
  formulaItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  formulaText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  masteryFooterNote: {
    fontFamily: fonts.uiMedium,
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  dialogPrimaryBtn: {
    width: '100%',
    minHeight: touchTarget,
    backgroundColor: colors.primary,
    borderRadius: radii.control,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  dialogPrimaryBtnText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 15,
    color: colors.surface,
  },
});
