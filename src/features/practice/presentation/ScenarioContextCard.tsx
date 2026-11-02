import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-remix-icon';
import { colors, fonts, radii, spacing } from '../../../ui/theme';

export interface ScenarioContextCardProps {
  title: string;
  partner: string;
  userRole?: string;
  contextDescription?: string;
  register?: string;
  avatar?: string;
}

export function ScenarioContextCard({
  title,
  partner,
  userRole,
  contextDescription,
  register,
  avatar,
}: ScenarioContextCardProps) {
  return (
    <View style={styles.card}>
      {/* Top Badge: Register Tag */}
      <View style={styles.topRow}>
        <View style={styles.tag}>
          <Icon color={colors.primary} name="chat-smile-2-line" size={14} />
          <Text style={styles.tagText}>
            {register ? `REGISTER: ${register.toUpperCase()}` : 'SKENARIO PERCAKAPAN'}
          </Text>
        </View>
        <Text style={styles.titleText}>{title}</Text>
      </View>

      {/* Profil Lawan Bicara & Peran */}
      <View style={styles.profileRow}>
        <View style={styles.avatarContainer}>
          {avatar ? (
            <Image
              accessibilityLabel={`Foto profil ${partner}`}
              source={{ uri: avatar }}
              style={styles.avatarImage}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Icon color={colors.primary} name="user-3-line" size={24} />
            </View>
          )}
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.partnerText}>
            Lawan Bicara: <Text style={styles.boldText}>{partner}</Text>
          </Text>
          {userRole ? (
            <Text style={styles.roleText}>
              Peran Kamu: <Text style={styles.boldText}>{userRole}</Text>
            </Text>
          ) : null}
        </View>
      </View>

      {/* Deskripsi Situasi */}
      {contextDescription ? (
        <View style={styles.contextBox}>
          <Text style={styles.contextText}>{contextDescription}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.orangeTint,
    borderRadius: 4,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    gap: 4,
  },
  tagText: {
    fontFamily: fonts.uiBold,
    fontSize: 11,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  titleText: {
    fontFamily: fonts.uiBold,
    fontSize: 13,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.orangeTint,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  partnerText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textPrimary,
  },
  roleText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  boldText: {
    fontFamily: fonts.bodyBold,
    color: colors.textPrimary,
  },
  contextBox: {
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  contextText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
