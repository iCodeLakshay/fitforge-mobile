import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { Colors } from '../../../../constants/colors';
import { Typography } from '../../../../constants/typography';
import { Layout, Radius } from '../../../../constants/spacing';
import { ScreenHeader, Button, Input, Card, LoadingOverlay, Avatar } from '../../../../components/ui';
import { useAuthStore } from '../../../../stores/auth.store';
import { showError, showSuccess } from '../../../../stores/ui.store';

export default function EditProfileScreen() {
  const { id } = useLocalSearchParams<{ id: Id<'users'> }>();
  const { gymId } = useAuthStore();
  const router = useRouter();

  const detail      = useQuery(api.members.getDetail, gymId && id ? { gymId: gymId as Id<'gyms'>, memberId: id } : 'skip');
  const editProfile = useMutation(api.members.editProfile);

  const [name,    setName]    = useState('');
  const [dob,     setDob]     = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (detail?.user) {
      setName(detail.user.name ?? '');
      setDob(detail.user.dob ?? '');
    }
  }, [detail]);

  const handleSave = async () => {
    if (!gymId || !id) return;
    if (!name.trim()) return showError('Name is required');

    setLoading(true);
    try {
      await editProfile({
        gymId:    gymId as Id<'gyms'>,
        memberId: id as Id<'users'>,
        name:     name.trim(),
        dob:      dob.trim() || undefined,
      });
      showSuccess('Profile updated!');
      router.back();
    } catch (e: any) {
      showError(e?.message ?? 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoPlaceholder = () => {
    Alert.alert(
      'Photo Upload',
      'Photo upload will be available in the full build (requires camera permission setup).',
      [{ text: 'OK' }]
    );
  };

  if (detail === undefined) return <LoadingOverlay message="Loading..." />;
  if (!detail) return null;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Edit Profile" showBack onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Photo placeholder */}
        <View style={styles.photoSection}>
          <Avatar name={detail.user?.name ?? '?'} size={80} />
          <TouchableOpacity style={styles.photoBtn} onPress={handlePhotoPlaceholder} activeOpacity={0.7}>
            <Text style={styles.photoBtnText}>CHANGE PHOTO</Text>
            <Text style={styles.photoBtnSub}>Coming in full build</Text>
          </TouchableOpacity>
        </View>

        <Card padding style={styles.section}>
          <Text style={styles.sectionLabel}>BASIC INFO</Text>
          <Input
            label="Full Name"
            placeholder="e.g. Rahul Sharma"
            value={name}
            onChangeText={setName}
          />
          <Input
            label="Date of Birth"
            placeholder="YYYY-MM-DD"
            value={dob}
            onChangeText={setDob}
            keyboardType="numeric"
          />
          <Text style={styles.hint}>Phone number cannot be changed here.</Text>
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Save Profile" onPress={handleSave} loading={loading} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll:    { padding: Layout.screenPadding, gap: 16, paddingBottom: 40 },

  photoSection: { alignItems: 'center', gap: 12, paddingVertical: 16 },
  photoBtn: {
    alignItems:      'center',
    backgroundColor: Colors.surface01,
    borderRadius:    Radius.md,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderWidth:     1,
    borderColor:     Colors.border,
    borderStyle:     'dashed',
  },
  photoBtnText: { ...Typography.labelMd, color: Colors.textSecondary },
  photoBtnSub:  { ...Typography.bodySm,  color: Colors.textTertiary },

  section:      { gap: 12 },
  sectionLabel: { ...Typography.labelSm, color: Colors.textTertiary },
  hint:         { ...Typography.bodySm,  color: Colors.textTertiary },

  footer: {
    padding:         Layout.screenPadding,
    borderTopWidth:  1,
    borderTopColor:  Colors.border,
    backgroundColor: Colors.surface01,
  },
});
