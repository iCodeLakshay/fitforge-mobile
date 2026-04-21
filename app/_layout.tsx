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
function AuthGuard() {
  const router   = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isHydrated, role } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) return;

    const inAuth     = segments[0] === '(auth)';
    const inOwner    = segments[0] === '(owner)';
    const inMember   = segments[0] === '(member)';

    if (!isAuthenticated && !inAuth) {
      // Not logged in → send to login
      router.replace('/(auth)/login');
    } else if (isAuthenticated) {
      if (role === 'owner' && !inOwner) {
        router.replace('/(owner)/dashboard');
      } else if (role === 'member' && !inMember) {
        router.replace('/(member)/home');
      }
    }
  }, [isAuthenticated, isHydrated, role, segments]);

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
  );
}
