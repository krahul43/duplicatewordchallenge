import { Eye, EyeOff } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';
import { colors, spacing, typography } from '../theme/colors';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  showPasswordToggle?: boolean;
}

export function Input({ label, error, style, showPasswordToggle, secureTextEntry, ...props }: Props) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleTogglePassword = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.input, error && styles.inputError, showPasswordToggle && styles.inputWithIcon, style]}
          placeholderTextColor={colors.muted}
          secureTextEntry={showPasswordToggle ? (secureTextEntry && !isPasswordVisible) : secureTextEntry}
          {...props}
        />
        {showPasswordToggle && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleTogglePassword}
            activeOpacity={0.7}
          >
            {isPasswordVisible ? (
              <EyeOff size={20} color={colors.muted} />
            ) : (
              <Eye size={20} color={colors.muted} />
            )}
          </TouchableOpacity>
        )}
      </View>
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
  inputWrapper: {
    position: 'relative',
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
  inputWithIcon: {
    paddingRight: 48,
  },
  inputError: {
    borderColor: colors.error,
  },
  iconButton: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
  },
  error: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
