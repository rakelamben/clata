import RemixIcon from 'react-native-remix-icon';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  findNodeHandle,
  useWindowDimensions,
  type TextInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppPressable } from '../../../ui/AppPressable';
import { colors, fonts, radii, spacing } from '../../../ui/theme';
import {
  MONTH_NAMES,
  MONTH_SHORT_NAMES,
  formatBirthDate,
} from './onboardingForm';

const ROW_HEIGHT = 52;
const MAX_LIST_ROWS = 5;
const MIN_LIST_ROWS = 3;
const YEARS_BACK = 120;

type BirthDatePickerProps = {
  value: Date | null;
  currentYear: number;
  reduceMotion: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
};

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function clampListHeight(screenHeight: number): number {
  const targetRows = Math.round((screenHeight * 0.3) / ROW_HEIGHT);
  const rows = Math.min(MAX_LIST_ROWS, Math.max(MIN_LIST_ROWS, targetRows));
  return rows * ROW_HEIGHT;
}

/**
 * A local, dependency-free birth-date picker. The year column is intentionally
 * required before confirmation: the age gate must never be satisfied by a
 * silent default. Month and day complete the date for display and future use,
 * while the domain currently stores only the birth year.
 */
export function BirthDatePicker({
  value,
  currentYear,
  reduceMotion,
  onClose,
  onConfirm,
}: BirthDatePickerProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const listHeight = clampListHeight(height);
  const titleRef = useRef<TextInstance>(null);

  const initial = value ?? new Date(currentYear - 20, 0, 1);
  const [selectedYear, setSelectedYear] = useState(initial.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(initial.getMonth());
  const [selectedDay, setSelectedDay] = useState(initial.getDate());
  const [yearChosen, setYearChosen] = useState(value !== null);

  const years = Array.from({ length: YEARS_BACK + 1 }, (_, index) => currentYear - index);
  const dayCount = daysInMonth(selectedYear, selectedMonth);
  const days = Array.from({ length: dayCount }, (_, index) => index + 1);

  useEffect(() => {
    const timer = setTimeout(() => {
      const node = findNodeHandle(titleRef.current);
      if (node) AccessibilityInfo.setAccessibilityFocus(node);
    }, reduceMotion ? 0 : 300);
    return () => clearTimeout(timer);
  }, [reduceMotion]);

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setYearChosen(true);
    setSelectedDay((day) => Math.min(day, daysInMonth(year, selectedMonth)));
  };

  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
    setSelectedDay((day) => Math.min(day, daysInMonth(selectedYear, month)));
  };

  const handleDayChange = (day: number) => {
    setSelectedDay(day);
  };

  const preview = yearChosen
    ? formatBirthDate(new Date(selectedYear, selectedMonth, selectedDay))
    : 'Pilih tahun lahirmu';
  const initialYearIndex = Math.max(
    0,
    Math.min(YEARS_BACK, currentYear - initial.getFullYear()),
  );

  return (
    <Modal
      animationType={reduceMotion ? 'none' : 'slide'}
      onRequestClose={onClose}
      transparent
      visible
    >
      <View style={styles.modalRoot}>
        <Pressable
          accessible={false}
          focusable={false}
          importantForAccessibility="no"
          onPress={onClose}
          style={styles.scrim}
        />

        <View
          accessibilityViewIsModal
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text
              accessibilityRole="header"
              maxFontSizeMultiplier={2}
              ref={titleRef}
              style={styles.title}
            >
              Tanggal lahir
            </Text>
            <AppPressable
              accessibilityLabel="Tutup pemilih tanggal"
              accessibilityRole="button"
              onPress={onClose}
              ringRadius={24}
              style={styles.closeButton}
            >
              <RemixIcon name="close-line" size={24} color={colors.navy} accessible={false} />
            </AppPressable>
          </View>

          <View style={styles.preview}>
            <Text
              accessibilityLiveRegion="polite"
              maxFontSizeMultiplier={2}
              style={[styles.previewText, !yearChosen && styles.previewPlaceholder]}
            >
              {preview}
            </Text>
          </View>

          <View style={styles.columns}>
            <PickerColumn
              accessibilityLabel="Daftar tahun"
              data={years}
              extraData={`${selectedYear}-${yearChosen}`}
              initialScrollIndex={initialYearIndex}
              label="Tahun"
              listHeight={listHeight}
              onSelect={handleYearChange}
              selectedValue={yearChosen ? selectedYear : null}
              toAccessibilityLabel={(year) => `Tahun ${year}`}
              toDisplayLabel={(year) => String(year)}
            />
            <PickerColumn
              accessibilityLabel="Daftar bulan"
              data={MONTH_SHORT_NAMES.map((_, index) => index)}
              extraData={selectedMonth}
              initialScrollIndex={selectedMonth}
              label="Bulan"
              listHeight={listHeight}
              onSelect={handleMonthChange}
              selectedValue={selectedMonth}
              toAccessibilityLabel={(month) => `Bulan ${MONTH_NAMES[month]}`}
              toDisplayLabel={(month) => MONTH_SHORT_NAMES[month]}
            />
            <PickerColumn
              accessibilityLabel="Daftar tanggal"
              data={days}
              extraData={selectedDay}
              initialScrollIndex={Math.max(0, Math.min(selectedDay - 1, dayCount - 1))}
              key={`day-${selectedYear}-${selectedMonth}`}
              label="Tanggal"
              listHeight={listHeight}
              onSelect={handleDayChange}
              selectedValue={selectedDay}
              toAccessibilityLabel={(day) => `Tanggal ${day}`}
              toDisplayLabel={(day) => String(day)}
            />
          </View>

          <View style={styles.footer}>
            <AppPressable
              accessibilityLabel="Batal memilih tanggal"
              accessibilityRole="button"
              containerStyle={styles.footerButton}
              onPress={onClose}
              ringRadius={radii.control}
              style={styles.cancelButton}
            >
              <Text maxFontSizeMultiplier={2} style={styles.cancelLabel}>
                Batal
              </Text>
            </AppPressable>
            <AppPressable
              accessibilityLabel="Pilih tanggal lahir"
              accessibilityRole="button"
              accessibilityState={{ disabled: !yearChosen }}
              containerStyle={styles.footerButton}
              disabled={!yearChosen}
              onPress={() => onConfirm(new Date(selectedYear, selectedMonth, selectedDay))}
              ringRadius={radii.control}
              style={({ pressed }) => [
                styles.confirmButton,
                !yearChosen && styles.confirmButtonDisabled,
                pressed && yearChosen && styles.confirmButtonPressed,
              ]}
            >
              <Text
                maxFontSizeMultiplier={2}
                style={[styles.confirmLabel, !yearChosen && styles.confirmLabelDisabled]}
              >
                Pilih
              </Text>
            </AppPressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

type PickerColumnProps = {
  accessibilityLabel: string;
  data: readonly number[];
  extraData: unknown;
  initialScrollIndex: number;
  label: string;
  listHeight: number;
  onSelect: (value: number) => void;
  selectedValue: number | null;
  toAccessibilityLabel: (value: number) => string;
  toDisplayLabel: (value: number) => string;
};

function PickerColumn({
  accessibilityLabel,
  data,
  extraData,
  initialScrollIndex,
  label,
  listHeight,
  onSelect,
  selectedValue,
  toAccessibilityLabel,
  toDisplayLabel,
}: PickerColumnProps) {
  return (
    <View style={styles.column}>
      <Text maxFontSizeMultiplier={2} style={styles.columnLabel}>
        {label}
      </Text>
      <View style={[styles.listFrame, { height: listHeight }]}>
        <FlatList
          accessibilityLabel={accessibilityLabel}
          data={data}
          extraData={extraData}
          getItemLayout={(_, index) => ({
            index,
            length: ROW_HEIGHT,
            offset: ROW_HEIGHT * index,
          })}
          initialScrollIndex={initialScrollIndex}
          keyExtractor={(item) => String(item)}
          renderItem={({ item }) => {
            const selected = item === selectedValue;
            return (
              <AppPressable
                accessibilityLabel={toAccessibilityLabel(item)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                containerStyle={styles.rowContainer}
                onPress={() => onSelect(item)}
                ringRadius={8}
                style={[styles.row, selected && styles.rowSelected]}
              >
                <Text
                  maxFontSizeMultiplier={2}
                  style={[styles.rowLabel, selected && styles.rowLabelSelected]}
                >
                  {toDisplayLabel(item)}
                </Text>
              </AppPressable>
            );
          }}
          showsVerticalScrollIndicator={false}
          style={{ height: listHeight }}
          windowSize={5}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.scrim,
  },
  sheet: {
    width: '100%',
    maxWidth: 544,
    maxHeight: '92%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: spacing.sm,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.surface,
  },
  handle: {
    width: 40,
    height: 4,
    alignSelf: 'center',
    marginBottom: spacing.md,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    color: colors.navy,
    fontFamily: fonts.display,
    fontSize: 24,
    letterSpacing: -0.4,
    lineHeight: 30,
  },
  closeButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  preview: {
    minHeight: 44,
    marginTop: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.control,
    backgroundColor: colors.navyTint,
  },
  previewText: {
    color: colors.navy,
    fontFamily: fonts.uiSemiBold,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  previewPlaceholder: {
    color: colors.textSecondary,
    fontFamily: fonts.uiMedium,
  },
  columns: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  column: {
    flex: 1,
    gap: 6,
  },
  columnLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.uiMedium,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  listFrame: {
    borderRadius: radii.card,
    backgroundColor: colors.navyTint,
  },
  rowContainer: {
    paddingHorizontal: 4,
  },
  row: {
    height: ROW_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  rowSelected: {
    backgroundColor: colors.navy,
  },
  rowLabel: {
    color: colors.navy,
    fontFamily: fonts.uiMedium,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  rowLabelSelected: {
    color: colors.surface,
    fontFamily: fonts.uiSemiBold,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  footerButton: {
    flex: 1,
  },
  cancelButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.control,
    backgroundColor: colors.surface,
  },
  cancelLabel: {
    color: colors.navy,
    fontFamily: fonts.uiMedium,
    fontSize: 16,
    lineHeight: 22,
  },
  confirmButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radii.control,
    backgroundColor: colors.primary,
  },
  confirmButtonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  confirmButtonDisabled: {
    backgroundColor: colors.border,
  },
  confirmLabel: {
    color: colors.surface,
    fontFamily: fonts.uiSemiBold,
    fontSize: 16,
    lineHeight: 22,
  },
  confirmLabelDisabled: {
    color: colors.textSecondary,
  },
});
