import { useAuth } from '@clerk/clerk-expo';
import { useAuthStore } from '../stores/auth.store';

/**
 * Signs the user out from BOTH Clerk and the local Zustand store.
 * Always use this instead of calling `authStore.logout()` alone — otherwise
 * Clerk's session persists and auto-signs the user back in on next launch.
 *
 * AuthGuard will route the user to /(auth)/login after state clears.
 */
export function useSignOut() {
  const { signOut } = useAuth();
  const logout = useAuthStore((s) => s.logout);

  return async () => {
    try {
      await signOut();
    } catch (e) {
      console.error('[useSignOut] Clerk signOut failed:', e);
    }
    await logout();
  };
}
