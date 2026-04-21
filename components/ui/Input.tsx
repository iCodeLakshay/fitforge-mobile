import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Radius, Layout } from '../../constants/spacing';

// ─── Base Input ──────────────────────────────────────────────────────────────

interface InputProps extends TextInputProps {
  label?:      string;
  hint?:       string;
  error?:      string;
  iconLeft?:   React.ReactNode;
  iconRight?:  React.ReactNode;
  onPressRight?: () => void;
}

export function Input({
  label,
  hint,
  error,
  iconLeft,
  iconRight,
  onPressRight,
  style,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[
        styles.container,
        focused && styles.containerFocused,
        !!error && styles.containerError,
      ]}>
        {iconLeft && <View style={styles.iconLeft}>{iconLeft}</View>}

        <TextInput
          style={[styles.input, iconLeft ? styles.inputWithLeft : undefined, style]}
          placeholderTextColor={Colors.textTertiary}
          selectionColor={Colors.accent}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />

        {iconRight && (
          <TouchableOpacity onPress={onPressRight} style={styles.iconRight} activeOpacity={0.7}>
            {iconRight}
          </TouchableOpacity>
        )}
      </View>

      {error  && <Text style={styles.error}>{error}</Text>}
      {!error && hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

// ─── Search Input ─────────────────────────────────────────────────────────────

interface SearchInputProps extends TextInputProps {
  onClear?: () => void;
}

export function SearchInput({ value, onClear, style, ...rest }: SearchInputProps) {
  return (
    <View style={styles.searchContainer}>
      <TextInput
        value={value}
        style={[styles.input, styles.searchInput, style]}
        placeholderTextColor={Colors.textTertiary}
        selectionColor={Colors.accent}
        returnKeyType="search"
        {...rest}
      />
      {!!value && (
        <TouchableOpacity onPress={onClear} style={styles.iconRight} activeOpacity={0.7}>
          <Text style={{ color: Colors.textTertiary, fontSize: 16 }}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── OTP Input ───────────────────────────────────────────────────────────────

interface OTPInputProps {
  length?:   number;
  value:     string;
  onChange:  (val: string) => void;
  error?:    string;
}

export function OTPInput({ length = 6, value, onChange, error }: OTPInputProps) {
  const digits = value.split('');

  return (
    <View>
      <View style={styles.otpRow}>
        {Array.from({ length }).map((_, i) => {
          const filled  = i < digits.length;
          const active  = i === digits.length;
          return (
            <View key={i} style={[
              styles.otpCell,
              filled && styles.otpCellFilled,
              active && styles.otpCellActive,
              !!error && styles.containerError,
            ]}>
              <Text style={styles.otpDigit}>{digits[i] ?? ''}</Text>
            </View>
          );
        })}
      </View>
      {/* Hidden real input captures keyboard input */}
      <TextInput
        style={styles.hiddenInput}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, length))}
        keyboardType="numeric"
        maxLength={length}
        caretHidden
        selectionColor="transparent"
        autoFocus
      />
      {error && <Text style={[styles.error, { textAlign: 'center', marginTop: 8 }]}>{error}</Text>}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper:          { marginBottom: 16 },
  label:            { ...Typography.labelMd, color: Colors.textSecondary, marginBottom: 8 },
  hint:             { ...Typography.bodySm, color: Colors.textTertiary, marginTop: 6 },
  error:            { ...Typography.bodySm, color: Colors.danger, marginTop: 6 },

  container: {
    flexDirection:  'row',
    alignItems:     'center',
    height:         Layout.inputHeight,
    backgroundColor: Colors.surface02,
    borderRadius:   Radius.md,
    borderWidth:    1,
    borderColor:    Colors.border,
    paddingHorizontal: 16,
  },
  containerFocused: { borderColor: Colors.accent },
  containerError:   { borderColor: Colors.danger },

  input: {
    flex: 1,
    ...Typography.bodyMd,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  inputWithLeft: { marginLeft: 8 },

  iconLeft:  { marginRight: 4 },
  iconRight: { marginLeft: 8, padding: 4 },

  searchContainer: {
    flexDirection:    'row',
    alignItems:       'center',
    height:           44,
    backgroundColor:  Colors.surface02,
    borderRadius:     Radius.full,
    paddingHorizontal: 12,
    borderWidth:      1,
    borderColor:      Colors.border,
  },
  searchInput: { height: 44 },

  // OTP
  otpRow: {
    flexDirection:  'row',
    justifyContent: 'center',
    gap:            12,
  },
  otpCell: {
    width:           48,
    height:          56,
    borderRadius:    Radius.md,
    backgroundColor: Colors.surface02,
    borderWidth:     1,
    borderColor:     Colors.border,
    alignItems:      'center',
    justifyContent:  'center',
  },
  otpCellFilled: { borderColor: `${Colors.accent}60` },
  otpCellActive: { borderColor: Colors.accent },
  otpDigit:      { ...Typography.headingLg, color: Colors.textPrimary },
  hiddenInput:   { position: 'absolute', opacity: 0, height: 0, width: 0 },
});
