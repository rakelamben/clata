import RemixIcon from 'react-native-remix-icon';
import { StyleSheet, Text, View } from 'react-native';

import { AppPressable } from '../../../ui/AppPressable';
import { colors, fonts, radii, spacing, touchTarget } from '../../../ui/theme';

export function DictionarySkeleton() {
  return (
    <View style={styles.dictionarySkeletonCard} aria-hidden={true} accessible={false}>
      <View style={styles.dictionarySkeletonTop}>
        <View style={styles.dictionarySkeletonLemma} />
        <View style={styles.dictionarySkeletonAudio} />
      </View>
      <View style={styles.dictionarySkeletonPronunciation} />
      <View style={styles.dictionarySkeletonMeaning} />
      <View style={styles.dictionarySkeletonRegister} />
    </View>
  );
}

export function WordSkeleton({ slideHeight }: { slideHeight?: number }) {
  return (
    <View
      style={[styles.skeletonSlide, slideHeight ? { height: slideHeight } : null]}
      aria-hidden={true}
      accessible={false}
    >
      <View style={styles.skeletonContent}>
        <View style={styles.skeletonWord} />
        <View style={styles.skeletonPill} />
        <View style={styles.skeletonMeaning} />
        <View style={styles.skeletonCircle} />
      </View>
    </View>
  );
}

export function VocabularyLoading({ slideHeight }: { slideHeight?: number }) {
  return (
    <View
      style={styles.loadingContainer}
      accessibilityRole="text"
      accessibilityLabel="Memuat daftar kata"
    >
      <WordSkeleton slideHeight={slideHeight} />
    </View>
  );
}

export function DictionaryLoadingList() {
  return (
    <View
      style={styles.dictionaryLoadingList}
      accessibilityRole="text"
      accessibilityLabel="Memuat kamus"
    >
      <DictionarySkeleton />
      <DictionarySkeleton />
      <DictionarySkeleton />
    </View>
  );
}

export function VocabularyEmpty({
  title = 'Belum ada kata yang cocok.',
  message = 'Coba ubah kata kunci atau bersihkan filter pencarian.',
}: {
  title?: string;
  message?: string;
}) {
  return (
    <View style={styles.statePanel} accessibilityLabel={title}>
      <View style={styles.iconCircle}>
        <RemixIcon name="book-open-line" size={32} color={colors.textSecondary} accessible={false} />
      </View>
      <Text accessibilityRole="header" style={styles.stateTitle}>
        {title}
      </Text>
      <Text style={styles.stateMessage}>{message}</Text>
    </View>
  );
}

export function VocabularyError({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.statePanel} accessibilityRole="alert">
      <View style={[styles.iconCircle, styles.errorCircle]}>
        <RemixIcon name="refresh-line" size={32} color={colors.primary} accessible={false} />
      </View>
      <Text accessibilityRole="header" style={styles.stateTitle}>
        Daftar kata belum siap.
      </Text>
      <Text style={styles.stateMessage}>
        Terjadi kendala saat membuka koleksi di perangkat ini.
      </Text>
      <AppPressable
        accessibilityRole="button"
        accessibilityLabel="Coba lagi memuat kata"
        onPress={onRetry}
        style={styles.retryButton}
      >
        <RemixIcon name="refresh-line" size={18} color={colors.surface} accessible={false} />
        <Text style={styles.retryButtonText}>Coba lagi</Text>
      </AppPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  skeletonSlide: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  skeletonContent: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  skeletonWord: {
    width: '65%',
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.navyTint,
  },
  skeletonPill: {
    width: 120,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.navyTint,
  },
  skeletonMeaning: {
    width: '75%',
    height: 26,
    borderRadius: 8,
    backgroundColor: colors.navyTint,
  },
  skeletonCircle: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: touchTarget / 2,
    backgroundColor: colors.navyTint,
  },
  dictionaryLoadingList: {
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  dictionarySkeletonCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  dictionarySkeletonTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dictionarySkeletonLemma: {
    width: 140,
    height: 24,
    borderRadius: 6,
    backgroundColor: colors.navyTint,
  },
  dictionarySkeletonAudio: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: touchTarget / 2,
    backgroundColor: colors.navyTint,
  },
  dictionarySkeletonPronunciation: {
    width: 80,
    height: 14,
    borderRadius: 4,
    backgroundColor: colors.navyTint,
  },
  dictionarySkeletonMeaning: {
    width: '80%',
    height: 18,
    borderRadius: 6,
    backgroundColor: colors.navyTint,
  },
  dictionarySkeletonRegister: {
    width: 100,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.navyTint,
  },
  statePanel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.navyTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  errorCircle: {
    backgroundColor: colors.magentaTint,
  },
  stateTitle: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.navy,
    textAlign: 'center',
  },
  stateMessage: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.control,
    minHeight: touchTarget,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
  },
  retryButtonText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 15,
    color: colors.surface,
  },
});
