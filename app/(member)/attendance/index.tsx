import React from 'react';
import { View, FlatList, StyleSheet, Text } from 'react-native';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuthStore } from '../../../stores/auth.store';
import { Id } from '../../../convex/_generated/dataModel';
import { Colors } from '../../../constants/colors';
import { Layout } from '../../../constants/spacing';
import { Typography } from '../../../constants/typography';
import { ScreenHeader, EmptyState, LoadingOverlay } from '../../../components/ui';

export default function MemberAttendanceScreen() {
  const history = useQuery(api.attendance.listForMember, {});

  if (history === undefined) {
    return <LoadingOverlay message="Loading attendance history..." />;
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="ATTENDANCE" />
      
      <FlatList
        data={history}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.iconBox}>
              <Text style={{ fontSize: 20 }}>✅</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.title}>Checked In</Text>
              <Text style={styles.date}>
                {new Date(item.checkInAt).toLocaleDateString('en-IN', {
                  weekday: 'short', month: 'short', day: 'numeric'
                })} at {new Date(item.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
           <EmptyState 
             icon="calendar-outline"
             title="No Check-ins Yet"
             subtitle="Scan the QR code at your gym to check in."
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
