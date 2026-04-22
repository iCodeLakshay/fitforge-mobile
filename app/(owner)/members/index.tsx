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

function toTitleFromHandle(raw: string) {
  return raw
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function getMemberIdentity(user?: { name?: string; phone?: string; email?: string } | null) {
  const name = (user?.name ?? '').trim();
  const email = (user?.email ?? '').trim();
  const phoneOrId = (user?.phone ?? '').trim();
  const source = email || phoneOrId;

  if (name) {
    return {
      displayName: name,
      secondary: source,
    };
  }

  if (source.includes('@')) {
    return {
      displayName: toTitleFromHandle(source.split('@')[0]),
      secondary: source,
    };
  }

  if (source.startsWith('user_')) {
    return {
      displayName: 'New Member',
      secondary: source.length > 24 ? `${source.slice(0, 24)}...` : source,
    };
  }

  if (source) {
    return {
      displayName: source,
      secondary: source,
    };
  }

  return {
    displayName: 'Unknown Member',
    secondary: '',
  };
}

export default function MembersListScreen() {
  const router = useRouter();
  const { gymId } = useAuthStore();
  const [search, setSearch] = useState('');

  const rawMembers = useQuery(api.members.list, gymId ? { gymId: gymId as Id<'gyms'> } : 'skip');

  if (rawMembers === undefined) {
    return <LoadingOverlay message="Loading members..." />;
  }

  const members = rawMembers.filter(m => {
    const identity = getMemberIdentity(m.user);
    return (
      identity.displayName.toLowerCase().includes(search.toLowerCase()) ||
      identity.secondary.toLowerCase().includes(search.toLowerCase())
    );
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
        renderItem={({ item }) => {
          const identity = getMemberIdentity(item.user);

          return (
            <MemberCard
              name={identity.displayName}
              phone={identity.secondary}
              status={item.status}
              daysLeft={getDaysLeft(item.endDate)}
              onPress={() => router.push(`/members/${item.memberId}`)}
            />
          );
        }}
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
