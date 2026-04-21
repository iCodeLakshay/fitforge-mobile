import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacityProps,
  View,
} from 'react-native';
import { Colors, AccentGlowShadow, DangerGlowShadow } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Radius, Layout } from '../../constants/spacing';

// ─── Types ──────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon';
type ButtonSize    = 'lg' | 'md' | 'sm';

interface ButtonProps extends TouchableOpacityProps {
  label?:       string;
  title?:       string;   // alias for label
  variant?:     ButtonVariant;
  size?:        ButtonSize;
  loading?:     boolean;
  iconLeft?:    React.ReactNode;
  iconRight?:   React.ReactNode;
  fullWidth?:   boolean;
}

// ─── Variant Styles ─────────────────────────────────────────────────────────

const variantStyles = {
  primary: {
    container: {
      backgroundColor: Colors.accent,
      ...AccentGlowShadow,
    },
    text: { color: Colors.textOnAccent, ...Typography.labelLg },
  },
  secondary: {
    container: {
      backgroundColor: Colors.surface02,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    text: { color: Colors.textPrimary, ...Typography.labelLg },
  },
  ghost: {
    container: {
      backgroundColor: 'transparent',
    },
    text: { color: Colors.accent, ...Typography.labelLg },
  },
  danger: {
    container: {
      backgroundColor: Colors.danger,
      ...DangerGlowShadow,
    },
    text: { color: Colors.textPrimary, ...Typography.labelLg },
  },
  icon: {
    container: {
      backgroundColor: Colors.surface02,
    },
    text: { color: Colors.textPrimary, ...Typography.labelLg },
  },
} as const;

const sizeStyles = {
  lg: { height: Layout.buttonHeight,   paddingHorizontal: 24, borderRadius: Radius.md },
  md: { height: Layout.buttonHeightSm, paddingHorizontal: 20, borderRadius: Radius.md },
  sm: { height: 36,                    paddingHorizontal: 12, borderRadius: Radius.sm },
} as const;

// ─── Button ──────────────────────────────────────────────────────────────────

export function Button({
  label,
  title,
  variant   = 'primary',
  size      = 'lg',
  loading   = false,
  iconLeft,
  iconRight,
  fullWidth = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const vStyle = variantStyles[variant];
  const sStyle = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={isDisabled}
      style={[
        styles.base,
        vStyle.container,
        sStyle,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? Colors.textOnAccent : Colors.accent}
        />
      ) : (
        <>
          {iconLeft  && <View style={styles.iconLeft}>{iconLeft}</View>}
          {(label ?? title) && <Text style={vStyle.text} numberOfLines={1}>{label ?? title}</Text>}
          {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
        </>
      )}
    </TouchableOpacity>
  );
}

// ─── Icon Button ─────────────────────────────────────────────────────────────

interface IconButtonProps extends TouchableOpacityProps {
  icon:  React.ReactNode;
  size?: number;
  bg?:   string;
}

export function IconButton({ icon, size = Layout.touchTarget, bg, style, ...rest }: IconButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[
        { width: size, height: size, borderRadius: Radius.md,
          backgroundColor: bg ?? Colors.surface02,
          alignItems: 'center', justifyContent: 'center',
        },
        style,
      ]}
      {...rest}
    >
      {icon}
    </TouchableOpacity>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fullWidth: { width: '100%' },
  disabled:  { opacity: 0.45 },
  iconLeft:  { marginRight: 8 },
  iconRight: { marginLeft: 8 },
});
