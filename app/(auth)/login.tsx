import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useConvexAuth } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Radius, Layout, Spacing } from '../../constants/spacing';
import { showError } from '../../stores/ui.store';
import { useAuthStore } from '../../stores/auth.store';
import { useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router    = useRouter();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const { isAuthenticated } = useConvexAuth();
  const storeUser = useMutation(api.auth.storeUser);
  const loginSync = useAuthStore((s) => s.login);

  // const sendOtp   = useMutation(api.auth.sendOtp);
  // const [phone,   setPhone]   = useState('');
  const [loading, setLoading] = useState(false);
  // const [error,   setError]   = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      storeUser()
        .then((res) => {
          loginSync({ userId: res.userId, role: res.role, gymId: res.gymId });
          setLoading(false);
          if (res.isNewUser) {
            router.replace('/(auth)/onboarding');
          }
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
          showError('Failed to sync user with database');
        });
    }
  }, [isAuthenticated, storeUser, loginSync, router]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL('/(auth)/login'),
      });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      } else {
        setLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      showError(err?.message ?? 'OAuth failed');
      setLoading(false);
    }
  };

  /*
  const handleSend = async () => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      setError('Please enter a valid 10-digit number');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await sendOtp({ phone: `+91${cleaned}` });
      router.push({ pathname: '/(auth)/otp', params: { phone: `+91${cleaned}` } });
    } catch (e: any) {
      showError(e?.message ?? 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };
  */

  return (
    <SafeAreaView style={styles.safe}>
      {/* Subtle lime radial glow — top-right decorative element */}
      <View style={styles.glow} pointerEvents="none" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <View style={styles.top}>
            <Text style={styles.wordmark}>FITFORGE</Text>

            <View style={styles.hero}>
              <Text style={styles.heroMain}>YOUR GYM,</Text>
              <Text style={styles.heroMain}>YOUR RULES.</Text>
              <Text style={styles.heroSub}>Manage smarter. Train harder.</Text>
            </View>
          </View>

          {/* ── Bottom Sheet ── */}
          <View style={styles.sheet}>
            {/* Handle */}
            <View style={styles.handle} />

            <Text style={styles.sheetTitle}>Welcome to FitForge</Text>
            <Text style={styles.sheetSub}>Log in or sign up to continue</Text>

            {/* <View style={styles.phoneRow}>
              <View style={styles.prefix}>
                <Text style={styles.prefixText}>🇮🇳  +91</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  placeholder="98765 43210"
                  keyboardType="numeric"
                  maxLength={10}
                  value={phone}
                  onChangeText={(t) => { setPhone(t.replace(/\D/g, '')); setError(''); }}
                  error={error}
                  style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                />
              </View>
            </View> */}

            {/* CTA */}
            <Button
              label="CONTINUE WITH GOOGLE"
              variant="primary"
              fullWidth
              loading={loading}
              onPress={handleGoogleLogin}
              style={{ marginTop: 8 }}
            />

            <Text style={styles.terms}>
              By continuing you agree to our{' '}
              <Text style={{ color: Colors.accent }}>Terms</Text> &{' '}
              <Text style={{ color: Colors.accent }}>Privacy Policy</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.background },

  // Radial lime glow (top-right decorative)
  glow: {
    position:     'absolute',
    top:          -80,
    right:        -80,
    width:        260,
    height:       260,
    borderRadius: 130,
    backgroundColor: '#C8FF0008',
    shadowColor:  Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 80,
    elevation:    0,
  },

  // Top hero area
  top: {
    flex:              1,
    paddingHorizontal: Layout.screenPadding,
    paddingTop:        Spacing.s6,
    justifyContent:    'space-between',
    paddingBottom:     Spacing.s8,
  },
  wordmark: {
    ...Typography.displaySm,
    color:         Colors.accent,
    letterSpacing: 3,
  },
  hero: { gap: 4 },
  heroMain: {
    ...Typography.displayXl,
    color:         Colors.textPrimary,
    lineHeight:    62,
    letterSpacing: 1,
  },
  heroSub: {
    ...Typography.bodyMd,
    color:      Colors.textSecondary,
    marginTop:  8,
  },

  // Bottom sheet
  sheet: {
    backgroundColor:  Colors.surface01,
    borderTopLeftRadius:  24,
    borderTopRightRadius: 24,
    padding:          Spacing.s6,
    paddingTop:       Spacing.s4,
    gap:              16,
    borderTopWidth:   1,
    borderTopColor:   Colors.border,
  },
  handle: {
    width:           36,
    height:          4,
    borderRadius:    Radius.full,
    backgroundColor: Colors.surface03,
    alignSelf:       'center',
    marginBottom:    8,
  },
  sheetTitle: { ...Typography.headingMd, color: Colors.textPrimary },
  sheetSub:   { ...Typography.bodyMd,   color: Colors.textSecondary, marginTop: -8 },

  // Phone row
  phoneRow: { flexDirection: 'row', gap: 0, alignItems: 'flex-start' },
  prefix: {
    height:            Layout.inputHeight,
    paddingHorizontal: 12,
    backgroundColor:   Colors.surface02,
    borderTopLeftRadius:    Radius.md,
    borderBottomLeftRadius: Radius.md,
    borderWidth:       1,
    borderColor:       Colors.border,
    alignItems:        'center',
    justifyContent:    'center',
    marginBottom:      16, // match Input wrapper margin
  },
  prefixText: { ...Typography.bodyMd, color: Colors.textPrimary },

  terms: {
    ...Typography.bodySm,
    color:     Colors.textTertiary,
    textAlign: 'center',
    marginTop: 4,
  },
});
