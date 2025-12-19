import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { KeyRound, Play, Sparkles, User as UserIcon, Users, Zap } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Dimensions, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { gameService } from '../../src/services/gameService';
import { matchmakingService } from '../../src/services/matchmakingService';
import { presenceService } from '../../src/services/presenceService';
import { RootState } from '../../src/store';
import { resetGame } from '../../src/store/slices/gameSlice';
import { Game } from '../../src/types/game';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const dispatch = useDispatch();
  const profile = useSelector((state: RootState) => state.auth.profile);
  const subscription = useSelector((state: RootState) => state.subscription);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [presenceReady, setPresenceReady] = useState(false);

  useEffect(() => {
    loadGames();

    if (profile?.id && profile?.display_name) {
      presenceService.setUserOnline(profile.id, profile.display_name)
        .then(() => setPresenceReady(true))
        .catch((error) => {
          console.error('Failed to set presence:', error);
          setPresenceReady(true);
        });

      return () => {
        presenceService.setUserOffline(profile.id);
      };
    }
  }, [profile?.id]);

  async function loadGames() {
    if (!profile) return;

    try {
      const playerGames = await gameService.getPlayerGames(profile.id);
      setGames(playerGames.filter(g => g.status === 'playing' || g.status === 'paused'));
    } catch (error) {
      console.error('Failed to load games:', error);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadGames();
    setRefreshing(false);
  }

  async function handleQuickPlay() {
    if (!canPlay()) {
      router.push('/subscription-required');
      return;
    }

    if (!profile?.id || !profile?.display_name) return;

    setLoading(true);

    try {
      await matchmakingService.cleanupOldRequests();

      const gameId = await matchmakingService.joinMatchmaking(
        profile.id,
        profile.display_name
      );

      router.push(`/matchmaking/${gameId}`);
    } catch (error) {
      console.error('Failed to start matchmaking:', error);
      await presenceService.setLookingForGame(profile.id, false);
    } finally {
      setLoading(false);
    }
  }

    async function createNewGame(isPrivate: boolean) {
    if (!canPlay()) {
      router.push('/subscription-required');
      return;
    }

    if (!profile?.id) return;

    setLoading(true);

    try {
      dispatch(resetGame());
      await cleanupOldWaitingGames();
      const gameId = await gameService.createGame(profile.id, isPrivate);
      console.log('Created new game with ID:', gameId);
      router.push(`/matchmaking/${gameId}`);
    } catch (error) {
      console.error('Failed to create game:', error);
    } finally {
      setLoading(false);
    }
  }

  async function cleanupOldWaitingGames() {
    if (!profile?.id) return;

    try {
      const playerGames = await gameService.getPlayerGames(profile.id);

      const gamesToCleanup = playerGames.filter(g =>
        g.status === 'waiting' ||
        g.status === 'cancelled' ||
        (g.status === 'finished' && g.is_private && !g.player2_id)
      );

      for (const game of gamesToCleanup) {
        await gameService.cancelWaitingGame(game.id);
      }
    } catch (error) {
      console.error('Failed to cleanup old games:', error);
    }
  }

  function canPlay(): boolean {
    return subscription.status === 'trialing' || subscription.status === 'active';
  }

  return (
    <LinearGradient
      colors={['#eff6ff', '#f0f9ff', '#fef3c7', '#fef3c7']}
      locations={[0, 0.3, 0.7, 1]}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#667eea"
            colors={['#667eea']}
          />
        }
      >
        {games.length > 0 && (
          <TouchableOpacity
            style={styles.gameInProgressBanner}
            onPress={() => router.push(`/game/${games[0].id}`)}
          >
            <LinearGradient
              colors={['#f59e0b', '#f97316']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bannerGradient}
            >
              <Play size={20} color="#fff" fill="#fff" />
              <Text style={styles.bannerText}>Resume Your Game</Text>
              <Sparkles size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={styles.logoContainer}>
          <Image
            style={styles.logo}
            source={require('../../assets/images/logo.png')}
            resizeMode="contain"
          />
        </View>

        <View style={styles.welcomeCard}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.welcomeGradient}
          >
            <Sparkles size={24} color="#fff" fill="#fff" />
            <Text style={styles.welcomeTitle}>Ready to Play?</Text>
            <Text style={styles.welcomeSubtitle}>
              Challenge friends or find opponents worldwide!
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={handleQuickPlay}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#ec4899', '#db2777']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryButton}
            >
              <View style={styles.buttonIconContainer}>
                <Users size={26} color="#fff" strokeWidth={2.5} />
              </View>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonTitle}>Find a Match</Text>
                <Text style={styles.buttonSubtitle}>Play with random opponent</Text>
              </View>
              <Zap size={20} color="rgba(255,255,255,0.8)" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => createNewGame(true)}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#3b82f6', '#2563eb']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.secondaryButton}
            >
              <View style={styles.buttonIconContainer}>
                <UserIcon size={26} color="#fff" strokeWidth={2.5} />
              </View>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonTitle}>Play a Friend</Text>
                <Text style={styles.buttonSubtitle}>Private game with code</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/join-game')}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#10b981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.secondaryButton}
            >
              <View style={styles.buttonIconContainer}>
                <KeyRound size={26} color="#fff" strokeWidth={2.5} />
              </View>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonTitle}>Join with Code</Text>
                <Text style={styles.buttonSubtitle}>Enter friend's game code</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  gameInProgressBanner: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  bannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 12,
  },
  bannerText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 8,
  },
  logo: {
    width: width * 0.85,
    height: 180,
  },
  welcomeCard: {
    marginBottom: 32,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  welcomeGradient: {
    padding: 24,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 12,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: {
    gap: 18,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  buttonSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
  },
});
