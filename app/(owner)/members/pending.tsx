import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { Colors } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';
import { Layout, Radius, Spacing } from '../../../constants/spacing';
import { ScreenHeader, Button, Input, Avatar, EmptyState, LoadingOverlay } from '../../../components/ui';
import { useAuthStore } from '../../../stores/auth.store';
import { showError, showSuccess } from '../../../stores/ui.store';

const SUBSCRIPTION_TYPES = [
  { label: '1 Month',   value: 'monthly',     months: 1 },
  { label: '3 Months',  value: 'quarterly',   months: 3 },
  { label: '6 Months',  value: 'half_yearly', months: 6 },
  { label: '1 Year',    value: 'yearly',      months: 12 },
];

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

function normalizeIdentityValue(value?: string) {
  return (value ?? '').trim();
}

function titleCaseFromSlug(raw: string) {
  return raw
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function getPendingIdentity(user?: { name?: string; phone?: string; email?: string } | null) {
  const name = normalizeIdentityValue(user?.name);
  const email = normalizeIdentityValue(user?.email);
  const phoneOrId = normalizeIdentityValue(user?.phone);
  const primary = email || phoneOrId;

  if (name) {
    return {
      displayName: name,
      secondary: primary || 'Identity not available',
    };
  }

  if (primary.includes('@')) {
    return {
      displayName: titleCaseFromSlug(primary.split('@')[0]),
      secondary: primary,
    };
  }

  if (primary.startsWith('user_')) {
    return {
      displayName: 'New Member',
      secondary: primary.length > 20 ? `${primary.slice(0, 20)}...` : primary,
    };
  }

  if (primary) {
    return {
      displayName: primary,
      secondary: primary,
    };
  }

  return {
    displayName: 'Unknown Member',
    secondary: 'Identity not available',
  };
}

export default function PendingApprovalsScreen() {
  const router  = useRouter();
  const { gymId } = useAuthStore();
  const approveJoin = useMutation(api.members.approveJoin);
  const rejectJoin  = useMutation(api.members.rejectJoin);

  const pending = useQuery(
    api.members.listPending,
    gymId ? { gymId: gymId as Id<'gyms'> } : 'skip'
  );

  const [selected, setSelected]   = useState<any>(null);
  const [subType,  setSubType]    = useState('monthly');
  const [amount,   setAmount]     = useState('');
  const [loading,  setLoading]    = useState(false);
  const [rejectId, setRejectId]   = useState<Id<'memberships'> | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const today    = new Date().toISOString().split('T')[0];
  const subMonths = SUBSCRIPTION_TYPES.find((s) => s.value === subType)?.months ?? 1;
  const endDate  = addMonths(today, subMonths);

  const handleApprove = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await approveJoin({
        membershipId:     selected._id,
        subscriptionType: subType,
        startDate:        today,
        endDate,
        amountPaid:       amount ? parseFloat(amount) : undefined,
      });
      showSuccess('Member approved!');
      setSelected(null);
      setAmount('');
    } catch (e: any) {
      showError(e?.message ?? 'Failed to approve');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectId) return;
    setLoading(true);
    try {
      await rejectJoin({ membershipId: rejectId, reason: rejectReason.trim() || undefined });
      showSuccess('Request rejected');
      setRejectId(null);
      setRejectReason('');
    } catch (e: any) {
      showError(e?.message ?? 'Failed to reject');
    } finally {
      setLoading(false);
    }
  };

  if (pending === undefined) return <LoadingOverlay message="Loading..." />;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Pending Approvals" showBack onBack={() => router.back()} />

      {pending.length === 0 ? (
        <EmptyState
          title="No Pending Requests"
          subtitle="All join requests have been reviewed"
          icon="checkmark-circle-outline"
        />
      ) : (
        <FlatList
          data={pending}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const identity = getPendingIdentity(item.user);

            return (
              <View style={styles.card}>
                <View style={styles.cardLeft}>
                  <Avatar name={identity.displayName} size={44} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{identity.displayName}</Text>
                    <Text style={styles.phone} numberOfLines={1}>{identity.secondary}</Text>
                    <Text style={styles.date}>
                      Requested {new Date(item.createdAt).toLocaleDateString('en-IN')}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => setSelected(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.approveBtnText}>APPROVE</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => { setRejectId(item._id); setRejectReason(''); }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.rejectBtnText}>REJECT</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Approve Modal */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Approve {selected?.user?.name ?? 'Member'}</Text>

            <Text style={styles.sectionLabel}>SUBSCRIPTION TYPE</Text>
            <View style={styles.chipRow}>
              {SUBSCRIPTION_TYPES.map((s) => (
                <TouchableOpacity
                  key={s.value}
                  style={[styles.chip, subType === s.value && styles.chipActive]}
                  onPress={() => setSubType(s.value)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, subType === s.value && styles.chipTextActive]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.dateLine}>
              {today}  →  {endDate}
            </Text>

            <Input
              label="Amount Paid (₹, optional)"
              placeholder="e.g. 1500"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />

            <View style={styles.modalActions}>
              <Button label="Cancel" variant="secondary" onPress={() => setSelected(null)} style={{ flex: 1 }} />
              <Button label="Approve →" variant="primary" loading={loading} onPress={handleApprove} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Reject Modal */}
      <Modal visible={!!rejectId} transparent animationType="slide" onRequestClose={() => setRejectId(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Reject Request</Text>
            <Input
              label="Reason (optional)"
              placeholder="e.g. Not a registered member"
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              style={{ height: 80, textAlignVertical: 'top' }}
            />
            <View style={styles.modalActions}>
              <Button label="Cancel" variant="secondary" onPress={() => setRejectId(null)} style={{ flex: 1 }} />
              <Button label="Reject" variant="danger" loading={loading} onPress={handleReject} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list:      { padding: Layout.screenPadding, gap: 12, paddingBottom: 40 },

  card: {
    backgroundColor: Colors.surface01,
    borderRadius:    Radius.lg,
    padding:         16,
    borderWidth:     1,
    borderColor:     Colors.border,
    gap:             12,
  },
  cardLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name:      { ...Typography.headingSm, color: Colors.textPrimary },
  phone:     { ...Typography.bodySm,   color: Colors.textSecondary },
  date:      { ...Typography.bodySm,   color: Colors.textTertiary, marginTop: 2 },

  cardActions: { flexDirection: 'row', gap: 8 },
  approveBtn: {
    flex: 1, backgroundColor: Colors.accent, borderRadius: Radius.md,
    paddingVertical: 10, alignItems: 'center',
  },
  approveBtnText: { ...Typography.labelMd, color: Colors.background },
  rejectBtn: {
    flex: 1, backgroundColor: 'transparent', borderRadius: Radius.md,
    paddingVertical: 10, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.danger,
  },
  rejectBtnText: { ...Typography.labelMd, color: Colors.danger },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.surface01,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Layout.screenPadding,
    paddingBottom: 40,
    gap: 16,
  },
  modalTitle:   { ...Typography.headingMd, color: Colors.textPrimary },
  sectionLabel: { ...Typography.labelSm, color: Colors.textTertiary },
  chipRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface01,
  },
  chipActive:     { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipText:       { ...Typography.labelMd, color: Colors.textSecondary },
  chipTextActive: { color: Colors.background },
  dateLine:       { ...Typography.monoSm, color: Colors.textTertiary, textAlign: 'center' },
  modalActions:   { flexDirection: 'row', gap: 12, marginTop: 8 },
});
