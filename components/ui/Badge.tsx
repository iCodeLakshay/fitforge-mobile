import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Radius } from '../../constants/spacing';
import type { SubscriptionStatus } from '../../constants/config';

// ─── Status Badge (membership) ───────────────────────────────────────────────

const statusMap: Record<SubscriptionStatus, { label: string; text: string; bg: string }> = {
  active:           { label: 'ACTIVE',           text: Colors.accent,         bg: `${Colors.accent}26` },
  expiring_soon:    { label: 'EXPIRING SOON',     text: Colors.warning,        bg: `${Colors.warning}26` },
  grace_period:     { label: 'GRACE PERIOD',      text: Colors.warning,        bg: `${Colors.warning}26` },
  expired:          { label: 'EXPIRED',           text: Colors.danger,         bg: `${Colors.danger}26` },
  pending_approval: { label: 'PENDING',           text: Colors.textSecondary,  bg: Colors.surface02 },
  archived:         { label: 'ARCHIVED',          text: Colors.textTertiary,   bg: Colors.surface02 },
};

interface StatusBadgeProps {
  status: SubscriptionStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const s = statusMap[status] ?? statusMap.active;
  return (
    <View style={[styles.pill, { backgroundColor: s.bg }]}>
      <Text style={[styles.pillText, { color: s.text }]}>{s.label}</Text>
    </View>
  );
}

// ─── Plan Count Badge (AI generations quota) ─────────────────────────────────

interface PlanCountBadgeProps {
  used:  number;
  total: number;
}

export function PlanCountBadge({ used, total }: PlanCountBadgeProps) {
  const isFull = used >= total;
  return (
    <View style={styles.dotRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[
          styles.dot,
          i < used ? styles.dotFilled : styles.dotEmpty,
          isFull && i < used && { backgroundColor: Colors.danger },
        ]} />
      ))}
    </View>
  );
}

// ─── Streak Badge ────────────────────────────────────────────────────────────

interface StreakBadgeProps {
  streak: number;
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  return (
    <View style={styles.streakBadge}>
      <Text style={styles.streakText}>🔥 {streak} day streak</Text>
    </View>
  );
}

// ─── Plan Type Tag ───────────────────────────────────────────────────────────

interface PlanTagProps {
  type: 'meal' | 'workout' | 'combined';
}

export function PlanTag({ type }: PlanTagProps) {
  const map = {
    meal:     { label: 'MEAL PLAN',    color: Colors.info },
    workout:  { label: 'WORKOUT PLAN', color: Colors.accent },
    combined: { label: 'FULL PLAN',    color: Colors.success },
  };
  const t = map[type];
  return (
    <View style={[styles.pill, { backgroundColor: `${t.color}20` }]}>
      <Text style={[styles.pillText, { color: t.color }]}>{t.label}</Text>
    </View>
  );
}

// ─── FitForge Plan Badge ─────────────────────────────────────────────────────

interface FitForgePlanBadgeProps {
  plan: 'free' | 'pro' | 'pro_plus';
}

export function FitForgePlanBadge({ plan }: FitForgePlanBadgeProps) {
  const map = {
    free:     { label: 'FREE',     bg: Colors.surface02,   text: Colors.textSecondary },
    pro:      { label: 'PRO',      bg: Colors.accent,      text: Colors.textOnAccent  },
    pro_plus: { label: 'PRO+',     bg: Colors.accent,      text: Colors.textOnAccent  },
  };
  const m = map[plan];
  return (
    <View style={[styles.pill, { backgroundColor: m.bg }]}>
      <Text style={[styles.pillText, { color: m.text }]}>{m.label}</Text>
    </View>
  );
}

// ─── Chip (selectable tag) ────────────────────────────────────────────────────

interface ChipProps {
  label:      string;
  selected?:  boolean;
  onPress?:   () => void;
}

export function Chip({ label, selected, onPress }: ChipProps) {
  const { TouchableOpacity } = require('react-native');
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.chip,
        selected
          ? { backgroundColor: `${Colors.accent}20`, borderColor: Colors.accent }
          : { backgroundColor: Colors.surface02, borderColor: Colors.border },
      ]}
    >
      <Text style={[styles.chipText, selected && { color: Colors.accent }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:      Radius.full,
    alignSelf:         'flex-start',
  },
  pillText: { ...Typography.labelSm },

  // Plan count dots
  dotRow:   { flexDirection: 'row', gap: 6 },
  dot:      { width: 8, height: 8, borderRadius: 4 },
  dotFilled:{ backgroundColor: Colors.accent },
  dotEmpty: { backgroundColor: Colors.surface02, borderWidth: 1, borderColor: Colors.border },

  // Streak
  streakBadge: {
    backgroundColor: `${Colors.warning}20`,
    borderRadius:    Radius.full,
    paddingHorizontal: 12,
    paddingVertical:   6,
  },
  streakText: { ...Typography.labelMd, color: Colors.warning },

  // Chip
  chip: {
    paddingHorizontal: 12,
    paddingVertical:   6,
    borderRadius:      Radius.full,
    borderWidth:       1,
  },
  chipText: { ...Typography.labelMd, color: Colors.textSecondary },
});
