import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-remix-icon';

import { useApp } from '../../context/AppContext';
import { pickLocalPackageFile, type PickedPackageFile } from '../../infrastructure/device/filePicker';
import { AppPressable } from '../../ui/AppPressable';
import { colors, fonts, radii, spacing, touchTarget } from '../../ui/theme';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export default function SelectPackageScreen() {
  const { stagedArchive, setStagedArchive } = useApp();
  const [selectedFile, setSelectedFile] = useState<PickedPackageFile | null>(
    stagedArchive
      ? {
          name: stagedArchive.fileName,
          sizeBytes: stagedArchive.sizeBytes,
          buffer: stagedArchive.buffer,
        }
      : null,
  );
  const [isPicking, setIsPicking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleBack = () => {
    router.back();
  };

  const handlePickFile = async () => {
    try {
      setIsPicking(true);
      setErrorMessage(null);
      const picked = await pickLocalPackageFile();
      if (picked) {
        setSelectedFile(picked);
        setStagedArchive({
          buffer: picked.buffer,
          fileName: picked.name,
          sizeBytes: picked.sizeBytes,
        });
      }
    } catch (err) {
      setErrorMessage(`Gagal memilih berkas: ${String(err)}`);
    } finally {
      setIsPicking(false);
    }
  };

  const handleProceed = () => {
    if (!selectedFile) return;
    setStagedArchive({
      buffer: selectedFile.buffer,
      fileName: selectedFile.name,
      sizeBytes: selectedFile.sizeBytes,
    });
    router.push('/onboarding/preparing');
  };

  const canProceed = Boolean(selectedFile);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <AppPressable
            accessibilityLabel="Kembali ke halaman sebelumnya"
            accessibilityRole="button"
            onPress={handleBack}
            style={styles.backButton}
          >
            <Icon color={colors.navy} name="arrow-left-line" size={24} />
          </AppPressable>

          <Text accessibilityRole="header" style={styles.title}>
            Unggah Paket Bahasa
          </Text>

          <Text style={styles.description}>
            Pilih berkas paket bahasa (.clata atau .zip) dari penyimpanan perangkatmu untuk
            menyiapkan ruang belajar lokal.
          </Text>
        </View>

        <View style={styles.centerSection}>
          {!selectedFile ? (
            <View style={styles.dropzone}>
              <View style={styles.iconCircle}>
                <Icon color={colors.primary} name="folder-zip-line" size={44} />
              </View>

              <Text style={styles.dropzoneTitle}>Pilih Berkas .clata / .zip</Text>
              <Text style={styles.dropzoneSubtitle}>
                Mendukung arsip resmi .clata atau .zip (maks. 10 MB)
              </Text>

              <AppPressable
                accessibilityLabel="Buka pengelola berkas perangkat"
                accessibilityRole="button"
                disabled={isPicking}
                onPress={() => void handlePickFile()}
                style={styles.browseButton}
              >
                {isPicking ? (
                  <ActivityIndicator color={colors.teal} size="small" />
                ) : (
                  <>
                    <Icon color={colors.teal} name="folder-open-line" size={20} />
                    <Text style={styles.browseButtonText}>Buka File Manager</Text>
                  </>
                )}
              </AppPressable>
            </View>
          ) : (
            <View style={styles.selectedCard}>
              <View style={styles.selectedRow}>
                <View style={styles.selectedIconBox}>
                  <Icon color={colors.primary} name="file-check-fill" size={32} />
                </View>

                <View style={styles.selectedInfo}>
                  <Text numberOfLines={1} style={styles.selectedFileName}>
                    {selectedFile.name}
                  </Text>
                  <Text style={styles.selectedMeta}>
                    {formatBytes(selectedFile.sizeBytes)} • Format didukung
                  </Text>
                </View>

                <AppPressable
                  accessibilityLabel="Ganti berkas paket bahasa"
                  accessibilityRole="button"
                  onPress={() => void handlePickFile()}
                  style={styles.changeButton}
                >
                  <Text style={styles.changeButtonText}>Ganti</Text>
                </AppPressable>
              </View>
            </View>
          )}

          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Icon color={colors.magenta} name="error-warning-fill" size={20} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.actionSection}>
          <AppPressable
            accessibilityLabel="Pasang paket bahasa terpilih"
            accessibilityRole="button"
            disabled={!canProceed}
            onPress={handleProceed}
          >
            <View style={[styles.primaryButton, !canProceed && styles.primaryButtonDisabled]}>
              <Text style={[styles.primaryButtonText, !canProceed && styles.primaryButtonTextDisabled]}>
                Pasang Paket Bahasa
              </Text>
              <Icon
                color={canProceed ? colors.surface : colors.borderStrong}
                name="arrow-right-line"
                size={20}
              />
            </View>
          </AppPressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  header: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  backButton: {
    width: touchTarget,
    height: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.xs,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 36,
    color: colors.navy,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  dropzone: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radii.sheet,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: radii.sheet,
    backgroundColor: colors.magentaTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  dropzoneTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    color: colors.navy,
  },
  dropzoneSubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  browseButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.teal,
    borderRadius: radii.control,
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  browseButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.teal,
  },
  selectedCard: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radii.sheet,
    padding: spacing.lg,
  },
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  selectedIconBox: {
    width: 44,
    height: 44,
    borderRadius: radii.control,
    backgroundColor: colors.magentaTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedInfo: {
    flex: 1,
    gap: 2,
  },
  selectedFileName: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  selectedMeta: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.teal,
  },
  changeButton: {
    minHeight: touchTarget,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.primary,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.magentaTint,
    borderWidth: 1,
    borderColor: colors.magenta,
    borderRadius: radii.card,
    padding: spacing.md,
  },
  errorText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.magenta,
    lineHeight: 18,
  },
  actionSection: {
    paddingTop: spacing.md,
  },
  primaryButton: {
    minHeight: touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.control,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  primaryButtonDisabled: {
    backgroundColor: colors.border,
  },
  primaryButtonText: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.surface,
  },
  primaryButtonTextDisabled: {
    color: colors.borderStrong,
  },
});
