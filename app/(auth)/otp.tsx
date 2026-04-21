/**
 * OTP screen — DEPRECATED.
 * Legacy phone/OTP auth has been replaced by Clerk Google OAuth.
 * This file is kept as a safe stub so the route doesn't crash the bundler.
 * The full implementation is preserved in git history if needed.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Button } from '../../components/ui/Button';

export default function OTPScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>This screen is deprecated.</Text>
      <Button label="GO BACK" onPress={() => router.replace('/(auth)/login')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  title: {
    ...Typography.bodyMd,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
