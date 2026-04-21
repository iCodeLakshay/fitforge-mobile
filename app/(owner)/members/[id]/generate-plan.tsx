

import React, { useState } from 'react';
import { View, ScrollView, Text, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useAction } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { Colors } from '../../../../constants/colors';
import { Layout } from '../../../../constants/spacing';
import { Typography } from '../../../../constants/typography';
import { ScreenHeader, Button, Card, LoadingOverlay } from '../../../../components/ui';
import { useAuthStore } from '../../../../stores/auth.store';
import { useUIStore } from '../../../../stores/ui.store';

export default function GeneratePlanScreen() {
  const { id } = useLocalSearchParams<{ id: Id<'users'> }>();
  const router = useRouter();
  const { gymId, userId } = useAuthStore();
  const { setLoading, showToast } = useUIStore();

  const healthProfile = useQuery(api.healthProfiles.get, gymId && id ? { gymId: gymId as Id<'gyms'>, memberId: id } : 'skip');
  const generatePlan = useAction(api.plans.generatePlan);

  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [experience, setExperience] = useState('beginner');

  if (healthProfile === undefined) {
    return <LoadingOverlay message="Loading profile data..." />;
  }
  
  if (!healthProfile) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Generate AI Plan" showBack onBack={() => router.back()} />
        <View style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
          <Text style={{ ...Typography.headingSm, color: Colors.textPrimary, textAlign: 'center' }}>
            Physical Profile Missing
          </Text>
          <Text style={{ ...Typography.bodyMd, color: Colors.textSecondary, textAlign: 'center' }}>
            A complete physical profile (age, weight, height) is required to generate an accurate AI plan.
          </Text>
          <Button 
            title="Update Physical Profile" 
            onPress={() => router.replace(`/members/${id}/health-profile`)} 
          />
        </View>
      </View>
    );
  }

  const handleGenerate = async () => {
    try {
      setLoading(true);
      showToast('info', 'Generating AI plan... This may take up to 30 seconds.');
      
      const planId = await generatePlan({
        gymId: gymId as Id<'gyms'>,
        memberId: id,
        membershipId: healthProfile.membershipId,
        promptData: {
          age: healthProfile.age ?? 0,
          weight: healthProfile.weightKg ?? 0,
          height: healthProfile.heightCm ?? 0,
          goal: healthProfile.physiqueGoal ?? '',
          diet: healthProfile.dietaryPreference ?? '',
          medical: healthProfile.medicalConditions,
          daysPerWeek,
          experience,
        }
      });

      showToast('success', 'Plan Generated successfully!');
      router.replace(`/members/${id}/plan-result?planId=${planId}`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to generate plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="AI Plan Setup" showBack onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Profile Recap */}
        <Card padding style={styles.card}>
          <Text style={styles.sectionTitle}>Client Context</Text>
          <Text style={styles.recapText}>Age: {healthProfile.age} | Weight: {healthProfile.weightKg}kg | Height: {healthProfile.heightCm}cm</Text>
          <Text style={styles.recapText}>Goal: {(healthProfile.physiqueGoal ?? '').replace('_', ' ').toUpperCase()}</Text>
          <Text style={styles.recapText}>Diet: {(healthProfile.dietaryPreference ?? '').toUpperCase()}</Text>
          {healthProfile.medicalConditions && (
            <Text style={[styles.recapText, { color: Colors.warning, marginTop: 4 }]}>
              Medical: {healthProfile.medicalConditions}
            </Text>
          )}
          <Button
            title="Edit Context"
            variant="ghost"
            onPress={() => router.push(`/members/${id}/health-profile`)}
            style={{ alignSelf: 'flex-start', marginTop: 8 }}
          />
        </Card>

        {/* Workout Parameters */}
        <Card padding style={styles.card}>
          <Text style={styles.sectionTitle}>Experience Level</Text>
          <View style={styles.row}>
            {['beginner', 'intermediate', 'advanced'].map(lvl => (
              <Button 
                key={lvl}
                title={lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                variant={experience === lvl ? 'primary' : 'secondary'}
                onPress={() => setExperience(lvl)}
                style={{ flex: 1 }}
              />
            ))}
          </View>
        </Card>

        <Card padding style={styles.card}>
          <Text style={styles.sectionTitle}>Days per Week</Text>
          <View style={styles.rowWrap}>
            {[2,3,4,5,6].map(days => (
              <Button 
                key={days}
                title={`${days} Days`}
                variant={daysPerWeek === days ? 'primary' : 'secondary'}
                onPress={() => setDaysPerWeek(days)}
                style={{ width: '31%', paddingVertical: 8 }}
              />
            ))}
          </View>
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Generate AI Plan" onPress={handleGenerate} />
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
  recapText: {
    ...Typography.bodyMd,
    color: Colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  footer: {
    padding: Layout.screenPadding,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface01,
  }
});
