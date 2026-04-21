import React, { useState } from 'react';
import { View, ScrollView, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuthStore } from '../../../stores/auth.store';
import { useUIStore } from '../../../stores/ui.store';
import { Colors } from '../../../constants/colors';
import { Layout } from '../../../constants/spacing';
import { Typography } from '../../../constants/typography';
import { ScreenHeader, Input, Button, Card } from '../../../components/ui';
import { SUBSCRIPTION_DURATIONS } from '../../../constants/config';
import { Id } from '../../../convex/_generated/dataModel';

export default function AddMemberScreen() {
  const router = useRouter();
  const { gymId, userId } = useAuthStore();
  const { setLoading, showToast } = useUIStore();
  
  const addMember = useMutation(api.members.add);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(30); // days

  const handleAdd = async () => {
    if (!name.trim()) return showToast('warning', 'Please enter member name');
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) return showToast('warning', 'Please enter a valid phone number');

    let amountPaid: number | undefined;
    if (amount.trim()) {
      const n = Number(amount);
      if (!Number.isFinite(n) || n <= 0 || n > 10_000_000) {
        return showToast('warning', 'Please enter a valid amount');
      }
      amountPaid = Math.round(n);
    }

    try {
      setLoading(true);

      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + selectedDuration * 24 * 60 * 60 * 1000);

      await addMember({
        gymId: gymId as Id<'gyms'>,
        addedBy: userId as Id<'users'>,
        name: name.trim(),
        phone: phoneDigits,
        subscriptionType: selectedDuration === 30 ? 'monthly' : selectedDuration === 90 ? 'quarterly' : 'yearly',
        amountPaid,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      });

      showToast('success', 'Member added successfully!');
      router.back();

    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader 
        title="Add Member" 
        showBack 
        onBack={() => router.back()} 
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        <Card padding style={styles.card}>
          <Text style={styles.sectionTitle}>Basic Detail</Text>
          <Input 
            placeholder="Full Name" 
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <Input 
            placeholder="Phone Number" 
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={10}
          />
        </Card>

        <Card padding style={styles.card}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          <View style={styles.durations}>
            {SUBSCRIPTION_DURATIONS.map(dur => (
              <Button
                key={dur.key}
                variant={selectedDuration === dur.days ? 'primary' : 'secondary'}
                title={dur.label}
                onPress={() => setSelectedDuration(dur.days)}
                style={styles.durationBtn}
              />
            ))}
          </View>

          <Input 
            placeholder="Amount Paid (₹) - Optional" 
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Save Member" onPress={handleAdd} />
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
  sectionTitle: {
    ...Typography.headingSm,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  durations: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  durationBtn: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 10,
  },
  footer: {
    padding: Layout.screenPadding,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface01,
  }
});
