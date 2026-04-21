import React, { useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useAuthStore } from '../../../stores/auth.store';
import { Colors } from '../../../constants/colors';
import { Layout } from '../../../constants/spacing';
import { ScreenHeader, SearchInput, MemberCard, EmptyState, LoadingOverlay, Button } from '../../../components/ui';
import { getDaysLeft } from '../../../utils/date';

export default function MembersListScreen() {
  const router = useRouter();
  const { gymId } = useAuthStore();
  const [search, setSearch] = useState('');

  const rawMembers = useQuery(api.members.list, gymId ? { gymId: gymId as Id<'gyms'> } : 'skip');

  if (rawMembers === undefined) {
    return <LoadingOverlay message="Loading members..." />;
  }

  const members = rawMembers.filter(m => {
    const name = m.user?.name ?? '';
    const phone = m.user?.phone ?? '';
    return name.toLowerCase().includes(search.toLowerCase()) || phone.includes(search);
  });

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="MEMBERS"
        right={<Button title="Add New" size="sm" variant="secondary" onPress={() => router.push('/members/add')} />}
      />

      {rawMembers.length > 0 ? (
        <View style={styles.searchContainer}>
          <SearchInput
            placeholder="Search by name or phone..."
            value={search}
            onChangeText={setSearch}
          />
        </View>
      ) : null}

      <FlatList
        data={members}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <MemberCard
            name={item.user?.name ?? 'Unknown'}
            phone={item.user?.phone ?? ''}
            status={item.status}
            daysLeft={getDaysLeft(item.endDate)}
            onPress={() => router.push(`/members/${item._id}`)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <EmptyState
              icon="people-outline"
              title={rawMembers.length === 0 ? "No Members Yet" : "No Results"}
              subtitle={
                rawMembers.length === 0
                  ? "Start by adding your first gym member."
                  : "No members match your search criteria."
              }
              action={
                rawMembers.length === 0
                  ? <Button title="Add Member" onPress={() => router.push('/members/add')} />
                  : <Button title="Clear Search" variant="secondary" onPress={() => setSearch('')} />
              }
            />
          </View>
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
  searchContainer: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: 16,
  },
  listContent: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Layout.screenPadding * 3,
    gap: 12,
  },
  emptyWrap: {
    marginTop: 40,
  }
});
