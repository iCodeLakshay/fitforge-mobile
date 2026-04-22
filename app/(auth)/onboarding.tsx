import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { StepProgress } from '../../components/ui/Progress';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Radius, Layout, Spacing } from '../../constants/spacing';
import { useAuthStore } from '../../stores/auth.store';
import { showError } from '../../stores/ui.store';

type Step = 'role' | 'gym_setup';

export default function OnboardingScreen() {
  const router        = useRouter();
  const { login } = useAuthStore();
  const createGym     = useMutation(api.gyms.create);

  const [step,      setStep]      = useState<Step>('role');
  const [loading,   setLoading]   = useState(false);
  const [gymName,   setGymName]   = useState('');
  const [gymCity,   setGymCity]   = useState('');
  const [gymErrors, setGymErrors] = useState({ name: '', city: '' });

  const handleSelectOwner = () => {
    setStep('gym_setup');
  };

  const handleSelectMember = async () => {
    await login({ role: 'member' });
    router.replace('/(auth)/join-gym');
  };

  const handleCreateGym = async () => {
    const errors = { name: '', city: '' };
    if (!gymName.trim()) errors.name = 'Gym name is required';
    if (!gymCity.trim()) errors.city = 'City is required';
    if (errors.name || errors.city) { setGymErrors(errors); return; }

    setLoading(true);
    try {
      const result = await createGym({ name: gymName.trim(), city: gymCity.trim() });
      // Update Zustand with owner role + gymId. AuthGuard sees the role change
      // while we're on an (auth) screen that's not /login, so it won't bounce us.
      // Explicit replace guarantees navigation regardless of guard timing.
      await login({ role: 'owner', gymId: result.gymId });
      router.replace('/(owner)/dashboard');
    } catch (e: any) {
      showError(e?.message ?? 'Failed to create gym');
    } finally {
      setLoading(false);
    }
  };

  const stepIndex = step === 'role' ? 1 : 2;

  return (
    <SafeAreaView style={styles.safe}>
      <StepProgress total={2} current={stepIndex} />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {step === 'role' && (
          <>
            <Text style={styles.title}>I AM A...</Text>
            <Text style={styles.sub}>Choose your role to get started</Text>

            <TouchableOpacity style={styles.roleCard} onPress={handleSelectOwner} activeOpacity={0.7}>
              <Text style={styles.roleIcon}>🏋️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.roleTitle}>GYM OWNER / TRAINER</Text>
                <Text style={styles.roleSub}>Manage your gym, members, attendance, and AI fitness plans</Text>
              </View>
              <View style={styles.roleChevron}><Text style={{ color: Colors.accent }}>›</Text></View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.roleCard} onPress={handleSelectMember} activeOpacity={0.7}>
              <Text style={styles.roleIcon}>💪</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.roleTitle}>GYM MEMBER</Text>
                <Text style={styles.roleSub}>Track attendance, view AI workout & meal plans from your gym</Text>
              </View>
              <View style={styles.roleChevron}><Text style={{ color: Colors.accent }}>›</Text></View>
            </TouchableOpacity>
          </>
        )}

        {step === 'gym_setup' && (
          <>
            <Text style={styles.title}>SET UP YOUR GYM</Text>
            <Text style={styles.sub}>We'll create your gym profile and a unique join code</Text>

            <Input
              label="Gym Name"
              placeholder="e.g. Iron House Fitness"
              value={gymName}
              onChangeText={(t) => { setGymName(t); setGymErrors((e) => ({ ...e, name: '' })); }}
              error={gymErrors.name}
            />
            <Input
              label="City"
              placeholder="e.g. Mumbai"
              value={gymCity}
              onChangeText={(t) => { setGymCity(t); setGymErrors((e) => ({ ...e, city: '' })); }}
              error={gymErrors.city}
            />

            <Button
              label="CREATE GYM →"
              variant="primary"
              fullWidth
              loading={loading}
              onPress={handleCreateGym}
              style={{ marginTop: 8 }}
            />
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Layout.screenPadding, paddingTop: Spacing.s8, gap: 16, paddingBottom: 40 },

  title: { ...Typography.displayMd, color: Colors.textPrimary },
  sub:   { ...Typography.bodyMd,   color: Colors.textSecondary },

  roleCard: {
    flexDirection:    'row',
    alignItems:       'center',
    backgroundColor:  Colors.surface01,
    borderRadius:     Radius.lg,
    padding:          Layout.cardPaddingV,
    paddingHorizontal: Layout.cardPaddingH,
    borderWidth:      1,
    borderColor:      Colors.border,
    gap:              16,
  },
  roleIcon:    { fontSize: 32 },
  roleTitle:   { ...Typography.headingSm, color: Colors.textPrimary },
  roleSub:     { ...Typography.bodySm,   color: Colors.textSecondary, marginTop: 2 },
  roleChevron: { paddingLeft: 8 },

});
