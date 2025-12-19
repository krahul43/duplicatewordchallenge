import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { Award, Book, Crown, LogOut, Star, Target, TrendingUp, Trophy, Zap } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { auth } from '../../src/lib/firebase';
import { presenceService } from '../../src/services/presenceService';
import { statsService, UserStats } from '../../src/services/statsService';
import { RootState } from '../../src/store';
import { logout } from '../../src/store/slices/authSlice';
import { colors } from '../../src/theme/colors';

export default function SettingsScreen() {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const profile = useSelector((state: RootState) => state.auth.profile);
  const subscription = useSelector((state: RootState) => state.subscription);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!profile?.id) {
      setLoadingStats(false);
      return;
    }
    loadStats();
  }, [profile?.id]);

  async function loadStats() {
    if (!profile?.id) return;

    setLoadingStats(true);
    try {
      const userStats = await statsService.getUserStats(profile.id);
      setStats(userStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoadingStats(false);
    }
  }

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
            if (profile?.id) {
              try {
                await presenceService.setUserOffline(profile.id);
              } catch (error) {
                console.error('Error setting offline status:', error);
              }
            }
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={['#ffffff', '#f0f0f0']}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>
              {(profile?.display_name || 'P').charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
        </View>
        <Text style={styles.name}>{profile?.display_name || 'Player'}</Text>
        <Text style={styles.email}>{user?.email || 'No email'}</Text>
      </LinearGradient>

      <View style={styles.mainContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          <LinearGradient
            colors={subscription.status === 'active' || subscription.status === 'trialing'
              ? ['#10b981', '#059669']
              : ['#ef4444', '#dc2626']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.subscriptionCard}
          >
            <View style={styles.subscriptionHeader}>
              <View style={styles.subscriptionIconContainer}>
                <Crown size={28} color="#fff" strokeWidth={2.5} />
              </View>
              <View style={styles.subscriptionTextContainer}>
                <Text style={styles.subscriptionTitle}>{getSubscriptionText()}</Text>
                {subscription.status === 'trialing' && (
                  <Text style={styles.subscriptionSubtitle}>
                    Subscribe now to unlock unlimited games
                  </Text>
                )}
                {subscription.status === 'active' && (
                  <Text style={styles.subscriptionSubtitle}>
                    All premium features unlocked
                  </Text>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={styles.subscriptionButton}
              onPress={() => router.push('/subscription-required')}
            >
              <Text style={styles.subscriptionButtonText}>
                {subscription.status === 'active' ? 'Manage Plan' : 'Upgrade Now'}
              </Text>
              <Zap size={16} color="#667eea" />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Stats</Text>
          {loadingStats ? (
            <View style={styles.statsLoading}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading your stats...</Text>
            </View>
          ) : (
            <>
              <View style={styles.highlightStats}>
                <View style={styles.highlightStatCard}>
                  <LinearGradient
                    colors={['#3b82f6', '#2563eb']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.highlightStatGradient}
                  >
                    <Star size={20} color="#fff" fill="#fff" />
                    <Text style={styles.highlightStatValue}>
                      {stats?.winRate.toFixed(0)}%
                    </Text>
                    <Text style={styles.highlightStatLabel}>Win Rate</Text>
                  </LinearGradient>
                </View>
                <View style={styles.highlightStatCard}>
                  <LinearGradient
                    colors={['#8b5cf6', '#7c3aed']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.highlightStatGradient}
                  >
                    <Trophy size={20} color="#fff" fill="#fff" />
                    <Text style={styles.highlightStatValue}>
                      {Math.round(stats?.averageScore || 0)}
                    </Text>
                    <Text style={styles.highlightStatLabel}>Avg Score</Text>
                  </LinearGradient>
                </View>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <View style={[styles.statIconNew, { backgroundColor: '#dbeafe' }]}>
                    <Target size={22} color="#3b82f6" strokeWidth={2.5} />
                  </View>
                  <Text style={styles.statValueNew}>{stats?.gamesPlayed || 0}</Text>
                  <Text style={styles.statLabelNew}>Games Played</Text>
                </View>

                <View style={styles.statCard}>
                  <View style={[styles.statIconNew, { backgroundColor: '#dcfce7' }]}>
                    <Trophy size={22} color="#10b981" strokeWidth={2.5} />
                  </View>
                  <Text style={styles.statValueNew}>{stats?.gamesWon || 0}</Text>
                  <Text style={styles.statLabelNew}>Victories</Text>
                </View>

                <View style={styles.statCard}>
                  <View style={[styles.statIconNew, { backgroundColor: '#fed7aa' }]}>
                    <TrendingUp size={22} color="#f59e0b" strokeWidth={2.5} />
                  </View>
                  <Text style={styles.statValueNew}>{stats?.totalScore.toLocaleString() || 0}</Text>
                  <Text style={styles.statLabelNew}>Total Points</Text>
                </View>

                <View style={styles.statCard}>
                  <View style={[styles.statIconNew, { backgroundColor: '#fae8ff' }]}>
                    <Award size={22} color="#a855f7" strokeWidth={2.5} />
                  </View>
                  <Text style={styles.statValueNew}>{stats?.highestWordScore || 0}</Text>
                  <Text style={styles.statLabelNew}>Best Word</Text>
                </View>
              </View>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Settings</Text>
          <TouchableOpacity style={styles.settingOption}>
            <View style={styles.settingIconContainer}>
              <Book size={20} color="#667eea" />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Dictionary</Text>
              <Text style={styles.settingValue}>English</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarText: {
    fontSize: 42,
    fontWeight: '700',
    color: '#667eea',
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
  },
  email: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  mainContent: {
    paddingHorizontal: 20,
    marginTop: -10,
  },
  section: {
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 14,
    letterSpacing: -0.5,
  },
  subscriptionCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  subscriptionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  subscriptionTextContainer: {
    flex: 1,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  subscriptionSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  subscriptionButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  subscriptionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#667eea',
  },
  highlightStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  highlightStatCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  highlightStatGradient: {
    padding: 20,
    alignItems: 'center',
  },
  highlightStatValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 8,
    marginBottom: 4,
  },
  highlightStatLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#ffffff',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  statIconNew: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValueNew: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabelNew: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
  },
  statsLoading: {
    backgroundColor: '#ffffff',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#64748b',
  },
  settingOption: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  settingIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 2,
  },
  settingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  logoutButton: {
    marginTop: 28,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1.5,
    borderColor: '#fee2e2',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ef4444',
  },
  version: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 24,
  },
});
