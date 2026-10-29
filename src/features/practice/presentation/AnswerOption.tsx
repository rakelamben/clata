import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radii, spacing } from '../../../ui/theme';

export function AnswerOption({ label, selected, disabled, onPress }: { label: string; selected: boolean; disabled?: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="radio" accessibilityState={{ selected, disabled }} disabled={disabled} onPress={onPress} style={[styles.option, selected && styles.selected]}><Text style={styles.label}>{selected ? '✓ ' : ''}{label}</Text></Pressable>;
}
const styles = StyleSheet.create({ option: { minHeight: 48, justifyContent: 'center', padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radii.card, backgroundColor: colors.surface }, selected: { borderColor: colors.navy, backgroundColor: colors.navyTint }, label: { color: colors.textPrimary, fontSize: 16 } });
