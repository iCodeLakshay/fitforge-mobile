import React from 'react';
import { View, FlatList, StyleSheet, Text, Pressable } from 'react-native';
import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { api } from '../../../convex/_generated/api';
import { useAuthStore } from '../../../stores/auth.store';
import { Id } from '../../../convex/_generated/dataModel';
import { Colors } from '../../../constants/colors';
import { Layout } from '../../../constants/spacing';
import { Typography } from '../../../constants/typography';
import { ScreenHeader, EmptyState, LoadingOverlay } from '../../../components/ui';
import { formatTimestamp } from '../../../utils/date';

export default function PlansListScreen() {
  const router = useRouter();
  const { gymId } = useAuthStore();

  const plans = useQuery(api.plans.listForMember, gymId ? { gymId: gymId as Id<'gyms'> } : 'skip');

  if (plans === undefined) {
    return <LoadingOverlay message="Loading plans..." />;
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="MY PLANS" />
      
      <FlatList
        data={plans}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/plans/${item._id}`)}>
            <View style={styles.iconBox}>
              <Text style={{ fontSize: 20 }}>🦾</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.title}>AI Plan #{plans.length - index}</Text>
              <Text style={styles.date}>Generated on {formatTimestamp(item._creationTime)}</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
           <EmptyState 
             icon="document-text-outline"
             title="No Plans Yet"
             subtitle="Ask your gym owner to generate a personalized AI workout and meal plan for you."
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
  listContent: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Layout.screenPadding * 2,
    gap: 12,
  },
  card: {
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
  title: {
    ...Typography.headingSm,
    color: Colors.textPrimary,
  },
  date: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
