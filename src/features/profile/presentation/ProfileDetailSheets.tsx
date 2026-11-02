import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-remix-icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, radii, spacing, touchTarget } from '../../../ui/theme';
import type { ProfileUnitItemProgress } from './ProfileUnitAccordion';

// Base wrapper untuk semua detail bottom sheet
function BaseBottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.sheetOverlay}>
        <Pressable
          accessibilityLabel="Tutup dialog"
          accessibilityRole="button"
          onPress={onClose}
          style={styles.dismissArea}
        />

        <View
          style={[
            styles.sheetContainer,
            { paddingBottom: Math.max(insets.bottom, spacing.md) },
          ]}
        >
          <View style={styles.handleWrapper}>
            <View style={styles.handleBar} />
          </View>

          <View style={styles.header}>
            <Text style={styles.sheetTitle}>{title}</Text>
            {Boolean(subtitle) && (
              <Text style={styles.sheetSubtitle}>{subtitle}</Text>
            )}
          </View>

          <ScrollView
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>

          <Pressable
            accessibilityLabel="Tutup"
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.closeButtonPressed,
            ]}
          >
            <Text style={styles.closeButtonText}>Tutup</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// 1. Bottom Sheet Streak Harian
export function StreakDetailSheet({
  visible,
  onClose,
  streakDays,
  todayScrollCount,
  isTodayCompleted,
}: {
  visible: boolean;
  onClose: () => void;
  streakDays: number;
  todayScrollCount: number;
  isTodayCompleted: boolean;
}) {
  return (
    <BaseBottomSheet
      onClose={onClose}
      subtitle="Jaga kebiasaan belajar harian Anda"
      title="Streak Belajar Harian"
      visible={visible}
    >
      <View style={styles.heroStatBanner}>
        <View style={styles.heroIconCircleOrange}>
          <Icon color={colors.primary} name="fire-fill" size={32} />
        </View>
        <Text style={styles.heroBigNumber}>{streakDays}</Text>
        <Text style={styles.heroStatLabel}>Hari Beruntun Aktif</Text>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoCardRow}>
          <Icon
            color={isTodayCompleted ? colors.teal : colors.primary}
            name={isTodayCompleted ? 'checkbox-circle-fill' : 'time-line'}
            size={20}
          />
          <Text style={styles.infoCardTitle}>
            {isTodayCompleted
              ? 'Target Hari Ini Tuntas!'
              : `Progres Hari Ini: ${todayScrollCount}/10 Kata`}
          </Text>
        </View>
        <Text style={styles.infoCardBody}>
          Pelajari minimal 10 kata setiap hari di menu Kata untuk mempertahankan
          dan menambah hari streak Anda.
        </Text>
      </View>
    </BaseBottomSheet>
  );
}

// 2. Bottom Sheet Level Mastery
export function MasteryDetailSheet({
  visible,
  onClose,
  levelLabel,
  masteryProgress,
  unitsCompleted,
  totalUnits,
  challengesCompleted,
  totalChallenges,
  wordsLearned,
}: {
  visible: boolean;
  onClose: () => void;
  levelLabel: string;
  masteryProgress: number;
  unitsCompleted: number;
  totalUnits: number;
  challengesCompleted: number;
  totalChallenges: number;
  wordsLearned: number;
}) {
  const percentage = Math.round(masteryProgress * 100);

  return (
    <BaseBottomSheet
      onClose={onClose}
      subtitle="Evaluasi penguasaan bahasa secara keseluruhan"
      title="Tingkat Penguasaan"
      visible={visible}
    >
      <View style={styles.heroStatBanner}>
        <View style={styles.heroIconCircleTeal}>
          <Icon color={colors.teal} name="award-fill" size={32} />
        </View>
        <Text style={styles.heroLevelText}>{levelLabel}</Text>
        <Text style={styles.heroStatLabel}>{percentage}% Penguasaan Tercapai</Text>
      </View>

      <View style={styles.summaryGrid}>
        <View style={styles.summaryGridItem}>
          <Text style={styles.gridNumber}>
            {unitsCompleted}/{totalUnits}
          </Text>
          <Text style={styles.gridLabel}>Unit Selesai</Text>
        </View>

        <View style={styles.summaryGridItem}>
          <Text style={styles.gridNumber}>
            {challengesCompleted}/{totalChallenges}
          </Text>
          <Text style={styles.gridLabel}>Tantangan</Text>
        </View>

        <View style={styles.summaryGridItem}>
          <Text style={styles.gridNumber}>{wordsLearned}</Text>
          <Text style={styles.gridLabel}>Kata Dipelajari</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoCardBody}>
          Tingkat penguasaan bertumbuh secara bertahap saat Anda menuntaskan sesi
          latihan unit, menyelesaikan tantangan dunia nyata, dan mengulang
          kosakata.
        </Text>
      </View>
    </BaseBottomSheet>
  );
}

