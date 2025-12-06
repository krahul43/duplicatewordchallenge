import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Crown, Check } from 'lucide-react-native';
import { Button } from '../src/components/Button';
import { colors, spacing, typography } from '../src/theme/colors';

export default function SubscriptionRequiredScreen() {
  function handleSubscribe() {
    alert('RevenueCat integration required. Export project and add RevenueCat SDK to enable subscriptions.');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.iconContainer}>
        <Crown size={64} color={colors.secondary} />
      </View>

      <Text style={styles.title}>Subscription Required</Text>
      <Text style={styles.subtitle}>
        Your trial has ended. Subscribe to continue playing!
      </Text>

      <View style={styles.plansContainer}>
        <View style={styles.plan}>
          <Text style={styles.planName}>Monthly</Text>
          <Text style={styles.planPrice}>$4.99/month</Text>
          <View style={styles.features}>
            <Feature text="Unlimited games" />
            <Feature text="All premium boards" />
            <Feature text="Game history" />
            <Feature text="Stats tracking" />
          </View>
          <Button title="Subscribe Monthly" onPress={handleSubscribe} />
        </View>

        <View style={[styles.plan, styles.popularPlan]}>
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>BEST VALUE</Text>
          </View>
          <Text style={styles.planName}>Yearly</Text>
          <Text style={styles.planPrice}>$39.99/year</Text>
          <Text style={styles.planSavings}>Save 33%</Text>
          <View style={styles.features}>
            <Feature text="Unlimited games" />
            <Feature text="All premium boards" />
            <Feature text="Game history" />
            <Feature text="Stats tracking" />
            <Feature text="Priority support" />
          </View>
          <Button title="Subscribe Yearly" onPress={handleSubscribe} />
        </View>
      </View>

      <Button
        title="Restore Purchase"
        onPress={() => alert('Restore functionality requires RevenueCat')}
        variant="outline"
        style={styles.restoreButton}
      />

      <Button
        title="Back to Home"
        onPress={() => router.back()}
        variant="outline"
      />

      <Text style={styles.note}>
        To enable subscriptions, export this project and integrate RevenueCat SDK.
        See settings for instructions.
      </Text>
    </ScrollView>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <View style={styles.feature}>
      <Check size={20} color={colors.success} />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  iconContainer: {
    alignSelf: 'center',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  plansContainer: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  plan: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.background,
  },
  popularPlan: {
    borderColor: colors.secondary,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  popularText: {
    ...typography.caption,
    color: colors.surface,
    fontWeight: '700',
  },
  planName: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  planPrice: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  planSavings: {
    ...typography.body,
    color: colors.success,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  features: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    ...typography.body,
    color: colors.text,
  },
  restoreButton: {
    marginBottom: spacing.md,
  },
  note: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.xl,
    fontStyle: 'italic',
  },
});
