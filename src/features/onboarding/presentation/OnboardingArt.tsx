import RemixIcon, { type IconName } from 'react-native-remix-icon';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, spacing } from '../../../ui/theme';

export type ArtMode = 'intro' | 'local' | 'age' | 'preparing' | 'ready' | 'failed' | 'blocked';

type Props = {
  mode: ArtMode;
  compact: boolean;
};

type LocalArtConfig = {
  icon: IconName;
  badge: 'check' | 'alert' | null;
  caption: string;
  iconColor: string;
};

const LOCAL_ART: Record<Exclude<ArtMode, 'intro'>, LocalArtConfig> = {
  local: {
    icon: 'database-2-line',
    badge: 'check',
    caption: 'Tersimpan dekat. Di perangkatmu.',
    iconColor: colors.navy,
  },
  age: {
    icon: 'shield-check-line',
    badge: 'check',
    caption: 'Ruang belajar yang aman untukmu.',
    iconColor: colors.navy,
  },
  preparing: {
    icon: 'book-open-line',
    badge: null,
    caption: 'Menyiapkan ruang belajar.',
    iconColor: colors.navy,
  },
  ready: {
    icon: 'book-open-line',
    badge: 'check',
    caption: 'Ruang belajar siap.',
    iconColor: colors.navy,
  },
  failed: {
    icon: 'error-warning-line',
    badge: 'alert',
    caption: 'Persiapan belum selesai.',
    iconColor: colors.magenta,
  },
  blocked: {
    icon: 'time-line',
    badge: null,
    caption: 'Sampai bertemu lagi.',
    iconColor: colors.navy,
  },
};

/**
 * Editorial onboarding illustration. It is intentionally hidden from the
 * accessibility tree: every message it carries is repeated in the heading,
 * description and status list. Decorative type does not scale so the rotated
 * paper composition cannot clip, while all meaningful copy does.
 */
export function OnboardingArt({ mode, compact }: Props) {
  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[styles.art, compact && styles.artCompact]}
    >
      {mode === 'intro' ? <IntroArt compact={compact} /> : <LocalArt mode={mode} compact={compact} />}
    </View>
  );
}

function IntroArt({ compact }: { compact: boolean }) {
  return (
    <View style={[styles.stack, compact && styles.stackCompact]}>
      <View style={[styles.paper, styles.paperBack]}>
        <Text allowFontScaling={false} numberOfLines={1} style={styles.kickerBack}>
          JAWA · MATARAMAN
        </Text>
        <Text allowFontScaling={false} numberOfLines={1} style={styles.paperWordBack}>
          monggo
        </Text>
        <Text allowFontScaling={false} numberOfLines={1} style={styles.paperMeaningBack}>
          silakan
        </Text>
      </View>

      <View style={[styles.paper, styles.paperFront]}>
        <RemixIcon name="book-open-line" size={24} color={colors.surface} accessible={false} />
        <Text allowFontScaling={false} numberOfLines={1} style={styles.kickerFront}>
          KATA PERTAMAMU
        </Text>
        <Text allowFontScaling={false} numberOfLines={1} style={styles.paperWordFront}>
          sugeng
        </Text>
        <Text allowFontScaling={false} numberOfLines={1} style={styles.paperMeaningFront}>
          selamat
        </Text>
      </View>
    </View>
  );
}

function LocalArt({ mode, compact }: { mode: Exclude<ArtMode, 'intro'>; compact: boolean }) {
  const config = LOCAL_ART[mode];

  return (
    <View style={styles.localArt}>
      <View style={[styles.ring, compact && styles.ringCompact]}>
        <View style={[styles.symbol, compact && styles.symbolCompact]}>
          <RemixIcon
            name={config.icon}
            size={compact ? 36 : 48}
            color={config.iconColor}
            accessible={false}
          />
        </View>
        {config.badge ? (
          <View
            style={[
              styles.badge,
              config.badge === 'alert' && styles.badgeAlert,
              compact && styles.badgeCompact,
            ]}
          >
            <RemixIcon
              name={config.badge === 'check' ? 'check-line' : 'error-warning-line'}
              size={compact ? 14 : 18}
              color={colors.surface}
              accessible={false}
            />
          </View>
        ) : null}
      </View>
      {compact ? null : <Text style={styles.caption}>{config.caption}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  art: {
    minHeight: 268,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: spacing.md,
  },
  artCompact: {
    minHeight: 208,
    paddingVertical: spacing.sm,
  },
  stack: {
    width: '100%',
    maxWidth: 352,
    height: 260,
  },
  stackCompact: {
    height: 216,
    transform: [{ scale: 0.82 }],
  },
  paper: {
    position: 'absolute',
    width: 184,
    minHeight: 180,
    justifyContent: 'center',
    padding: 20,
    borderWidth: 1,
    borderRadius: 12,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 3,
  },
  paperBack: {
    top: 10,
    left: 4,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    transform: [{ rotate: '-9deg' }],
  },
  paperFront: {
    top: 48,
    right: 0,
    backgroundColor: colors.navy,
    borderColor: colors.navy,
    transform: [{ rotate: '7deg' }],
  },
  kickerBack: {
    color: colors.navy,
    fontFamily: fonts.uiMedium,
    fontSize: 11,
    letterSpacing: 1,
  },
  kickerFront: {
    marginTop: spacing.sm,
    color: 'rgba(255,255,255,0.82)',
    fontFamily: fonts.uiMedium,
    fontSize: 12,
    letterSpacing: 1.2,
  },
  paperWordBack: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    color: colors.navy,
    fontFamily: fonts.display,
    fontSize: 30,
    letterSpacing: -1.2,
    lineHeight: 36,
  },
  paperWordFront: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    color: colors.surface,
    fontFamily: fonts.display,
    fontSize: 36,
    letterSpacing: -1.5,
    lineHeight: 42,
  },
  paperMeaningBack: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
  },
  paperMeaningFront: {
    color: 'rgba(255,255,255,0.9)',
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  localArt: {
    alignItems: 'center',
    gap: spacing.xl,
  },
  ring: {
    width: 176,
    height: 176,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 88,
  },
  ringCompact: {
    width: 128,
    height: 128,
    borderRadius: 64,
  },
  symbol: {
    width: 128,
    height: 128,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
    transform: [{ rotate: '-7deg' }],
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  symbolCompact: {
    width: 96,
    height: 96,
    borderRadius: 14,
  },
  badge: {
    position: 'absolute',
    right: 8,
    bottom: 12,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.background,
    borderRadius: 20,
    backgroundColor: colors.teal,
  },
  badgeAlert: {
    backgroundColor: colors.magenta,
  },
  badgeCompact: {
    right: 2,
    bottom: 6,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
  },
  caption: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
