import React from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuthStore } from '../../stores/auth.store';
import { ProgressRing, ProgressBar } from '../../components/ui/Progress';
import { StreakBadge, StatusBadge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Misc';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout, Radius, Spacing } from '../../constants/spacing';
import QRCode from 'react-native-qrcode-svg';

export default function MemberHomeScreen() {
  const { userId } = useAuthStore();

  const subscriptions = useQuery(
    api.members.mySubscriptions,
    userId ? { userId: userId as any } : 'skip',
  );

  const activeSubscription = subscriptions?.find(
    (s) => !['expired', 'archived'].includes(s.status)
  );
  const gym = activeSubscription?.gym;

  // Get attendance + plans for active gym
  const today = new Date().toISOString().split('T')[0];
  const monthStr = today.slice(0, 7); // YYYY-MM

  const subscriptionProgress = React.useMemo(() => {
    if (!activeSubscription) return 0;
    const start = new Date(activeSubscription.startDate).getTime();
    const end   = new Date(activeSubscription.endDate).getTime();
    const now   = Date.now();
    return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
  }, [activeSubscription]);

  const daysLeft = React.useMemo(() => {
    if (!activeSubscription) return 0;
    const end = new Date(activeSubscription.endDate).getTime();
    return Math.max(0, Math.ceil((end - Date.now()) / 86400000));
  }, [activeSubscription]);

  const qrData = userId ? `fitforge://checkin/${userId}` : 'no-user';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>GOOD MORNING,</Text>
            <Text style={styles.userName}>
              {/* User name fetched separately — placeholder until loaded */}
              CHAMP
            </Text>
          </View>
          {gym && (
            <Avatar
              name={gym.name}
              size={40}
              borderColor={Colors.accent}
            />
          )}
        </View>

        {/* ── Subscription Banner ── */}
        {activeSubscription && (
          <View style={styles.subBanner}>
            <View style={styles.subTop}>
              <StatusBadge status={activeSubscription.status as any} />
              <Text style={styles.subGym} numberOfLines={1}>{gym?.name}</Text>
            </View>
            <Text style={styles.subDetail}>
              Active until {activeSubscription.endDate} · {daysLeft} days remaining
            </Text>
            <ProgressBar
              progress={subscriptionProgress}
              height={4}
              color={Colors.accent}
              trackColor={Colors.surface02}
            />
          </View>
        )}

        {/* ── QR Check-in Card ── */}
        <View style={styles.qrCard}>
          <Text style={styles.qrLabel}>SHOW THIS TO CHECK IN</Text>
          <View style={styles.qrBox}>
            <QRCode
              value={qrData}
              size={160}
              color={Colors.textPrimary}
              backgroundColor={Colors.surface02}
            />
          </View>
          <Text style={styles.qrHint}>Tap to enlarge</Text>
        </View>

        {/* ── No Membership Prompt ── */}
        {!activeSubscription && subscriptions !== undefined && (
          <View style={styles.noGym}>
            <Text style={styles.noGymIcon}>🏋️</Text>
            <Text style={styles.noGymTitle}>Not enrolled yet</Text>
            <Text style={styles.noGymSub}>
              Ask your gym owner to add you in the FitForge app.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Layout.screenPadding, paddingBottom: 100, gap: 20 },

  // Header
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  greeting: {
    ...Typography.labelSm,
    color:         Colors.textSecondary,
    letterSpacing: 1,
  },
  userName: {
    ...Typography.displayMd,
    color:        Colors.textPrimary,
    letterSpacing: 2,
  },

  // Subscription banner
  subBanner: {
    backgroundColor: Colors.surface01,
    borderRadius:    Radius.lg,
    padding:         Layout.cardPaddingH,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
    borderWidth:     1,
    borderColor:     Colors.border,
    gap:             8,
  },
  subTop: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  subGym:   { ...Typography.bodySm, color: Colors.textSecondary },
  subDetail:{ ...Typography.bodyMd, color: Colors.textPrimary },

  // QR
  qrCard: {
    backgroundColor: Colors.surface01,
    borderRadius:    Radius.lg,
    padding:         Layout.cardPaddingH,
    alignItems:      'center',
    gap:             12,
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  qrLabel: { ...Typography.labelSm, color: Colors.textSecondary, letterSpacing: 1 },
  qrBox: {
    backgroundColor: Colors.surface02,
    padding:         16,
    borderRadius:    Radius.md,
  },
  qrHint: { ...Typography.bodySm, color: Colors.textTertiary },

  // No gym
  noGym: {
    alignItems:   'center',
    gap:          12,
    paddingVertical: Spacing.s8,
  },
  noGymIcon:  { fontSize: 48 },
  noGymTitle: { ...Typography.headingMd, color: Colors.textPrimary },
  noGymSub:   { ...Typography.bodyMd, color: Colors.textSecondary, textAlign: 'center' },
});
