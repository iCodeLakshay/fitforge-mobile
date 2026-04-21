import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

// ─── Progress Ring (SVG Circular) ────────────────────────────────────────────

interface ProgressRingProps {
  size?:        number;      // outer diameter (default 120)
  progress:     number;      // 0-100
  strokeWidth?: number;      // ring thickness (default 8)
  color?:       string;      // fill color (default accent lime)
  trackColor?:  string;      // track background
  label?:       string;      // center text (top)
  sublabel?:    string;      // center text (bottom, smaller)
  showPercent?: boolean;
}

export function ProgressRing({
  size        = 120,
  progress,
  strokeWidth = 8,
  color       = Colors.accent,
  trackColor  = Colors.surface02,
  label,
  sublabel,
  showPercent = true,
}: ProgressRingProps) {
  const clamp  = Math.min(100, Math.max(0, progress));
  const radius = (size - strokeWidth) / 2;
  const circ   = 2 * Math.PI * radius;
  const dash   = (clamp / 100) * circ;
  const center = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <G rotation="-90" origin={`${center},${center}`}>
          {/* Track */}
          <Circle
            cx={center} cy={center} r={radius}
            stroke={trackColor} strokeWidth={strokeWidth} fill="none"
          />
          {/* Progress */}
          <Circle
            cx={center} cy={center} r={radius}
            stroke={color} strokeWidth={strokeWidth} fill="none"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      {/* Center label */}
      <View style={styles.center}>
        {showPercent && (
          <Text style={[styles.percent, { color: Colors.textPrimary }]}>
            {Math.round(clamp)}%
          </Text>
        )}
        {label    && <Text style={styles.ringLabel}>{label}</Text>}
        {sublabel && <Text style={styles.ringSublabel}>{sublabel}</Text>}
      </View>
    </View>
  );
}

// ─── Progress Bar (Linear) ───────────────────────────────────────────────────

interface ProgressBarProps {
  progress:     number;   // 0-100
  height?:      number;
  color?:       string;
  trackColor?:  string;
  borderRadius?: number;
}

export function ProgressBar({
  progress,
  height        = 6,
  color         = Colors.accent,
  trackColor    = Colors.surface02,
  borderRadius  = 999,
}: ProgressBarProps) {
  const clamp = Math.min(100, Math.max(0, progress));
  return (
    <View style={[styles.track, { height, backgroundColor: trackColor, borderRadius }]}>
      <View style={[
        styles.fill,
        { width: `${clamp}%`, backgroundColor: color, borderRadius, height },
      ]} />
    </View>
  );
}

// ─── Step Progress Bar (questionnaire steps) ──────────────────────────────────

interface StepProgressProps {
  total:    number;
  current:  number; // 1-indexed current step
  color?:   string;
}

export function StepProgress({ total, current, color = Colors.accent }: StepProgressProps) {
  return (
    <View style={styles.stepRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.step,
            { flex: 1,
              backgroundColor: i < current ? color : Colors.surface02,
              height: 3,
            },
          ]}
        />
      ))}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  center:       { alignItems: 'center', justifyContent: 'center' },
  percent:      { ...Typography.displayMd },
  ringLabel:    { ...Typography.bodySm, color: Colors.textSecondary, marginTop: 2 },
  ringSublabel: { ...Typography.bodySm, color: Colors.textTertiary },
  track:        { width: '100%', overflow: 'hidden' },
  fill:         {},
  stepRow:      { flexDirection: 'row', gap: 4 },
  step:         { borderRadius: 2 },
});
