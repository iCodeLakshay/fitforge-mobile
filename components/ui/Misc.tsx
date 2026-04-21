import React from 'react';
import { View, Text, StyleSheet, ViewProps, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/spacing';

// ─── Avatar ──────────────────────────────────────────────────────────────────

interface AvatarProps {
  name?:         string;    // used to derive initials + fallback color
  uri?:          string;    // image URI if available
  size?:         number;
  borderColor?:  string;    // colored ring (matches membership status)
  borderWidth?:  number;
  statusDot?:    'online' | 'offline' | null;
}

export function Avatar({
  name        = '?',
  size        = Layout.avatarMd,
  borderColor,
  borderWidth = 2,
  statusDot,
}: AvatarProps) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <View style={{ position: 'relative', width: size, height: size }}>
      <View style={[
        styles.avatar,
        {
          width:           size,
          height:          size,
          borderRadius:    size / 2,
          borderWidth:     borderColor ? borderWidth : 0,
          borderColor:     borderColor ?? 'transparent',
        },
      ]}>
        <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{initials}</Text>
      </View>
      {statusDot && (
        <View style={[
          styles.dot,
          {
            bottom:          1,
            right:           1,
            backgroundColor: statusDot === 'online' ? Colors.success : Colors.textTertiary,
          },
        ]} />
      )}
    </View>
  );
}

// ─── Avatar Group (stacked) ──────────────────────────────────────────────────

interface AvatarGroupProps {
  names:   string[];
  max?:    number;
  size?:   number;
}

export function AvatarGroup({ names, max = 3, size = Layout.avatarSm }: AvatarGroupProps) {
  const shown = names.slice(0, max);
  const rest  = names.length - max;
  const overlap = size * 0.3;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {shown.map((n, i) => (
        <View key={i} style={{ marginLeft: i > 0 ? -overlap : 0, zIndex: i }}>
          <Avatar name={n} size={size} borderColor={Colors.surface02} />
        </View>
      ))}
      {rest > 0 && (
        <View style={[
          styles.moreChip,
          { marginLeft: -overlap, width: size, height: size, borderRadius: size / 2 },
        ]}>
          <Text style={[styles.moreText, { fontSize: size * 0.3 }]}>+{rest}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?:     string;   // emoji or icon
  title:     string;
  message?:  string;
  subtitle?: string;   // alias for message
  action?:   React.ReactNode;
  style?:    ViewProps['style'];
}

export function EmptyState({ icon = '📭', title, message, subtitle, action, style }: EmptyStateProps) {
  const body = message ?? subtitle;
  return (
    <View style={[styles.emptyContainer, style]}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {body && <Text style={styles.emptyMessage}>{body}</Text>}
      {action && <View style={{ marginTop: 24 }}>{action}</View>}
    </View>
  );
}

// ─── Loading Overlay ─────────────────────────────────────────────────────────

export function LoadingOverlay({ label, message }: { label?: string; message?: string }) {
  const text = label ?? message ?? 'Loading...';
  return (
    <View style={styles.loadingOverlay}>
      {/* Pulsing lime orb */}
      <View style={styles.orb} />
      <Text style={styles.loadingLabel}>{text}</Text>
    </View>
  );
}

// ─── Screen Header ───────────────────────────────────────────────────────────

interface ScreenHeaderProps {
  title:      string;
  subtitle?:  string;
  left?:      React.ReactNode;
  right?:     React.ReactNode;
  showBack?:  boolean;
  onBack?:    () => void;
}

export function ScreenHeader({ title, subtitle, left, right, showBack, onBack }: ScreenHeaderProps) {
  const leftNode = left ?? (showBack ? (
    <TouchableOpacity onPress={onBack} style={{ padding: 4 }}>
      <Text style={{ color: Colors.accent, fontSize: 22 }}>‹</Text>
    </TouchableOpacity>
  ) : null);
  return (
    <View style={styles.header}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {leftNode}
        <View>
          {subtitle && <Text style={styles.headerSub}>{subtitle.toUpperCase()}</Text>}
          <Text style={styles.headerTitle}>{title.toUpperCase()}</Text>
        </View>
      </View>
      {right && <View style={{ flexDirection: 'row', gap: 8 }}>{right}</View>}
    </View>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────

export function Divider({ spacing = 16 }: { spacing?: number }) {
  return (
    <View style={{ height: 1, backgroundColor: Colors.border, marginVertical: spacing }} />
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  avatar: {
    backgroundColor:  Colors.surface02,
    alignItems:       'center',
    justifyContent:   'center',
    overflow:         'hidden',
  },
  initials: { ...Typography.labelMd, color: Colors.textPrimary, fontWeight: '600' },
  dot: {
    position:         'absolute',
    width:            10,
    height:           10,
    borderRadius:     5,
    borderWidth:      2,
    borderColor:      Colors.surface01,
  },
  moreChip: {
    backgroundColor:  Colors.surface02,
    alignItems:       'center',
    justifyContent:   'center',
  },
  moreText: { ...Typography.labelSm, color: Colors.textSecondary },

  // Empty state
  emptyContainer: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    padding:        32,
  },
  emptyIcon:    { fontSize: 48, marginBottom: 16 },
  emptyTitle:   { ...Typography.headingMd, color: Colors.textPrimary, textAlign: 'center', marginBottom: 8 },
  emptyMessage: { ...Typography.bodyMd,    color: Colors.textSecondary, textAlign: 'center' },

  // Loading
  loadingOverlay: {
    flex:             1,
    alignItems:       'center',
    justifyContent:   'center',
    backgroundColor:  Colors.background,
    gap:              20,
  },
  orb: {
    width:  60, height: 60, borderRadius: 30,
    backgroundColor: Colors.accentMuted,
    shadowColor:     Colors.accent,
    shadowOffset:    { width: 0, height: 0 },
    shadowOpacity:   0.8,
    shadowRadius:    20,
    elevation:       12,
  },
  loadingLabel: { ...Typography.bodyMd, color: Colors.textSecondary },

  // Screen header
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: 12,
  },
  headerSub:   { ...Typography.labelSm, color: Colors.textTertiary },
  headerTitle: { ...Typography.displaySm, color: Colors.textPrimary },
});
