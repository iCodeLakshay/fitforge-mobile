import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { Colors } from '../../../../constants/colors';
import { Typography } from '../../../../constants/typography';
import { Layout, Radius } from '../../../../constants/spacing';
import { ScreenHeader, Button, Input, Card, LoadingOverlay } from '../../../../components/ui';
import { useAuthStore } from '../../../../stores/auth.store';
import { showError, showSuccess } from '../../../../stores/ui.store';

const SUBSCRIPTION_TYPES = [
  { label: '1 Month',   value: 'monthly',     months: 1 },
  { label: '3 Months',  value: 'quarterly',   months: 3 },
  { label: '6 Months',  value: 'half_yearly', months: 6 },
  { label: '1 Year',    value: 'yearly',      months: 12 },
  { label: 'Custom',    value: 'custom',      months: 0 },
];

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

export default function EditSubscriptionScreen() {
  const { id } = useLocalSearchParams<{ id: Id<'users'> }>();
  const { gymId } = useAuthStore();
  const router = useRouter();

  const detail          = useQuery(api.members.getDetail, gymId && id ? { gymId: gymId as Id<'gyms'>, memberId: id } : 'skip');
  const editSubscription = useMutation(api.members.editSubscription);

  const [subType,    setSubType]    = useState('monthly');
  const [startDate,  setStartDate]  = useState('');
  const [endDate,    setEndDate]    = useState('');
  const [amount,     setAmount]     = useState('');
  const [loading,    setLoading]    = useState(false);

  useEffect(() => {
    if (detail?.membership) {
      const m = detail.membership;
      setSubType(m.subscriptionType ?? 'monthly');
      setStartDate(m.startDate);
      setEndDate(m.endDate);
      setAmount(m.amountPaid ? String(m.amountPaid / 100) : '');
    }
  }, [detail]);

  const handleSubTypeSelect = (value: string, months: number) => {
    setSubType(value);
    if (months > 0) {
      setEndDate(addMonths(startDate || new Date().toISOString().split('T')[0], months));
    }
  };

  const handleSave = async () => {
    if (!detail?.membership) return;
    if (!startDate || !endDate) return showError('Start and end dates are required');

    setLoading(true);
    try {
      await editSubscription({
        membershipId:     detail.membership._id,
        subscriptionType: subType,
        startDate,
        endDate,
        amountPaid:       amount ? parseFloat(amount) : undefined,
      });
      showSuccess('Subscription updated!');
      router.back();
    } catch (e: any) {
      showError(e?.message ?? 'Failed to update subscription');
    } finally {
      setLoading(false);
    }
  };

  if (detail === undefined) return <LoadingOverlay message="Loading..." />;
  if (!detail) return null;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Edit Subscription" showBack onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Subscription Type */}
        <Card padding style={styles.section}>
          <Text style={styles.sectionLabel}>SUBSCRIPTION TYPE</Text>
          <View style={styles.chipGrid}>
            {SUBSCRIPTION_TYPES.map((s) => (
              <TouchableOpacity
                key={s.value}
                style={[styles.chip, subType === s.value && styles.chipActive]}
                onPress={() => handleSubTypeSelect(s.value, s.months)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, subType === s.value && styles.chipTextActive]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Dates */}
        <Card padding style={styles.section}>
          <Text style={styles.sectionLabel}>DATES</Text>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input
                label="Start Date"
                placeholder="YYYY-MM-DD"
                value={startDate}
                onChangeText={setStartDate}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="End Date"
                placeholder="YYYY-MM-DD"
                value={endDate}
                onChangeText={setEndDate}
              />
            </View>
          </View>
          {startDate && endDate && (
            <Text style={styles.durationNote}>
              {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000)} days
            </Text>
          )}
        </Card>

        {/* Amount */}
        <Card padding style={styles.section}>
          <Text style={styles.sectionLabel}>PAYMENT (OPTIONAL)</Text>
          <Input
            label="Amount Paid (₹)"
            placeholder="e.g. 1500"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
          <Text style={styles.hint}>
            A new payment record will be created if amount is entered.
          </Text>
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Save Changes" onPress={handleSave} loading={loading} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll:    { padding: Layout.screenPadding, gap: 16, paddingBottom: 40 },

  section:      { gap: 12 },
  sectionLabel: { ...Typography.labelSm, color: Colors.textTertiary },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  chipActive:     { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipText:       { ...Typography.labelMd, color: Colors.textSecondary },
  chipTextActive: { color: Colors.background },

  row:          { flexDirection: 'row', gap: 12 },
  durationNote: { ...Typography.bodySm, color: Colors.accent, textAlign: 'right' },
  hint:         { ...Typography.bodySm, color: Colors.textTertiary },

  footer: {
    padding:          Layout.screenPadding,
    borderTopWidth:   1,
    borderTopColor:   Colors.border,
    backgroundColor:  Colors.surface01,
  },
});
