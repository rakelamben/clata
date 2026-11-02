import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-remix-icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { InstalledPackageDbRecord } from '../../../infrastructure/database/databaseTypes';
import { pickLocalPackageFile } from '../../../infrastructure/device/filePicker';
import { useApp } from '../../../context/AppContext';
import { colors, fonts, radii, spacing, touchTarget } from '../../../ui/theme';

export interface PackageSwitchSheetProps {
  visible: boolean;
  onClose: () => void;
  activePackageId: string | null;
  onSelectPackage: (packageId: string) => Promise<void>;
}

export function PackageSwitchSheet({
  visible,
  onClose,
  activePackageId,
  onSelectPackage,
}: PackageSwitchSheetProps) {
  const insets = useSafeAreaInsets();
  const { installedPackages, setStagedArchive, installStagedPackage } = useApp();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSelect = async (pkgId: string) => {
    if (pkgId === activePackageId) {
      onClose();
      return;
    }
    try {
      setLoadingAction(`Beralih ke ${pkgId}...`);
      await onSelectPackage(pkgId);
      onClose();
    } catch (err) {
      setErrorMessage(`Gagal beralih paket: ${String(err)}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePickNewPackage = async () => {
    try {
      setErrorMessage(null);
      const picked = await pickLocalPackageFile();
      if (!picked) return;

      setLoadingAction('Memasang paket bahasa...');
      const pickedArchive = {
        buffer: picked.buffer,
        fileName: picked.name,
        sizeBytes: picked.sizeBytes,
      };
      setStagedArchive(pickedArchive);

      const res = await installStagedPackage(pickedArchive);
      if (res.ok) {
        onClose();
      } else {
        setErrorMessage(res.message || 'Gagal memasang paket bahasa.');
      }
    } catch (err) {
      setErrorMessage(`Gagal mengimpor berkas: ${String(err)}`);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.sheetOverlay}>
        <Pressable
          accessibilityLabel="Tutup dialog pilih paket"
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
          {/* Top Handle */}
          <View style={styles.handleWrapper}>
            <View style={styles.handleBar} />
          </View>

          {/* Judul & Header */}
          <View style={styles.header}>
            <Text style={styles.sheetTitle}>Pilih Paket Bahasa</Text>
            <Text style={styles.sheetSubtitle}>
              Pilih paket yang sudah terpasang atau pasang paket baru (.clata)
            </Text>
          </View>

          {/* Pesan Kesalahan jika ada */}
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Icon color={colors.magenta} name="error-warning-line" size={16} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Loading Indicator saat berganti / memasang */}
          {loadingAction ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.primary} size="small" />
              <Text style={styles.loadingText}>{loadingAction}</Text>
            </View>
          ) : null}

          {/* Daftar Paket */}
          <ScrollView
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {installedPackages.map((pkg: InstalledPackageDbRecord) => {
              const isActive = pkg.package_id === activePackageId;
              const rawTitle = pkg.title && pkg.title.trim().length > 0 ? pkg.title : pkg.package_id;
              const title = rawTitle
                .split('-')
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');

              return (
                <Pressable
                  key={pkg.package_id}
                  accessibilityLabel={`Pilih paket ${title}. ${isActive ? 'Sedang aktif.' : ''}`}
                  accessibilityRole="button"
                  onPress={() => void handleSelect(pkg.package_id)}
                  style={({ pressed }) => [
                    styles.packageCard,
                    isActive && styles.packageCardActive,
                    pressed && styles.packageCardPressed,
                  ]}
                >
                  <View style={styles.packageCardLeft}>
                    <View
                      style={[
                        styles.packageIconBg,
                        isActive && styles.packageIconBgActive,
                      ]}
                    >
                      <Icon
                        color={isActive ? colors.teal : colors.navy}
                        name="translate-2"
                        size={20}
                      />
                    </View>

                    <View style={styles.packageInfo}>
                      <Text
                        style={[
                          styles.packageTitle,
                          isActive && styles.packageTitleActive,
                        ]}
                      >
                        {title}
                      </Text>
                      <Text style={styles.packageMeta}>
                        Versi {pkg.package_version} • Dialek {pkg.dialect_id}
                      </Text>
                    </View>
                  </View>

                  {isActive ? (
                    <View style={styles.activeCheck}>
                      <Icon color={colors.teal} name="check-line" size={20} />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Tombol Impor Paket Baru */}
          <Pressable
            accessibilityLabel="Pasang paket bahasa baru dari berkas clata"
            accessibilityRole="button"
            onPress={() => void handlePickNewPackage()}
            style={({ pressed }) => [
              styles.importButton,
              pressed && styles.importButtonPressed,
            ]}
          >
            <Icon color={colors.primary} name="folder-add-line" size={20} />
            <Text style={styles.importButtonText}>
              Pasang Paket Baru (.clata)
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
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
    maxHeight: '80%',
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.magentaTint,
    borderRadius: radii.control,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.magenta,
    flex: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  loadingText: {
    fontFamily: fonts.uiMedium,
    fontSize: 13,
    color: colors.navy,
  },
  listContent: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  packageCard: {
    minHeight: touchTarget + 4,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  packageCardActive: {
    borderColor: '#BBE3DB',
    backgroundColor: colors.tealTint,
  },
  packageCardPressed: {
    backgroundColor: '#F8F9FA',
  },
  packageCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  packageIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.navyTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packageIconBgActive: {
    backgroundColor: '#CEE8E4',
  },
  packageInfo: {
    flex: 1,
    gap: 2,
  },
  packageTitle: {
    fontFamily: fonts.uiBold,
    fontSize: 15,
    color: colors.navy,
  },
  packageTitleActive: {
    color: colors.teal,
  },
  packageMeta: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
  activeCheck: {
    paddingLeft: spacing.sm,
  },
  importButton: {
    minHeight: touchTarget,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    borderRadius: radii.control,
    backgroundColor: colors.orangeTint,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  importButtonPressed: {
    opacity: 0.8,
  },
  importButtonText: {
    fontFamily: fonts.uiBold,
    fontSize: 14,
    color: colors.primary,
  },
});
