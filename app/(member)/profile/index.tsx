import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Colors } from '../../../constants/colors';
import { Layout } from '../../../constants/spacing';
import { ScreenHeader, Button, Card } from '../../../components/ui';
import { Typography } from '../../../constants/typography';
import { Text } from 'react-native';
import { useSignOut } from '../../../hooks/useSignOut';
import { useAuth } from '@clerk/clerk-expo';

export default function MemberProfileScreen() {
  const { userId } = useAuth();
  const signOut = useSignOut();

  const handleLogout = async () => {
    await signOut();
    // AuthGuard handles the redirect.
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="PROFILE" />
      
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>YOU</Text>
          </View>
        </View>
        
        <Card padding style={{ gap: 4 }}>
          <Text style={{ ...Typography.labelSm, color: Colors.textSecondary }}>Phone Number</Text>
          <Text style={{ ...Typography.bodyMd, color: Colors.textPrimary }}>Not available</Text>
        </Card>

        {/* Member ID (truncated for copying maybe) */}
        <Card padding style={{ gap: 4 }}>
          <Text style={{ ...Typography.labelSm, color: Colors.textSecondary }}>User ID</Text>
          <Text style={{ ...Typography.monoSm, color: Colors.textPrimary }}>{userId}</Text>
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
  avatarWrap: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface02,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  avatarText: {
    ...Typography.headingMd,
    color: Colors.textPrimary,
  },
  footer: {
    padding: Layout.screenPadding,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface01,
  }
});
