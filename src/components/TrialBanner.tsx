import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Clock } from 'lucide-react-native';
import { colors, spacing, typography } from '../theme/colors';

interface Props {
  daysLeft: number;
}

export function TrialBanner({ daysLeft }: Props) {
  if (daysLeft <= 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Clock size={20} color={colors.surface} />
        <Text style={styles.text}>
          {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left in trial
        </Text>
      </View>
      <TouchableOpacity onPress={() => router.push('/(tabs)/settings')}>
        <Text style={styles.link}>Subscribe</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.success,
    padding: spacing.md,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  text: {
    ...typography.body,
    color: colors.surface,
    fontWeight: '600',
  },
  link: {
    ...typography.body,
    color: colors.surface,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
