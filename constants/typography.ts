import { TextStyle } from 'react-native';

// FitForge Typography Scale
// Bebas Neue = display/headlines (UPPERCASE only)
// DM Sans    = body/UI
// DM Mono    = numbers/stats/codes

type FontWeight = TextStyle['fontWeight'];

export const Fonts = {
  bebas:          'BebasNeue_400Regular',
  dm:             'DMSans_400Regular',
  dmMedium:       'DMSans_500Medium',
  dmSemi:         'DMSans_600SemiBold',
  dmBold:         'DMSans_700Bold',
  dmMono:         'DMMono_400Regular',
  dmMonoMedium:   'DMMono_500Medium',
} as const;

interface TypeStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: FontWeight;
  lineHeight: number;
  letterSpacing?: number;
}

export const Typography: Record<string, TypeStyle> = {
  // Display — Bebas Neue, tight line height
  displayXl: { fontFamily: Fonts.bebas, fontSize: 64, fontWeight: '400', lineHeight: 64 },
  displayLg: { fontFamily: Fonts.bebas, fontSize: 48, fontWeight: '400', lineHeight: 48 },
  displayMd: { fontFamily: Fonts.bebas, fontSize: 36, fontWeight: '400', lineHeight: 36 },
  displaySm: { fontFamily: Fonts.bebas, fontSize: 28, fontWeight: '400', lineHeight: 28 },

  // Headings — DM Sans
  headingLg: { fontFamily: Fonts.dmBold,   fontSize: 22, fontWeight: '700', lineHeight: 30 },
  headingMd: { fontFamily: Fonts.dmBold,   fontSize: 18, fontWeight: '700', lineHeight: 26 },
  headingSm: { fontFamily: Fonts.dmSemi,   fontSize: 16, fontWeight: '600', lineHeight: 22 },

  // Body — DM Sans
  bodyLg: { fontFamily: Fonts.dm,           fontSize: 16, fontWeight: '400', lineHeight: 24 },
  bodyMd: { fontFamily: Fonts.dm,           fontSize: 14, fontWeight: '400', lineHeight: 21 },
  bodySm: { fontFamily: Fonts.dm,           fontSize: 12, fontWeight: '400', lineHeight: 18 },

  // Labels — DM Sans
  labelLg: { fontFamily: Fonts.dmSemi,      fontSize: 14, fontWeight: '600', lineHeight: 20, letterSpacing: 0.5 },
  labelMd: { fontFamily: Fonts.dmSemi,      fontSize: 12, fontWeight: '600', lineHeight: 16, letterSpacing: 0.5 },
  labelSm: { fontFamily: Fonts.dmMedium,    fontSize: 10, fontWeight: '500', lineHeight: 14, letterSpacing: 0.5 },

  // Mono — DM Mono (all numeric data)
  monoLg: { fontFamily: Fonts.dmMonoMedium, fontSize: 20, fontWeight: '500', lineHeight: 26 },
  monoMd: { fontFamily: Fonts.dmMono,       fontSize: 14, fontWeight: '400', lineHeight: 20 },
  monoSm: { fontFamily: Fonts.dmMono,       fontSize: 12, fontWeight: '400', lineHeight: 16 },
};