// 3. Bottom Sheet Statistik Belajar Ringkas
export function LearningStatsSheet({
  visible,
  onClose,
  wordsLearned,
  totalWordsInPackage,
  challengesCompleted,
  totalChallenges,
  accuracyPercentage,
}: {
  visible: boolean;
  onClose: () => void;
  wordsLearned: number;
  totalWordsInPackage: number;
  challengesCompleted: number;
  totalChallenges: number;
  accuracyPercentage: number;
}) {
  return (
    <BaseBottomSheet
      onClose={onClose}
      subtitle="Rincian capaian pembelajaran Anda"
      title="Statistik Belajar"
      visible={visible}
    >
      <View style={styles.statsCardList}>
        <View style={styles.statMetricRow}>
          <View style={styles.statIconBg}>
            <Icon color={colors.navy} name="book-read-line" size={20} />
          </View>
          <View style={styles.statTexts}>
            <Text style={styles.statTitle}>Kosakata Dipelajari</Text>
            <Text style={styles.statMeta}>
              {wordsLearned} dari {totalWordsInPackage} total kosakata paket
            </Text>
          </View>
          <Text style={styles.statHighlight}>{wordsLearned}</Text>
        </View>

        <View style={styles.statMetricRow}>
          <View style={styles.statIconBg}>
            <Icon color={colors.teal} name="flag-line" size={20} />
          </View>
          <View style={styles.statTexts}>
            <Text style={styles.statTitle}>Tantangan Selesai</Text>
            <Text style={styles.statMeta}>
              Praktik mandiri dan sosial yang diselesaikan
            </Text>
          </View>
          <Text style={styles.statHighlight}>
            {challengesCompleted}/{totalChallenges}
          </Text>
        </View>

        <View style={styles.statMetricRow}>
          <View style={styles.statIconBg}>
            <Icon color={colors.primary} name="percent-line" size={20} />
          </View>
          <View style={styles.statTexts}>
            <Text style={styles.statTitle}>Akurasi Latihan</Text>
            <Text style={styles.statMeta}>
              Rata-rata ketepatan jawaban di sesi latihan
            </Text>
          </View>
          <Text style={styles.statHighlight}>{accuracyPercentage}%</Text>
        </View>
      </View>
    </BaseBottomSheet>
  );
}

// 4. Bottom Sheet Detail Unit
export function UnitDetailSheet({
  visible,
  onClose,
  unit,
  sessions,
}: {
  visible: boolean;
  onClose: () => void;
  unit: ProfileUnitItemProgress | null;
  sessions: {
    sessionId: string;
    title: string;
    isCompleted: boolean;
    scorePercentage?: number;
  }[];
}) {
  if (!unit) return null;

  return (
    <BaseBottomSheet
      onClose={onClose}
      subtitle={`Progres keseluruhan unit: ${unit.percentage}%`}
      title={`Unit ${unit.order}: ${unit.title}`}
      visible={visible}
    >
      <View style={styles.sessionList}>
        {sessions.map((sess) => (
          <View
            key={sess.sessionId}
            style={[
              styles.sessionItem,
              sess.isCompleted && styles.sessionItemCompleted,
            ]}
          >
            <View style={styles.sessionLeft}>
              <Icon
                color={sess.isCompleted ? colors.teal : colors.borderStrong}
                name={
                  sess.isCompleted
                    ? 'checkbox-circle-fill'
                    : 'checkbox-blank-circle-line'
                }
                size={20}
              />
              <Text
                style={[
                  styles.sessionTitle,
                  sess.isCompleted && styles.sessionTitleCompleted,
                ]}
              >
                {sess.title}
              </Text>
            </View>

            <Text
              style={[
                styles.sessionStatusText,
                sess.isCompleted && styles.sessionStatusCompleted,
              ]}
            >
              {sess.isCompleted
                ? sess.scorePercentage !== undefined
                  ? `${sess.scorePercentage}%`
                  : 'Selesai'
                : 'Belum Selesai'}
            </Text>
          </View>
        ))}
      </View>
    </BaseBottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(10, 46, 68, 0.4)',
  },
  dismissArea: {
    flex: 1,
  },
  sheetContainer: {
    maxHeight: '85%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  handleWrapper: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
  },
  header: {
    marginBottom: spacing.md,
    gap: 4,
  },
  sheetTitle: {
    fontFamily: fonts.uiBold,
    fontSize: 20,
    color: colors.navy,
  },
  sheetSubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  contentContainer: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  heroStatBanner: {
    backgroundColor: '#F8F9FA',
    borderRadius: radii.card,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroIconCircleOrange: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.orangeTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  heroIconCircleTeal: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.tealTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  heroBigNumber: {
    fontFamily: fonts.display,
    fontSize: 40,
    color: colors.navy,
    lineHeight: 44,
  },
  heroLevelText: {
    fontFamily: fonts.uiBold,
    fontSize: 24,
    color: colors.navy,
  },
  heroStatLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  infoCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  infoCardTitle: {
    fontFamily: fonts.uiBold,
    fontSize: 14,
    color: colors.navy,
  },
  infoCardBody: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  summaryGridItem: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  gridNumber: {
    fontFamily: fonts.uiBold,
    fontSize: 16,
    color: colors.navy,
  },
  gridLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statsCardList: {
    gap: spacing.sm,
  },
  statMetricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  statIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.navyTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTexts: {
    flex: 1,
    gap: 2,
  },
  statTitle: {
    fontFamily: fonts.uiBold,
    fontSize: 14,
    color: colors.navy,
  },
  statMeta: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
  statHighlight: {
    fontFamily: fonts.uiBold,
    fontSize: 16,
    color: colors.navy,
  },
  sessionList: {
    gap: spacing.sm,
  },
  sessionItem: {
    minHeight: touchTarget,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.control,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
  },
  sessionItemCompleted: {
    borderColor: '#BBE3DB',
    backgroundColor: colors.tealTint,
  },
  sessionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  sessionTitle: {
    fontFamily: fonts.uiMedium,
    fontSize: 14,
    color: colors.navy,
  },
  sessionTitleCompleted: {
    fontFamily: fonts.uiBold,
    color: colors.teal,
  },
  sessionStatusText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
  sessionStatusCompleted: {
    fontFamily: fonts.uiBold,
    color: colors.teal,
  },
  closeButton: {
    minHeight: touchTarget,
    backgroundColor: colors.navy,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  closeButtonPressed: {
    opacity: 0.9,
  },
  closeButtonText: {
    fontFamily: fonts.uiBold,
    fontSize: 15,
    color: colors.surface,
  },
});
