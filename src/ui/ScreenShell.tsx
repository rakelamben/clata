import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, spacing } from './theme';

type ScreenShellProps = PropsWithChildren<{ title: string; description?: string }>;

export function ScreenShell({ title, description, children }: ScreenShellProps) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingTop: Math.max(insets.top, spacing.lg), paddingBottom: insets.bottom + spacing.xxxl },
      ]}
      accessibilityLabel={title}
    >
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      <View style={styles.body}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: 20, backgroundColor: colors.background },
  title: {
    color: colors.navy,
    fontSize: 32,
    fontFamily: fonts.display,
    letterSpacing: -0.5,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: fonts.body,
    marginTop: spacing.sm,
  },
  body: { marginTop: spacing.xl, gap: spacing.lg },
});

