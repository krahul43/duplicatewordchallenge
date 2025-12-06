import React from 'react';
import { TextInput, Text, View, StyleSheet, TextInputProps } from 'react-native';
import { colors, spacing, typography } from '../theme/colors';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...props }: Props) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor={colors.muted}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  input: {
    ...typography.body,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    minHeight: 52,
  },
  inputError: {
    borderColor: colors.error,
  },
  error: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
