import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../../ui/theme';

export function PracticeLoading() { return <ActivityIndicator accessibilityLabel="Memuat latihan" color={colors.primary} />; }
export function PracticeError({ message, onRetry }: { message: string; onRetry?: () => void }) { return <View><Text accessibilityRole="alert" style={styles.error}>{message}</Text>{onRetry ? <Pressable accessibilityRole="button" onPress={onRetry}><Text style={styles.action}>Coba lagi</Text></Pressable> : null}</View>; }
export function PracticeEmpty({ message }: { message: string }) { return <Text style={styles.empty}>{message}</Text>; }
const styles = StyleSheet.create({ error: { color: colors.magenta, fontSize: 16, marginVertical: spacing.md }, empty: { color: colors.textSecondary, fontSize: 16, marginVertical: spacing.md }, action: { color: colors.primary, fontWeight: '700', paddingVertical: spacing.sm } });
