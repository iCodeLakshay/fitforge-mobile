import AsyncStorage from '@react-native-async-storage/async-storage';

export const storageService = {
  setString: (key: string, value: string) => AsyncStorage.setItem(key, value),
  getString: async (key: string): Promise<string | null> => AsyncStorage.getItem(key),

  setBoolean: (key: string, value: boolean) => AsyncStorage.setItem(key, value ? '1' : '0'),
  getBoolean: async (key: string): Promise<boolean> => (await AsyncStorage.getItem(key)) === '1',

  setNumber: (key: string, value: number) => AsyncStorage.setItem(key, String(value)),
  getNumber: async (key: string): Promise<number | null> => {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return null;
    const n = Number(raw);
    return Number.isNaN(n) ? null : n;
  },

  setObject: async <T>(key: string, value: T): Promise<void> => {
    try { await AsyncStorage.setItem(key, JSON.stringify(value)); } catch {}
  },
  getObject: async <T>(key: string): Promise<T | null> => {
    try {
      const raw = await AsyncStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch { return null; }
  },

  delete: (key: string) => AsyncStorage.removeItem(key),
  clearAll: () => AsyncStorage.clear(),

  setPreference: <T>(key: string, value: T) =>
    storageService.setObject(`pref.${key}`, value),
  getPreference: <T>(key: string): Promise<T | null> =>
    storageService.getObject<T>(`pref.${key}`),
} as const;
