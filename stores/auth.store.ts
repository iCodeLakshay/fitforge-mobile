import { create } from 'zustand';
import { storageService } from '../services/storage.service';

interface AuthState {
  userId: string | null;
  role: 'owner' | 'member' | null;
  gymId: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;

  login: (params: { userId: string; role: 'owner' | 'member'; gymId?: string }) => Promise<void>;
  logout: () => Promise<void>;
  setGymContext: (gymId: string) => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  role: null,
  gymId: null,
  isAuthenticated: false,
  isHydrated: false,

  login: async ({ userId, role, gymId }) => {
    await storageService.setString('auth.userId', userId);
    await storageService.setString('auth.role', role);
    if (gymId) await storageService.setString('auth.gymId', gymId);
    set({ userId, role, gymId: gymId ?? null, isAuthenticated: true });
  },

  logout: async () => {
    await storageService.delete('auth.userId');
    await storageService.delete('auth.role');
    await storageService.delete('auth.gymId');
    set({ userId: null, role: null, gymId: null, isAuthenticated: false });
  },

  setGymContext: async (gymId) => {
    await storageService.setString('auth.gymId', gymId);
    set({ gymId });
  },

  hydrate: async () => {
    const userId = await storageService.getString('auth.userId');
    const role = (await storageService.getString('auth.role')) as 'owner' | 'member' | null;
    const gymId = await storageService.getString('auth.gymId');
    set({
      userId: userId ?? null,
      role: role ?? null,
      gymId: gymId ?? null,
      isAuthenticated: !!userId,
      isHydrated: true,
    });
  },
}));
