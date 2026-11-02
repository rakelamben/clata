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

import { AppPressable } from '../../../ui/AppPressable';
import { colors, fonts, radii, spacing, touchTarget } from '../../../ui/theme';

export interface DropdownOption<T> {
  label: string;
  value: T;
}

export interface DropdownPickerModalProps<T> {
  visible: boolean;
  title: string;
  options: DropdownOption<T>[];
  selectedValue: T;
  onSelect: (value: T) => void;
  onClose: () => void;
}

export function DropdownPickerModal<T>({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}: DropdownPickerModalProps<T>) {
  if (!visible) return null;

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        {/* Backdrop untuk menutup */}
        <Pressable
          accessibilityLabel="Tutup pilihan"
          accessibilityRole="button"
          onPress={onClose}
          style={styles.backdrop}
        />

        {/* Modal Card */}
        <View style={styles.cardContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.titleText}>{title}</Text>
            <AppPressable
              accessibilityLabel="Tutup"
              accessibilityRole="button"
              onPress={onClose}
              style={styles.closeButton}
            >
              <Icon color={colors.navy} name="close-line" size={20} />
            </AppPressable>
          </View>

          <View style={styles.divider} />

          <ScrollView style={styles.optionsScroll}>
            {options.map((option, idx) => {
              const isSelected = option.value === selectedValue;
              return (
                <AppPressable
                  accessibilityLabel={option.label}
                  accessibilityRole="button"
                  key={`opt_${idx}`}
                  onPress={() => {
                    onSelect(option.value);
                    onClose();
                  }}
                  style={[
                    styles.optionRow,
                    isSelected && styles.optionRowSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionLabel,
                      isSelected && styles.optionLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {isSelected && (
                    <Icon color={colors.teal} name="check-line" size={18} />
                  )}
                </AppPressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '70%',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.xs,
  },
  titleText: {
    fontFamily: fonts.uiBold,
    fontSize: 16,
    color: colors.navy,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  optionsScroll: {
    marginTop: spacing.xs,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: touchTarget - 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.control,
    marginVertical: 2,
  },
  optionRowSelected: {
    backgroundColor: colors.tealTint,
  },
  optionLabel: {
    fontFamily: fonts.uiMedium,
    fontSize: 14,
    color: colors.navy,
  },
  optionLabelSelected: {
    fontFamily: fonts.uiBold,
    color: colors.teal,
  },
});
