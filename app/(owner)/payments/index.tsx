import React from 'react';
import { View, FlatList, StyleSheet, Text } from 'react-native';
import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { api } from '../../../convex/_generated/api';
import { useAuthStore } from '../../../stores/auth.store';
import { Id } from '../../../convex/_generated/dataModel';
import { Colors } from '../../../constants/colors';
import { Layout } from '../../../constants/spacing';
import { Typography } from '../../../constants/typography';
import { ScreenHeader, Button, EmptyState, LoadingOverlay } from '../../../components/ui';
import { formatRupees, formatTimestamp } from '../../../utils/date';

export default function PaymentsScreen() {
  const router = useRouter();
  const { gymId } = useAuthStore();
  
  const payments = useQuery(api.payments.listForGym, gymId ? { gymId: gymId as Id<'gyms'> } : 'skip');

  if (payments === undefined) {
    return <LoadingOverlay message="Loading payments..." />;
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="PAYMENTS" />
      
      <View style={styles.actions}>
        <Button
          title="Record Payment"
          onPress={() => router.push('/payments/record')}
        />
      </View>
      
      <FlatList
        data={payments}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.paymentCard}>
            <View style={styles.iconBox}>
              <Text style={{ fontSize: 20 }}>₹</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>{item.user?.name || 'Unknown Member'}</Text>
              <Text style={styles.date}>{formatTimestamp(item.createdAt)} • {(item.paymentMode ?? '').toUpperCase()}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.amount}>{formatRupees(item.amount / 100)}</Text>
              <View style={[styles.statusBadge, { backgroundColor: item.status === 'paid' ? `${Colors.success}26` : `${Colors.warning}26` }]}>
                <Text style={{ ...Typography.labelSm, color: item.status === 'paid' ? Colors.success : Colors.warning }}>
                  {item.status.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
           <EmptyState 
             icon="cash-outline"
             title="No Payments Yet"
             subtitle="Record your first offline payment or wait for online payments."
           />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  actions: {
    paddingHorizontal: Layout.screenPadding,
    marginBottom: 16,
  },
  listContent: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Layout.screenPadding * 2,
    gap: 12,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface01,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.accent}26`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    ...Typography.headingSm,
    color: Colors.textPrimary,
  },
  date: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  amount: {
    ...Typography.monoMd,
    color: Colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  }
});
