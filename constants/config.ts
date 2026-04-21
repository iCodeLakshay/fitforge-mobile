import Constants from 'expo-constants';

// ─── Convex URL ───────────────────────────────────────────────────────────────
// Set EXPO_PUBLIC_CONVEX_URL in .env.local after running `npx convex dev`
export const CONVEX_URL: string =
  process.env.EXPO_PUBLIC_CONVEX_URL ??
  (Constants.expoConfig?.extra?.convexUrl as string) ??
  '';

// ─── Subscription Status types ────────────────────────────────────────────────
export type SubscriptionStatus =
  | 'active'
  | 'expiring_soon'
  | 'grace_period'
  | 'expired'
  | 'pending_approval'
  | 'archived';

// ─── FitForge Plan Tiers ──────────────────────────────────────────────────────
export const FITFORGE_PLANS = {
  free:     { label: 'Free',     aiPlansPerMonth: 5,  maxMembers: 50  },
  pro:      { label: 'Pro',      aiPlansPerMonth: 50, maxMembers: 500 },
  pro_plus: { label: 'Pro+',     aiPlansPerMonth: -1, maxMembers: -1  }, // unlimited
} as const;

// ─── Sub plan durations ───────────────────────────────────────────────────────
export const SUBSCRIPTION_DURATIONS = [
  { key: 'monthly',     label: '1 Month',   days: 30  },
  { key: 'quarterly',   label: '3 Months',  days: 90  },
  { key: 'half_yearly', label: '6 Months',  days: 180 },
  { key: 'yearly',      label: '1 Year',    days: 365 },
] as const;

// ─── Misc constants ───────────────────────────────────────────────────────────
export const OTP_LENGTH         = 6;
export const OTP_EXPIRY_MINUTES = 10;
export const OTP_MAX_ATTEMPTS   = 3;
export const GRACE_PERIOD_DAYS  = 3;
export const EXPIRY_WARN_DAYS   = 7;
export const APP_VERSION        = '1.0.0';
