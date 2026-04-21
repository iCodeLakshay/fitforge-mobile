// FitForge Design Token — Colors
// Use these in StyleSheet when NativeWind cannot be used (shadows, SVG, animations)

export const Colors = {
  background:       '#0A0A0A',
  surface01:        '#141414',
  surface02:        '#1E1E1E',
  surface03:        '#2A2A2A',
  border:           '#2E2E2E',
  borderSubtle:     '#1F1F1F',

  accent:           '#C8FF00',
  accentDim:        '#A0CC00',
  accentMuted:      '#C8FF0020',
  accentGlow:       '#C8FF0040',

  textPrimary:      '#FFFFFF',
  textSecondary:    '#A0A0A0',
  textTertiary:     '#5C5C5C',
  textOnAccent:     '#0A0A0A',

  success:          '#C8FF00',
  warning:          '#FFB800',
  danger:           '#FF4444',
  info:             '#4D9EFF',

  overlay:          '#00000080',
  overlayHeavy:     '#000000CC',
} as const;

// Semantic color helpers
export const SubscriptionColors = {
  ACTIVE:           { text: '#C8FF00', bg: '#C8FF0026' },
  EXPIRING_SOON:    { text: '#FFB800', bg: '#FFB80026' },
  GRACE_PERIOD:     { text: '#FFB800', bg: '#FFB80026' },
  EXPIRED:          { text: '#FF4444', bg: '#FF444426' },
  PENDING_APPROVAL: { text: '#A0A0A0', bg: '#A0A0A020' },
  ARCHIVED:         { text: '#5C5C5C', bg: '#1E1E1E' },
} as const;

export const PaymentColors = {
  paid:          '#C8FF00',
  pending:       '#FFB800',
  overdue:       '#FF4444',
  partial:       '#4D9EFF',
} as const;

// Accent glow shadow (for primary button only)
export const AccentGlowShadow = {
  shadowColor:   '#C8FF00',
  shadowOffset:  { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius:  12,
  elevation:     8,
} as const;

export const DangerGlowShadow = {
  shadowColor:   '#FF4444',
  shadowOffset:  { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius:  8,
  elevation:     4,
} as const;
