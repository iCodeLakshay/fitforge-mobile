import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import * as SecureStore from 'expo-secure-store';
import { ConvexReactClient } from 'convex/react';
import {
  useFonts,
  BebasNeue_400Regular,
} from '@expo-google-fonts/bebas-neue';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
  DMMono_400Regular,
  DMMono_500Medium,
} from '@expo-google-fonts/dm-mono';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../stores/auth.store';
import { CONVEX_URL } from '../constants/config';

// ─── Clerk Token Cache ────────────────────────────────────────────────────────
const tokenCache = {
  async getToken(key: string) {
    try {
      const item = await SecureStore.getItemAsync(key);
      if (item) {
        console.log(`${key} was used 🔐 \n`);
      }
      return item;
    } catch (error) {
      console.error("SecureStore get item error: ", error);
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

// ─── Convex client (singleton) ────────────────────────────────────────────────
const convex = new ConvexReactClient(CONVEX_URL, {
  unsavedChangesWarning: false,
});

// ─── Keep splash screen up until fonts loaded ─────────────────────────────────
SplashScreen.preventAutoHideAsync();

// ─── Auth Guard ───────────────────────────────────────────────────────────────
// Source of truth:
//   - Clerk (`useAuth.isSignedIn`): "is there a real session?" — decides login vs app.
//   - Zustand (`useAuthStore`): "which role + gym context?" — decides owner vs member.
// Rules:
//   1. Clerk signed-out but Zustand still has data → drift, clear Zustand.
//   2. Clerk signed-out → force /login if not already in (auth).
//   3. Clerk signed-in but Zustand not yet synced → wait (login.tsx will sync).
//   4. Signed-in + role known → send away from /login and /otp into the correct tab.
//      Leave /onboarding and /join-gym alone — those are intentional post-signin stops.
//   5. Owner in (member) segment or member in (owner) segment → rebound.
function AuthGuard() {
  const router   = useRouter();
  const segments = useSegments();
  const { isSignedIn, isLoaded } = useAuth(); // Clerk
  const { isAuthenticated, isHydrated, role, logout } = useAuthStore();

  useEffect(() => {
    if (!isHydrated || !isLoaded) return;

    const group     = segments[0]; // '(auth)' | '(owner)' | '(member)' | undefined
    const authSub   = group === '(auth)' ? segments[1] : undefined;
    const inAuth    = group === '(auth)';
    const inOwner   = group === '(owner)';
    const inMember  = group === '(member)';

    // 1. Drift cleanup: Clerk session gone but Zustand still "logged in".
    if (!isSignedIn && isAuthenticated) {
      logout();
      return;
    }

    // 2. Fully signed out → always /login.
    if (!isSignedIn) {
      if (!inAuth) router.replace('/(auth)/login');
      return;
    }

    // 3. Clerk in, Zustand still empty — wait for login.tsx → storeUser() → loginSync().
    if (!isAuthenticated || !role) return;

    // 4. Signed in + role known. Bounce away from login/otp only.
    if (authSub === 'login' || authSub === 'otp') {
      router.replace(role === 'owner' ? '/(owner)/dashboard' : '/(member)/home');
      return;
    }

    // 5. Wrong-tab protection.
    if (role === 'owner' && inMember)  router.replace('/(owner)/dashboard');
    if (role === 'member' && inOwner) router.replace('/(member)/home');
  }, [isSignedIn, isLoaded, isAuthenticated, isHydrated, role, segments, logout, router]);

  return null;
}

// ─── Root Layout ──────────────────────────────────────────────────────────────
export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);

  const [fontsLoaded, fontError] = useFonts({
    BebasNeue_400Regular,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    DMMono_400Regular,
    DMMono_500Medium,
  });

  useEffect(() => {
    // Restore persisted auth from MMKV
    hydrate();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
  if (!publishableKey) {
    console.warn("Clerk publishable key is missing. Auth will fail.");
  }

  return (
    <SafeAreaProvider>
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <AuthGuard />
        <StatusBar style="light" backgroundColor="#0A0A0A" />
        <Stack
          screenOptions={{
            headerShown:      false,
            contentStyle:     { backgroundColor: '#0A0A0A' },
            animation:        'fade',
          }}
        >
          <Stack.Screen name="(auth)"   options={{ headerShown: false }} />
          <Stack.Screen name="(owner)"  options={{ headerShown: false }} />
          <Stack.Screen name="(member)" options={{ headerShown: false }} />
        </Stack>
      </ConvexProviderWithClerk>
    </ClerkProvider>
    </SafeAreaProvider>
  );
}
