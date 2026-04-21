import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { api } from '../../../convex/_generated/api';
import { useAuthStore } from '../../../stores/auth.store';
import { Id } from '../../../convex/_generated/dataModel';
import { Colors } from '../../../constants/colors';
import { Layout } from '../../../constants/spacing';
import { ScreenHeader, Button, EmptyState, MemberCard, LoadingOverlay } from '../../../components/ui';

export default function AttendanceScreen() {
  const router = useRouter();
  const { gymId } = useAuthStore();
  
  const todayCheckIns = useQuery(api.attendance.listToday, gymId ? { gymId: gymId as Id<'gyms'> } : 'skip');

  if (todayCheckIns === undefined) {
    return <LoadingOverlay message="Loading check-ins..." />;
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="TODAY'S ATTENDANCE" />
      
      <View style={styles.actions}>
        <Button
          title="Scan QR Code"
          onPress={() => router.push('/attendance/scan')}
        />
        <Button
          title="Manual Entry"
          variant="secondary"
          onPress={() => {}}
        />
      </View>
      
      <FlatList
        data={todayCheckIns}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <MemberCard
            name={item.user?.name || 'Unknown'}
            status="active" // They checked in, assuming status is ok for simplicity here
            phone={new Date(item.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} // Reusing phone slot for time
            onPress={() => router.push(`/members/${item.memberId}`)}
          />
        )}
        ListEmptyComponent={
           <EmptyState 
             icon="time-outline"
             title="No Check-ins Yet"
             subtitle="Scan member QR codes to log attendance"
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
    gap: 12,
    marginBottom: 16,
  },
  listContent: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Layout.screenPadding * 2,
    gap: 12,
  }
});
