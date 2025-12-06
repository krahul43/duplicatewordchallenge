import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { LogOut, User, Moon, Sun, Book, CreditCard } from 'lucide-react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../../src/lib/firebase';
import { RootState } from '../../src/store';
import { logout } from '../../src/store/slices/authSlice';
import { Button } from '../../src/components/Button';
import { colors, spacing, typography } from '../../src/theme/colors';

export default function SettingsScreen() {
  const dispatch = useDispatch();
  const profile = useSelector((state: RootState) => state.auth.profile);
  const subscription = useSelector((state: RootState) => state.subscription);

  async function handleLogout() {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut(auth);
            dispatch(logout());
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  }

  function getSubscriptionText() {
    if (subscription.status === 'trialing') {
      return `Free Trial (${subscription.daysLeftInTrial} days left)`;
    }
    if (subscription.status === 'active') {
      return 'Active Subscription';
    }
    return 'No Active Subscription';
  }

  function getSubscriptionColor() {
    if (subscription.status === 'trialing' || subscription.status === 'active') {
      return colors.success;
    }
    return colors.error;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <User size={40} color={colors.primary} />
        </View>
        <Text style={styles.name}>{profile?.display_name || 'Player'}</Text>
        <Text style={styles.email}>{profile?.id}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription</Text>
        <View style={[styles.card, { borderColor: getSubscriptionColor() }]}>
          <View style={styles.cardContent}>
            <CreditCard size={24} color={getSubscriptionColor()} />
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{getSubscriptionText()}</Text>
              {subscription.status === 'trialing' && (
                <Text style={styles.cardSubtitle}>
                  Subscribe now to continue after trial
                </Text>
              )}
            </View>
          </View>
          <Button
            title={subscription.status === 'active' ? 'Manage' : 'Subscribe'}
            onPress={() => router.push('/subscription-required')}
            variant="outline"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Game Settings</Text>

        <TouchableOpacity style={styles.option}>
          <Book size={24} color={colors.text} />
          <Text style={styles.optionText}>Dictionary: English</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.games_played || 0}</Text>
            <Text style={styles.statLabel}>Games Played</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.games_won || 0}</Text>
            <Text style={styles.statLabel}>Games Won</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.total_score || 0}</Text>
            <Text style={styles.statLabel}>Total Score</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.highest_word_score || 0}</Text>
            <Text style={styles.statLabel}>Best Word</Text>
          </View>
        </View>
      </View>

      <Button
        title="Sign Out"
        onPress={handleLogout}
        variant="outline"
        style={styles.logoutButton}
      />

      <Text style={styles.version}>Version 1.0.0</Text>
    </ScrollView>
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
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingVertical: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  name: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  email: {
    ...typography.caption,
    color: colors.muted,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    ...typography.caption,
    color: colors.muted,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  optionText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
  },
  logoutButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  version: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
