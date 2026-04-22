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
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Radius, Layout, Spacing } from '../../constants/spacing';
import { useAuthStore } from '../../stores/auth.store';
import { showError, showSuccess } from '../../stores/ui.store';

export default function JoinGymScreen() {
  const router = useRouter();
  const { setGymContext } = useAuthStore();
  const requestJoin = useMutation(api.members.requestJoin);

  const [gymCode, setGymCode]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [gymName, setGymName]   = useState('');

  const handleJoin = async () => {
    const code = gymCode.trim().toUpperCase();
    if (!code) return showError('Please enter a gym code');
    if (code.length < 4) return showError('Invalid gym code format');

    setLoading(true);
    try {
      const result = await requestJoin({ gymCode: code });
      setGymName(result.gymName);
      await setGymContext(result.gymId);
      setSubmitted(true);
    } catch (e: any) {
      showError(e?.message ?? 'Failed to submit join request');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.successIcon}>
            <Text style={{ fontSize: 48 }}>✅</Text>
          </View>
          <Text style={styles.title}>REQUEST SENT!</Text>
          <Text style={styles.sub}>
            Your join request for <Text style={{ color: Colors.accent }}>{gymName}</Text> has been submitted. Your owner will approve it shortly.
          </Text>

          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>📲</Text>
            <Text style={styles.infoText}>
              Once approved, you'll see your membership details on your home screen.
            </Text>
          </View>

          <Button
            label="GO TO HOME →"
            variant="primary"
            fullWidth
            onPress={() => router.replace('/(member)/home')}
            style={{ marginTop: 8 }}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={{ color: Colors.accent, ...Typography.bodyMd }}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>JOIN YOUR GYM</Text>
        <Text style={styles.sub}>Enter the GYM-XXXXX code shared by your gym owner</Text>

        <Input
          label="Gym Code"
          placeholder="e.g. GYM-RK92X"
          value={gymCode}
          onChangeText={(t) => setGymCode(t.toUpperCase())}
          autoCapitalize="characters"
          autoCorrect={false}
        />

        <Button
          label="SEND JOIN REQUEST →"
          variant="primary"
          fullWidth
          loading={loading}
          onPress={handleJoin}
          style={{ marginTop: 8 }}
        />

        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            Don't have a code? Ask your gym owner to share it from{' '}
            <Text style={{ color: Colors.accent }}>Settings → Gym Code</Text> in the FitForge Owner app.
          </Text>
        </View>

        <Button
          label="SKIP FOR NOW"
          variant="ghost"
          fullWidth
          onPress={() => router.replace('/(member)/home')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Layout.screenPadding, paddingTop: Spacing.s4, gap: 16, paddingBottom: 40 },

  backBtn: { paddingVertical: 8 },

  title: { ...Typography.displayMd, color: Colors.textPrimary },
  sub:   { ...Typography.bodyMd,    color: Colors.textSecondary },

  successIcon: { alignItems: 'center', paddingVertical: 24 },

  infoCard: {
    flexDirection:    'row',
    backgroundColor:  Colors.surface01,
    borderRadius:     Radius.lg,
    padding:          Layout.cardPaddingH,
    borderWidth:      1,
    borderColor:      Colors.border,
    gap:              12,
    alignItems:       'flex-start',
    marginTop:        8,
  },
  infoIcon: { fontSize: 20 },
  infoText: { ...Typography.bodyMd, color: Colors.textSecondary, flex: 1 },
});
