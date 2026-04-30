import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { Award, Book, Crown, LogOut, Star, Target, TrendingUp, Trophy, Zap } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { auth } from '../../src/lib/firebase';
import { presenceService } from '../../src/services/presenceService';
import { statsService, UserStats } from '../../src/services/statsService';
import { RootState } from '../../src/store';
import { logout } from '../../src/store/slices/authSlice';

const { width } = Dimensions.get('window');

export default function SettingsScreen() {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const profile = useSelector((state: RootState) => state.auth.profile);
  const subscription = useSelector((state: RootState) => state.subscription);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!profile?.id) { setLoadingStats(false); return; }
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
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          if (profile?.id) {
            try { await presenceService.setUserOffline(profile.id); } catch (error) {}
          }
          await signOut(auth);
          dispatch(logout());
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  function getSubscriptionLabel() {
    if (subscription.status === 'trialing') return `Free Trial · ${subscription.daysLeftInTrial} days left`;
    if (subscription.status === 'active') return 'Premium Active';
    return 'No Subscription';
  }

  const initial = (profile?.display_name || 'P').charAt(0).toUpperCase();
  const isSubscribed = subscription.status === 'trialing' || subscription.status === 'active';

  return (
    <LinearGradient colors={['#0d0d1a', '#13132a', '#0d0d1a']} style={styles.container}>
      <View style={styles.bgDecor}>
        <View style={[styles.bgBlob, { top: -50, right: -50, backgroundColor: '#4c1d95', width: 200, height: 200 }]} />
        <View style={[styles.bgBlob, { bottom: 120, left: -60, backgroundColor: '#1e3a5f', width: 160, height: 160 }]} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.profileSection}>
          <LinearGradient
            colors={['#6366f1', '#8b5cf6']}
            style={styles.avatarCircle}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.avatarInitial}>{initial}</Text>
          </LinearGradient>
          <Text style={styles.profileName}>{profile?.display_name || 'Player'}</Text>
          <Text style={styles.profileEmail}>{user?.email || ''}</Text>

          <View style={[styles.subBadge, { borderColor: isSubscribed ? 'rgba(167,139,250,0.4)' : 'rgba(239,68,68,0.3)' }]}>
            <Crown size={13} color={isSubscribed ? '#a78bfa' : '#f87171'} />
            <Text style={[styles.subBadgeText, { color: isSubscribed ? '#a78bfa' : '#f87171' }]}>
              {getSubscriptionLabel()}
            </Text>
          </View>
        </View>

        {isSubscribed && (
          <TouchableOpacity
            style={styles.manageBtn}
            onPress={() => router.push('/subscription-required')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.manageBtnGradient}
            >
              <Zap size={18} color="#fff" fill="#fff" />
              <Text style={styles.manageBtnText}>
                {subscription.status === 'active' ? 'Manage Plan' : 'Upgrade to Premium'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={styles.sectionLabel}>
          <View style={styles.sectionLine} />
          <Text style={styles.sectionLabelText}>PERFORMANCE</Text>
          <View style={styles.sectionLine} />
        </View>

        {loadingStats ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#a78bfa" />
            <Text style={styles.loadingText}>Loading stats...</Text>
          </View>
        ) : (
          <>
            <View style={styles.highlightRow}>
              <LinearGradient colors={['#2563eb', '#1d4ed8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.highlightCard}>
                <Star size={18} color="#fff" fill="#fff" />
                <Text style={styles.highlightValue}>{stats?.winRate.toFixed(0)}%</Text>
                <Text style={styles.highlightLabel}>Win Rate</Text>
              </LinearGradient>
              <LinearGradient colors={['#7c3aed', '#6d28d9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.highlightCard}>
                <Trophy size={18} color="#fff" fill="#fff" />
                <Text style={styles.highlightValue}>{Math.round(stats?.averageScore || 0)}</Text>
                <Text style={styles.highlightLabel}>Avg Score</Text>
              </LinearGradient>
            </View>

            <View style={styles.statsGrid}>
              {[
                { icon: <Target size={20} color="#60a5fa" strokeWidth={2.5} />, value: String(stats?.gamesPlayed || 0), label: 'Games', bg: 'rgba(37,99,235,0.12)', border: 'rgba(37,99,235,0.2)' },
                { icon: <Trophy size={20} color="#34d399" strokeWidth={2.5} />, value: String(stats?.gamesWon || 0), label: 'Victories', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.2)' },
                { icon: <TrendingUp size={20} color="#fbbf24" strokeWidth={2.5} />, value: (stats?.totalScore || 0).toLocaleString(), label: 'Total Pts', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.2)' },
                { icon: <Award size={20} color="#c084fc" strokeWidth={2.5} />, value: String(stats?.highestWordScore || 0), label: 'Best Word', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.2)' },
              ].map((s, i) => (
                <View key={i} style={[styles.statCard, { backgroundColor: s.bg, borderColor: s.border }]}>
                  <View style={styles.statIcon}>{s.icon}</View>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.sectionLabel}>
          <View style={styles.sectionLine} />
          <Text style={styles.sectionLabelText}>SETTINGS</Text>
          <View style={styles.sectionLine} />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingIconBox}>
            <Book size={18} color="#a78bfa" />
          </View>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Dictionary</Text>
            <Text style={styles.settingValue}>English (Official)</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <LogOut size={18} color="#f87171" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Duplicate Word Challenge · v1.0.0</Text>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgDecor: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  bgBlob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.15,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 58,
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },
  avatarInitial: {
    fontSize: 38,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  profileEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 14,
  },
  subBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  subBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  manageBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  manageBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  manageBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2,
  },
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    marginTop: 4,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  sectionLabelText: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1.5,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
  },
  highlightRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  highlightCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  highlightValue: {
    fontSize: 30,
    fontWeight: '900',
    color: '#fff',
    marginTop: 4,
  },
  highlightLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '46%',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    gap: 6,
  },
  statIcon: {
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 14,
  },
  settingIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(167,139,250,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.2)',
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  settingValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(239,68,68,0.3)',
    backgroundColor: 'rgba(239,68,68,0.07)',
    marginBottom: 20,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f87171',
  },
  version: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.2)',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
