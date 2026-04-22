import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, Text, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery } from 'convex/react';
import { BanknotesIcon, CreditCardIcon, QrCodeIcon } from 'react-native-heroicons/outline';
import { api } from '../../../convex/_generated/api';
import { useAuthStore } from '../../../stores/auth.store';
import { useUIStore } from '../../../stores/ui.store';
import { Colors } from '../../../constants/colors';
import { Layout, Radius } from '../../../constants/spacing';
import { Typography } from '../../../constants/typography';
import { ScreenHeader, Input, Button, Card } from '../../../components/ui';
import { Id } from '../../../convex/_generated/dataModel';

const PAYMENT_MODES = [
  { key: 'cash', label: 'Cash', Icon: BanknotesIcon },
  { key: 'upi', label: 'UPI', Icon: QrCodeIcon },
  { key: 'card', label: 'Card', Icon: CreditCardIcon },
] as const;

export default function RecordPaymentScreen() {
  const router = useRouter();
  const { memberId: prefillMemberId } = useLocalSearchParams<{ memberId: Id<'users'> }>();
  const { gymId } = useAuthStore();
  const { setLoading, showToast } = useUIStore();
  
  const recordManual = useMutation(api.payments.recordManual);

  // For a complete app, we'd have a dropdown selecting members. 
  // For MVP, if it was launched from a member's profile, we use that.
  // Otherwise, we gracefully handle it (or show an error if not chosen).
  const detail = useQuery(api.members.getDetail, gymId && prefillMemberId ? { gymId: gymId as Id<'gyms'>, memberId: prefillMemberId } : 'skip');
  
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('cash');

  const handleRecord = async () => {
    if (!prefillMemberId || !detail || !detail.membership) {
      return showToast('warning', 'You must initiate this from a specific member profile for now.');
    }
    if (!amount.trim()) return showToast('warning', 'Please enter an amount');
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0 || n > 10_000_000) {
      return showToast('warning', 'Please enter a valid amount');
    }

    try {
      setLoading(true);
      await recordManual({
        gymId: gymId as Id<'gyms'>,
        memberId: prefillMemberId,
        membershipId: detail.membership._id,
        amount: Math.round(n),
        paymentMode: mode,
      });

      showToast('success', 'Payment recorded successfully!');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader 
        title="Record Manual Payment" 
        showBack 
        onBack={() => router.back()} 
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        <Card padding style={styles.card}>
          <Input 
            placeholder="Amount Paid (₹)" 
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
        </Card>

        <Card padding style={styles.card}>
          <View style={styles.modeRow}>
            {PAYMENT_MODES.map(({ key, label, Icon }) => {
              const focused = mode === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.modeChip, focused && styles.modeChipActive]}
                  onPress={() => setMode(key)}
                  activeOpacity={0.75}
                >
                  <Icon
                    size={18}
                    color={focused ? Colors.textOnAccent : Colors.textSecondary}
                    strokeWidth={2}
                  />
                  <Text style={[styles.modeText, focused && styles.modeTextActive]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Save Payment" onPress={handleRecord} />
      </View>
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
  card: {
    gap: 12,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeChip: {
    flex: 1,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface02,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modeChipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  modeText: {
    ...Typography.labelMd,
    color: Colors.textSecondary,
  },
  modeTextActive: {
    color: Colors.textOnAccent,
  },
  footer: {
    padding: Layout.screenPadding,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface01,
  }
});
