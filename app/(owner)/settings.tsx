import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Text, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { ScreenHeader, Button, Card, Input, LoadingOverlay } from '../../components/ui';
import { useAuthStore } from '../../stores/auth.store';
import { Id } from '../../convex/_generated/dataModel';
import { useUIStore } from '../../stores/ui.store';
import { useSignOut } from '../../hooks/useSignOut';

export default function OwnerSettingsScreen() {
  const router = useRouter();
  const { gymId } = useAuthStore();
  const signOut = useSignOut();
  const { showToast } = useUIStore();

  const gym = useQuery(api.gym.getGym, gymId ? { gymId: gymId as Id<'gyms'> } : 'skip');
  const updateName = useMutation(api.gym.updateName);

  const [editName, setEditName] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const handleLogout = async () => {
    await signOut();
    // AuthGuard handles the redirect.
  };

  const handleShareCode = async () => {
    if (!gym?.gymCode) return;
    try {
      await Share.share({
        message: `Join my gym on FitForge! \nInvite Code: ${gym.gymCode}`,
      });
    } catch (error) {
      showToast('error', 'Error sharing invite code');
    }
  };

  const handleSaveName = async () => {
    if (!editName.trim() || !gymId) return;
    try {
      await updateName({ gymId: gymId as Id<'gyms'>, name: editName });
      setIsEditing(false);
      showToast('success', 'Gym name updated!');
    } catch (error) {
      showToast('error', 'Failed to update name');
    }
  };

  if (gym === undefined) {
    return <LoadingOverlay message="Loading settings..." />;
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="SETTINGS" />
      
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card padding style={styles.card}>
          <Text style={styles.label}>Gym Name</Text>
          {isEditing ? (
            <View style={{ gap: 8 }}>
              <Input 
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter gym name"
              />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button title="Cancel" variant="secondary" onPress={() => setIsEditing(false)} style={{ flex: 1 }} />
                <Button title="Save" onPress={handleSaveName} style={{ flex: 1 }} />
              </View>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ ...Typography.bodyMd, color: Colors.textPrimary }}>
                {gym?.name || "My Gym"}
              </Text>
              <Button 
                title="Edit" 
                variant="secondary" 
                onPress={() => {
                  setEditName(gym?.name || '');
                  setIsEditing(true);
                }} 
              />
            </View>
          )}
        </Card>

        <Card padding style={styles.card}>
          <Text style={styles.label}>Invite Code</Text>
          <Text style={{ ...Typography.bodySm, color: Colors.textSecondary, marginBottom: 8 }}>
            Share this code with your members so they can join your gym.
          </Text>
          <View style={styles.codeRow}>
            <Text style={styles.gymCode}>{gym?.gymCode}</Text>
            <Button title="Share" onPress={handleShareCode} />
          </View>
        </Card>

        <Card padding style={styles.card}>
          <Text style={styles.label}>AI Subscription</Text>
          <Text style={{ ...Typography.bodySm, color: Colors.textSecondary, marginBottom: 8 }}>
            Current Tier: <Text style={{ color: Colors.accent }}>Free</Text>
          </Text>
          <Text style={{ ...Typography.bodyMd, color: Colors.textPrimary }}>
            Plan: {gym?.fitforgePlan?.toUpperCase() ?? 'FREE'}
          </Text>
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Log Out" variant="danger" onPress={handleLogout} />
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
    gap: 8,
  },
  label: {
    ...Typography.labelSm,
    color: Colors.textSecondary,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface02,
    padding: 12,
    borderRadius: 8,
  },
  gymCode: {
    ...Typography.monoLg,
    color: Colors.accent,
    letterSpacing: 2,
  },
  footer: {
    padding: Layout.screenPadding,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface01,
  }
});
