import React from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { Colors } from '../../../constants/colors';
import { Layout } from '../../../constants/spacing';
import { Typography } from '../../../constants/typography';
import { ScreenHeader, Card, StatCard, LoadingOverlay, Button, Avatar } from '../../../components/ui';
import { getDaysLeft, formatDate } from '../../../utils/date';
import { useAuthStore } from '../../../stores/auth.store';

export default function MemberDetailScreen() {
  const { id } = useLocalSearchParams<{ id: Id<'users'> }>();
  const { gymId } = useAuthStore();
  const router = useRouter();

  const detail = useQuery(api.members.getDetail, gymId && id ? { gymId: gymId as Id<'gyms'>, memberId: id } : 'skip');

  if (detail === undefined) {
    return <LoadingOverlay message="Loading member profile..." />;
  }
  if (!detail) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Not Found" showBack onBack={() => router.back()} />
        <Text style={styles.errorText}>Member details not found.</Text>
      </View>
    );
  }

  const { user, membership, healthProfile, thisMonthAttendanceDays, latestPlan, plansThisMonth } = detail;
  const daysLeft = getDaysLeft(membership.endDate);
  
  const formattedStatus = membership.status.replace('_', ' ').toUpperCase();
  const statusColor = membership.status === 'active' ? Colors.accent : 
                      membership.status === 'expired' ? Colors.danger : Colors.warning;

  return (
    <View style={styles.container}>
      <ScreenHeader 
        title="Member Profile" 
        showBack 
        onBack={() => router.back()} 
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header Profile Info */}
        <View style={styles.profileHeader}>
          <Avatar name={user.name} size={64} />
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.phone}>{user.phone}</Text>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}26` }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{formattedStatus}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsBox}>
          <Button
            title="Generate AI Plan"
            onPress={() => router.push(`/members/${id}/generate-plan`)}
            style={{ flex: 1 }}
          />
          <Button
            title="Record Pay"
            variant="secondary"
            onPress={() => router.push(`/payments/record?memberId=${id}`)}
          />
        </View>

        {/* Membership Info */}
        <Card padding style={styles.card}>
          <Text style={styles.sectionTitle}>Membership Details</Text>
          <View style={styles.grid}>
            <View style={styles.col}>
              <Text style={styles.label}>End Date</Text>
              <Text style={styles.value}>{formatDate(membership.endDate)}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Days Left</Text>
              <Text style={[styles.value, { color: daysLeft <= 7 ? Colors.danger : Colors.textPrimary }]}>
                {daysLeft} days
              </Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Type</Text>
              <Text style={styles.value}>{membership.subscriptionType || 'Custom'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Joined</Text>
              <Text style={styles.value}>{formatDate(membership.joiningDate ?? '')}</Text>
            </View>
          </View>
        </Card>

        {/* Physical Stats */}
        <Card padding style={styles.card}>
           <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
             <Text style={styles.sectionTitle}>Physical Profile</Text>
             <Text 
               style={{ ...Typography.labelSm, color: Colors.accent }}
               onPress={() => router.push(`/members/${id}/health-profile`)}
             >
               EDIT
             </Text>
           </View>
           
           {healthProfile ? (
             <View style={styles.grid}>
                <View style={styles.col}>
                  <Text style={styles.label}>Weight</Text>
                  <Text style={styles.value}>{healthProfile.weightKg} kg</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Goal</Text>
                  <Text style={styles.value}>{(healthProfile.physiqueGoal ?? '').replace('_', ' ')}</Text>
                </View>
                {healthProfile.medicalConditions && (
                  <View style={[styles.col, { width: '100%' }]}>
                    <Text style={styles.label}>Medical Note</Text>
                    <Text style={styles.value}>{healthProfile.medicalConditions}</Text>
                  </View>
                )}
             </View>
           ) : (
             <Text style={{ ...Typography.bodySm, color: Colors.textTertiary }}>
               No physical profile recorded yet.
             </Text>
           )}
        </Card>

        {/* Usage Stats overview */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <StatCard 
            label="Attendance This Month" 
            value={`${thisMonthAttendanceDays} days`} 
            accent
          />
          <StatCard 
            label="AI Plans Rendered" 
            value={`${plansThisMonth} plans`} 
          />
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    padding: Layout.screenPadding,
    gap: 16,
  },
  errorText: {
    ...Typography.bodyMd,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  name: {
    ...Typography.headingMd,
    color: Colors.textPrimary,
  },
  phone: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
  },
  statusText: {
    ...Typography.labelSm,
    fontSize: 10,
  },
  actionsBox: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    gap: 12,
  },
  sectionTitle: {
    ...Typography.labelLg,
    color: Colors.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 16,
  },
  col: {
    width: '50%',
    gap: 4,
  },
  label: {
    ...Typography.labelSm,
    color: Colors.textTertiary,
  },
  value: {
    ...Typography.bodyMd,
    color: Colors.textPrimary,
  }
});
