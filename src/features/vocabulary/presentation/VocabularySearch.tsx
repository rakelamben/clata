import RemixIcon from 'react-native-remix-icon';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppPressable } from '../../../ui/AppPressable';
import { colors, fonts, radii, spacing, touchTarget } from '../../../ui/theme';

export function VocabularySearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.container}>
      <RemixIcon name="search-line" size={20} color={colors.textSecondary} accessible={false} />
      <TextInput
        accessibilityLabel="Cari kata atau arti"
        placeholder="Cari kata atau arti..."
        placeholderTextColor={colors.borderStrong}
        value={value}
        onChangeText={onChange}
        style={styles.input}
      />
      {value.length > 0 ? (
        <AppPressable
          accessibilityRole="button"
          accessibilityLabel="Hapus pencarian"
          onPress={() => onChange('')}
          style={styles.clearButton}
        >
          <RemixIcon name="close-circle-fill" size={18} color={colors.borderStrong} accessible={false} />
        </AppPressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.control,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  clearButton: {
    padding: spacing.xs,
  },
});
