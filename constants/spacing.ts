// FitForge Spacing & Radius System
// Base unit: 4dp

export const Spacing = {
  s1:  4,   // hairline
  s2:  8,   // icon padding, tight inner
  s3:  12,  // default inline
  s4:  16,  // standard element margin (screen horizontal margin)
  s5:  20,  // card internal horizontal padding
  s6:  24,  // section spacing, modal padding
  s8:  32,  // large section gaps
  s10: 40,  // screen top padding
  s12: 48,  // hero section heights
  s16: 64,  // full section spacers
} as const;

export const Radius = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  full: 9999,
} as const;

export const Layout = {
  screenPadding:        16,   // horizontal margin on all screens
  cardPaddingH:         20,   // card internal horizontal padding
  cardPaddingV:         16,   // card internal vertical padding
  bottomTabHeight:      60,   // bottom tab bar height (+ safe area)
  fabSize:              56,   // floating action button
  bottomSafeArea:       80,   // minimum clearance before bottom tab
  touchTarget:          44,   // minimum touch target (accessibility)
  avatarSm:             32,
  avatarMd:             40,
  avatarLg:             48,
  avatarXl:             64,
  avatarXxl:            96,
  inputHeight:          52,
  buttonHeight:         52,
  buttonHeightSm:       48,
} as const;
