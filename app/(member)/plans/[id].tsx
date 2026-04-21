import React, { useState } from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { Colors } from '../../../constants/colors';
import { Layout } from '../../../constants/spacing';
import { Typography } from '../../../constants/typography';
import { ScreenHeader, Button, Card, LoadingOverlay } from '../../../components/ui';

export default function MemberPlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: Id<'aiPlans'> }>();
  const router = useRouter();

  const plan = useQuery(api.plans.getPlan, id ? { planId: id } : 'skip');
  const [tab, setTab] = useState<'workout' | 'meal'>('workout');

  if (plan === undefined) {
    return <LoadingOverlay message="Loading your plan..." />;
  }

  if (!plan) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Plan Details" showBack onBack={() => router.back()} />
        <Text style={{ ...Typography.bodyMd, color: Colors.textSecondary, textAlign: 'center', marginTop: 40 }}>
          Plan not found.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Plan Detail" showBack onBack={() => router.back()} />

      <View style={styles.tabContainer}>
        <Button 
          title="Workout Plan" 
          variant={tab === 'workout' ? 'primary' : 'secondary'}
          onPress={() => setTab('workout')}
          style={styles.tabBtn}
        />
        <Button 
          title="Meal Plan" 
          variant={tab === 'meal' ? 'primary' : 'secondary'}
          onPress={() => setTab('meal')}
          style={styles.tabBtn}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Card padding style={styles.contentCard}>
          <Text style={styles.markdownText}>
            {tab === 'workout' ? plan.content?.workoutPlan : plan.content?.mealPlan}
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: Layout.screenPadding,
    gap: 8,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Layout.screenPadding * 2,
  },
  contentCard: {
    minHeight: 300,
  },
  markdownText: {
    ...Typography.bodyMd,
    color: Colors.textPrimary,
    lineHeight: 24,
  }
});
