import React from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuthStore } from '../../stores/auth.store';
import { StatCard, RenewalCard, SectionHeader } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Misc';
import { IconButton } from '../../components/ui/Button';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout, Spacing, Radius } from '../../constants/spacing';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const router = useRouter();
  const { gymId } = useAuthStore();

  const dashboard = useQuery(
    api.gyms.getDashboard,
    gymId ? { gymId: gymId as any } : 'skip'
  );

  const formatRupees = (v: number) =>
    `₹${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)}`;

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Avatar
              name={dashboard?.gym?.name ?? 'G'}
              size={40}
              borderColor={Colors.accent}
            />
            <View>
              <Text style={styles.headerGreeting}>Good morning 👋</Text>
              <Text style={styles.headerGym} numberOfLines={1}>
                {dashboard?.gym?.name ?? 'Loading...'}
              </Text>
            </View>
          </View>
          <IconButton
            icon={<Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />}
            onPress={() => router.push('/(owner)/notifications' as any)}
          />
        </View>

        {/* ── Today's Snapshot ── */}
        <View style={styles.statsRow}>
          <StatCard
            label="ACTIVE MEMBERS"
            value={String(dashboard?.stats?.activeMembers ?? '—')}
            subLabel={`${dashboard?.stats?.expiringSoon ?? 0} expiring soon`}
            accent
            style={{ flex: 1 }}
          />
          <StatCard
            label="TODAY'S CHECK-INS"
            value={String(dashboard?.stats?.todayCheckIns ?? '—')}
            style={{ flex: 1 }}
          />
        </View>

        {/* ── Revenue This Month ── */}
        <View style={styles.revenueCard}>
          <Text style={styles.revenueLabel}>REVENUE THIS MONTH</Text>
          <Text style={styles.revenueValue}>
            {dashboard?.stats ? formatRupees(dashboard.stats.monthRevenue) : '₹—'}
          </Text>
          {(dashboard?.stats?.pendingApproval ?? 0) > 0 && (
            <Text style={styles.revenueSub}>
              {dashboard?.stats?.pendingApproval} pending approval
            </Text>
          )}
        </View>

        {/* ── Pending Approvals ── */}
        {(dashboard?.stats?.pendingApproval ?? 0) > 0 && (
          <TouchableOpacity
            style={styles.pendingCard}
            onPress={() => router.push('/(owner)/members/pending' as any)}
            activeOpacity={0.8}
          >
            <View style={styles.pendingLeft}>
              <View style={styles.pendingDot} />
              <View>
                <Text style={styles.pendingTitle}>
                  {dashboard!.stats!.pendingApproval} Pending Approval{dashboard!.stats!.pendingApproval > 1 ? 's' : ''}
                </Text>
                <Text style={styles.pendingSub}>Tap to review join requests</Text>
              </View>
            </View>
            <Text style={styles.pendingChevron}>›</Text>
          </TouchableOpacity>
        )}

        {/* ── Renewals Due ── */}
        {(dashboard?.renewalAlerts?.length ?? 0) > 0 && (
          <View>
            <SectionHeader
              title="Renewals Due"
              action="See All"
              onAction={() => router.push('/(owner)/members' as any)}
            />
            <FlatList
              data={dashboard?.renewalAlerts}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.membershipId}
              contentContainerStyle={{ gap: 12, paddingRight: 4 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => router.push(`/(owner)/members/${item.memberId}` as any)}
                  activeOpacity={0.7}
                >
                  <RenewalCard
                    name={item.memberName}
                    daysLeft={item.daysLeft}
                    avatarLetter={item.memberName[0]}
                  />
                </TouchableOpacity>
              )}
              style={{ marginHorizontal: -Layout.screenPadding }}
              contentInset={{ left: Layout.screenPadding, right: Layout.screenPadding }}
            />
          </View>
        )}

        {/* ── Recent Check-ins ── */}
        <View>
          <SectionHeader title="Last Check-Ins" />
          {dashboard?.recentAttendance?.map((item) => (
            <View key={item._id} style={styles.checkInRow}>
              <Avatar name={item.memberName} size={Layout.avatarMd} borderColor={Colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={styles.checkInName}>{item.memberName}</Text>
                <Text style={styles.checkInMethod}>{item.method}</Text>
              </View>
              <View style={styles.checkInTimeRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.checkInTime}>{formatTime(item.checkInAt)}</Text>
              </View>
            </View>
          ))}
          {(dashboard?.recentAttendance?.length ?? 0) === 0 && (
            <Text style={styles.noActivity}>No check-ins yet today</Text>
          )}
        </View>

        {/* ── Quick Actions ── */}
        <SectionHeader title="Quick Actions" />
        <View style={styles.quickActions}>
          {[
            { icon: 'person-add-outline', label: 'Add Member',   route: '/(owner)/members/add' },
            { icon: 'qr-code-outline',    label: 'Scan QR',      route: '/(owner)/attendance/scan' },
            { icon: 'cash-outline',       label: 'Record Payment', route: '/(owner)/payments/record' },
          ].map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.quickAction}
              onPress={() => router.push(action.route as any)}
              activeOpacity={0.7}
            >
              <Ionicons name={action.icon as any} size={24} color={Colors.accent} />
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Layout.screenPadding, paddingBottom: 100, gap: 24 },

  // Header
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  headerLeft:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerGreeting: { ...Typography.bodySm, color: Colors.textSecondary },
  headerGym:      { ...Typography.headingSm, color: Colors.textPrimary, maxWidth: 220 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 12 },

  // Revenue card
  revenueCard: {
    backgroundColor: Colors.surface01,
    borderRadius:    Radius.lg,
    padding:         Layout.cardPaddingH,
    borderWidth:     1,
    borderColor:     Colors.border,
    gap:             4,
  },
  revenueLabel: { ...Typography.labelSm, color: Colors.textSecondary },
  revenueValue: { ...Typography.displayLg, color: Colors.textPrimary, lineHeight: 52 },
  revenueSub:   { ...Typography.bodySm, color: Colors.warning },

  // Pending approvals
  pendingCard: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    backgroundColor: `${Colors.warning}18`,
    borderRadius:    Radius.lg,
    padding:         16,
    borderWidth:     1,
    borderColor:     `${Colors.warning}44`,
  },
  pendingLeft:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pendingDot:     { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.warning },
  pendingTitle:   { ...Typography.headingSm, color: Colors.textPrimary },
  pendingSub:     { ...Typography.bodySm,   color: Colors.textSecondary },
  pendingChevron: { fontSize: 22, color: Colors.warning, fontWeight: '600' },

  // Check-in rows
  checkInRow: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  checkInName:   { ...Typography.headingSm, color: Colors.textPrimary },
  checkInMethod: { ...Typography.bodySm,   color: Colors.textTertiary, textTransform: 'capitalize' },
  checkInTimeRow:{ flexDirection: 'row', alignItems: 'center', gap: 6 },
  onlineDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success },
  checkInTime:   { ...Typography.monoSm, color: Colors.textSecondary },
  noActivity:    { ...Typography.bodyMd, color: Colors.textTertiary, textAlign: 'center', paddingVertical: 16 },

  // Quick actions
  quickActions: { flexDirection: 'row', gap: 12 },
  quickAction: {
    flex:             1,
    backgroundColor:  Colors.surface01,
    borderRadius:     Radius.lg,
    padding:          16,
    alignItems:       'center',
    gap:              8,
    borderWidth:      1,
    borderColor:      Colors.border,
  },
  quickActionLabel: { ...Typography.labelMd, color: Colors.textSecondary, textAlign: 'center' },
});
