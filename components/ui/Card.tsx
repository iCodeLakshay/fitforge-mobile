import React from 'react';
import { View, Text, StyleSheet, ViewProps, Pressable } from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Radius, Layout, Spacing } from '../../constants/spacing';

// ─── Standard Card ────────────────────────────────────────────────────────────

interface CardProps extends ViewProps {
  children:        React.ReactNode;
  accentBorder?:   'left' | 'top' | 'none';
  accentColor?:    string;
  padding?:        boolean;
}

export function Card({
  children,
  accentBorder = 'none',
  accentColor  = Colors.accent,
  padding      = true,
  style,
  ...rest
}: CardProps) {
  return (
    <View style={[
      styles.card,
      padding && styles.cardPadding,
      accentBorder === 'left' && { borderLeftWidth: 3, borderLeftColor: accentColor },
      accentBorder === 'top'  && { borderTopWidth: 3,  borderTopColor:  accentColor },
      style,
    ]} {...rest}>
      {children}
    </View>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label:      string;
  value:      string;
  subLabel?:  string;
  accent?:    boolean; // if true, value is lime
  trend?:     '↑' | '↓' | null;
  style?:     ViewProps['style'];
}

export function StatCard({ label, value, subLabel, accent = false, trend, style }: StatCardProps) {
  return (
    <View style={[styles.card, styles.cardPadding, styles.statCard, style]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, accent && { color: Colors.accent }]}>{value}</Text>
      {subLabel && (
        <Text style={styles.statSub}>
          {trend && <Text style={{ color: trend === '↑' ? Colors.success : Colors.danger }}>{trend} </Text>}
          {subLabel}
        </Text>
      )}
    </View>
  );
}

// ─── Member Card (horizontal list item) ──────────────────────────────────────

interface MemberCardProps {
  name:         string;
  phone?:       string;
  status:       string;
  daysLeft?:    number;
  avatarLetter?: string;
  onPress?:     () => void;
}

export function MemberCard({
  name, phone, status, daysLeft, avatarLetter, onPress,
}: MemberCardProps) {
  const statusColors: Record<string, { text: string; bg: string }> = {
    active:          { text: Colors.accent,   bg: Colors.accentMuted },
    expiring_soon:   { text: Colors.warning,  bg: `${Colors.warning}26` },
    grace_period:    { text: Colors.warning,  bg: `${Colors.warning}26` },
    expired:         { text: Colors.danger,   bg: `${Colors.danger}26` },
    pending_approval:{ text: Colors.textSecondary, bg: Colors.surface02 },
    archived:        { text: Colors.textTertiary,  bg: Colors.surface02 },
  };
  const sc = statusColors[status] ?? statusColors.active;

  return (
    <Pressable style={styles.memberCard} onPress={onPress}>
      {/* Avatar */}
      <View style={[
        styles.memberAvatar,
        { borderColor: sc.text },
      ]}>
        <Text style={styles.memberAvatarText}>{avatarLetter ?? name[0]}</Text>
      </View>
      {/* Info */}
      <View style={styles.memberInfo}>
        <Text style={styles.memberName} numberOfLines={1}>{name}</Text>
        {phone && <Text style={styles.memberPhone}>{phone}</Text>}
      </View>
      {/* Status / days left */}
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
          <Text style={[styles.statusText, { color: sc.text }]}>
            {status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
        {daysLeft !== undefined && (
          <Text style={styles.daysLeft}>
            {daysLeft <= 0 ? 'Expired' : `${daysLeft}d left`}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

// ─── Renewal Scroll Card (used in Owner Dashboard horizontal scroll) ──────────

interface RenewalCardProps {
  name:        string;
  daysLeft:    number;
  avatarLetter?: string;
  onPress?:    () => void;
}

export function RenewalCard({ name, daysLeft, avatarLetter, onPress }: RenewalCardProps) {
  const color = daysLeft <= 1 ? Colors.danger : Colors.warning;
  return (
    <Pressable style={styles.renewalCard} onPress={onPress}>
      <View style={[styles.renewalAvatar, { borderColor: color }]}>
        <Text style={styles.memberAvatarText}>{avatarLetter ?? name[0]}</Text>
      </View>
      <Text style={styles.renewalName} numberOfLines={1}>{name}</Text>
      <View style={[styles.statusBadge, { backgroundColor: `${color}26`, alignSelf: 'center' }]}>
        <Text style={[styles.statusText, { color }]}>
          {daysLeft <= 0 ? 'EXPIRED' : `${daysLeft}d left`}
        </Text>
      </View>
    </Pressable>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title:       string;
  action?:     string;
  onAction?:   () => void;
}

export function SectionHeader({ title, action, onAction }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
      {action && (
        <Text style={styles.sectionAction} onPress={onAction}>{action}</Text>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface01,
    borderRadius:    Radius.lg,
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  cardPadding: {
    padding: Layout.cardPaddingV,
    paddingHorizontal: Layout.cardPaddingH,
  },

  // Stat card
  statCard:   { flex: 1, gap: 4 },
  statLabel:  { ...Typography.labelSm,  color: Colors.textSecondary },
  statValue:  { ...Typography.displaySm, color: Colors.textPrimary, lineHeight: 34 },
  statSub:    { ...Typography.bodySm,   color: Colors.textSecondary },

  // Member card
  memberCard: {
    flexDirection:    'row',
    alignItems:       'center',
    backgroundColor:  Colors.surface01,
    borderRadius:     Radius.lg,
    padding:          Layout.cardPaddingV,
    paddingHorizontal: Layout.cardPaddingH,
    borderWidth:      1,
    borderColor:      Colors.border,
    gap:              12,
  },
  memberAvatar: {
    width:           Layout.avatarMd,
    height:          Layout.avatarMd,
    borderRadius:    Layout.avatarMd / 2,
    backgroundColor: Colors.surface02,
    borderWidth:     2,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  memberAvatarText: { ...Typography.labelMd, color: Colors.textPrimary },
  memberInfo: { flex: 1 },
  memberName: { ...Typography.headingSm, color: Colors.textPrimary, marginBottom: 2 },
  memberPhone:{ ...Typography.bodySm, color: Colors.textSecondary },
  daysLeft:   { ...Typography.monoSm, color: Colors.textSecondary },

  // Status badge
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:      Radius.full,
  },
  statusText: { ...Typography.labelSm },

  // Renewal card (horizontal scroll)
  renewalCard: {
    width:           160,
    backgroundColor: Colors.surface01,
    borderRadius:    Radius.lg,
    padding:         16,
    borderWidth:     1,
    borderColor:     Colors.border,
    gap:             8,
  },
  renewalAvatar: {
    width:           Layout.avatarLg,
    height:          Layout.avatarLg,
    borderRadius:    Layout.avatarLg / 2,
    backgroundColor: Colors.surface02,
    borderWidth:     2,
    alignItems:      'center',
    justifyContent:  'center',
  },
  renewalName: { ...Typography.headingSm, color: Colors.textPrimary },

  // Section header
  sectionHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   12,
  },
  sectionTitle:  { ...Typography.displaySm, color: Colors.textPrimary },
  sectionAction: { ...Typography.labelMd,   color: Colors.accent },
});
