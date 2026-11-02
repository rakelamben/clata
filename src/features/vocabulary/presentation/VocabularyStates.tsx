import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-remix-icon';

import { AppPressable } from '../../../ui/AppPressable';
import { colors, fonts, radii, spacing, touchTarget } from '../../../ui/theme';

export function VocabularyLoading() {
  return (
    <View style={styles.centerContainer}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.loadingText}>Menyiapkan kosakata...</Text>
    </View>
  );
}

interface VocabularyEmptyProps {
  onUploadPackage?: () => void;
}

export function VocabularyEmpty({ onUploadPackage }: VocabularyEmptyProps) {
  return (
    <View style={styles.centerContainer}>
      <View style={styles.emptyIconCircle}>
        <Icon color={colors.textSecondary} name="book-read-line" size={36} />
      </View>
      <Text style={styles.emptyTitle}>Belum Ada Kosakata</Text>
      <Text style={styles.emptyDescription}>
        Paket bahasa yang aktif belum memiliki konten kosakata atau belum dimuat.
      </Text>

      {onUploadPackage ? (
        <AppPressable
          accessibilityLabel="Unggah berkas paket bahasa"
          accessibilityRole="button"
          onPress={onUploadPackage}
          style={styles.uploadButton}
        >
          <Icon color={colors.surface} name="folder-upload-line" size={18} />
          <Text style={styles.uploadButtonText}>Pilih Berkas .clata</Text>
        </AppPressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  loadingText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.navyTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.navy,
    textAlign: 'center',
  },
  emptyDescription: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radii.control,
    minHeight: touchTarget,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
  },
  uploadButtonText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.surface,
  },
});
