import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { KeyRound, Play, Sparkles, User as UserIcon, Users, Zap } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  const [lastActiveGame, setLastActiveGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [presenceReady, setPresenceReady] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;

    // Cleanup old games on mount
    cleanupOldWaitingGames();

    loadLastActiveGame();

    const unsubscribe = gameService.subscribeToPlayerGames(profile.id, (games) => {
      const now = Date.now();
      const activeGames = games.filter(g => {
        // Only show games that are truly active
        if (g.status !== 'playing' && g.status !== 'paused') {
          return false;
        }

        // Both players must be present for the game to be resumable
        if (!g.player2_id) {
          return false;
        }

        // Don't show finished games
        if (g.status === 'finished' || g.game_ended_at) {
          return false;
        }

        // Check if timer has expired
        if (g.timer_ends_at) {
          const timerEnd = new Date(g.timer_ends_at).getTime();
          if (now >= timerEnd) {
            // Timer expired, mark game as finished and don't show
            gameService.handleTimeExpired(g.id).catch(err =>
              console.error('Failed to mark expired game as finished:', err)
            );
            return false;
          }
        }

        return true;
      });

      if (activeGames.length > 0) {
        const sortedGames = activeGames.sort((a, b) => {
          const dateA = new Date(a.updated_at || a.created_at).getTime();
          const dateB = new Date(b.updated_at || b.created_at).getTime();
          return dateB - dateA;
        });
        setLastActiveGame(sortedGames[0]);
      } else {
        setLastActiveGame(null);
      }
    });

    if (profile?.display_name) {
      presenceService.setUserOnline(profile.id, profile.display_name)
        .then(() => setPresenceReady(true))
        .catch((error) => {
          console.error('Failed to set presence:', error);
          setPresenceReady(true);
        });
    }

    return () => {
      unsubscribe();
      if (profile?.id) {
        presenceService.setUserOffline(profile.id).catch(() => {});
      }
    };
  }, [profile?.id]);

  async function loadLastActiveGame() {
    if (!profile) return;

    try {
      const playerGames = await gameService.getPlayerGames(profile.id);
      const now = Date.now();
      const activeGames = playerGames.filter(g => {
        // Only show games that are truly active
        if (g.status !== 'playing' && g.status !== 'paused') {
          return false;
        }

        // Both players must be present for the game to be resumable
        if (!g.player2_id) {
          return false;
        }

        // Don't show finished games
        if (g.status === 'finished' || g.game_ended_at) {
          return false;
        }

        // Check if timer has expired
        if (g.timer_ends_at) {
          const timerEnd = new Date(g.timer_ends_at).getTime();
          if (now >= timerEnd) {
            // Timer expired, mark game as finished and don't show
            gameService.handleTimeExpired(g.id).catch(err =>
              console.error('Failed to mark expired game as finished:', err)
            );
            return false;
          }
        }

        return true;
      });

      if (activeGames.length > 0) {
        // Get the most recently updated game
        const sortedGames = activeGames.sort((a, b) => {
          const dateA = new Date(a.updated_at || a.created_at).getTime();
          const dateB = new Date(b.updated_at || b.created_at).getTime();
          return dateB - dateA;
        });
        setLastActiveGame(sortedGames[0]);
      } else {
        setLastActiveGame(null);
      }
    } catch (error) {
      console.error('Failed to load games:', error);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await cleanupOldWaitingGames();
    await loadLastActiveGame();
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
      await matchmakingService.cleanupOldRequests(profile.id);

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

    if (!profile?.id) {
      console.error('[HomeScreen] No profile ID');
      return;
    }

    console.log('[HomeScreen] ========== CREATE NEW GAME START ==========');
    console.log('[HomeScreen] User ID:', profile.id);
    console.log('[HomeScreen] Is Private:', isPrivate);

    setLoading(true);

    try {
      dispatch(resetGame());
      console.log('[HomeScreen] Reset game state in Redux');

      console.log('[HomeScreen] Cleaning up old games...');
      await cleanupOldWaitingGames();
      console.log('[HomeScreen] Cleanup completed');

      if (isPrivate) {
        console.log('[HomeScreen] Cleaning up old matchmaking request for private game...');
        try {
          await matchmakingService.cancelMatchmaking(profile.id);
        } catch (error) {
          console.log('[HomeScreen] No matchmaking request to clean up');
        }
      }

      console.log('[HomeScreen] Creating new game in Firebase...');
      const gameId = await gameService.createGame(profile.id, isPrivate);
      console.log('[HomeScreen] ✅ NEW GAME CREATED! ID:', gameId);
      console.log('[HomeScreen] Game ID length:', gameId?.length);
      console.log('[HomeScreen] Game ID type:', typeof gameId);

      if (!gameId || typeof gameId !== 'string') {
        throw new Error('Invalid game ID received from createGame');
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('[HomeScreen] ========== NAVIGATING TO MATCHMAKING ==========');
      console.log('[HomeScreen] Target route:', `/matchmaking/${gameId}`);

      // Use push instead of replace to ensure proper navigation
      router.push(`/matchmaking/${gameId}`);
      console.log('[HomeScreen] Navigation completed');
    } catch (error) {
      console.error('[HomeScreen] ❌ Failed to create game:', error);
      Alert.alert('Error', 'Failed to create game. Please try again.');
    } finally {
      setLoading(false);
      console.log('[HomeScreen] ========== CREATE NEW GAME END ==========');
    }
  }

  async function cleanupOldWaitingGames() {
    if (!profile?.id) return;

    try {
      const playerGames = await gameService.getPlayerGames(profile.id);
      const now = Date.now();

      const gamesToCleanup = playerGames.filter(g => {
        const isOldWaiting = g.status === 'waiting' || g.status === 'cancelled';
        const isUnfinishedPrivate = g.status === 'finished' && g.is_private && !g.player2_id;

        const isExpired = g.join_code_expires_at &&
          new Date(g.join_code_expires_at).getTime() < now;

        // Cleanup games that ended but status wasn't updated
        const hasEndedButNotFinished = g.game_ended_at && g.status !== 'finished';

        // Cleanup games without second player after 5 minutes
        const isStaleWaiting = g.status === 'waiting' && !g.player2_id &&
          (now - new Date(g.created_at).getTime()) > 5 * 60 * 1000;

        return isOldWaiting || isUnfinishedPrivate || isExpired || hasEndedButNotFinished || isStaleWaiting;
      });

      // Separately handle games with expired timers
      const gamesWithExpiredTimers = playerGames.filter(g => {
        if (g.status !== 'playing' && g.status !== 'paused') return false;
        if (!g.timer_ends_at) return false;
        const timerEnd = new Date(g.timer_ends_at).getTime();
        return now >= timerEnd;
      });

      // Mark expired timer games as finished
      for (const game of gamesWithExpiredTimers) {
        await gameService.handleTimeExpired(game.id);
      }

      // Cancel/cleanup other games
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
        {lastActiveGame && (
          <TouchableOpacity
            style={styles.gameInProgressBanner}
            onPress={() => router.push(`/game/${lastActiveGame.id}`)}
          >
            <LinearGradient
              colors={['#06b6d4', '#0891b2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bannerGradient}
            >
              <View style={styles.bannerIconContainer}>
                <Play size={22} color="#fff" fill="#fff" />
              </View>
              <View style={styles.bannerContent}>
                <Text style={styles.bannerTitle}>Resume Your Game</Text>
                <View style={styles.bannerDetails}>
                  <Text style={styles.bannerOpponent}>
                    vs {lastActiveGame.player1_id === profile?.id
                      ? (lastActiveGame.player2_display_name || 'Waiting...')
                      : (lastActiveGame.player1_display_name || 'Opponent')}
                  </Text>
                  <View style={styles.bannerScores}>
                    <Text style={styles.bannerScore}>
                      {lastActiveGame.player1_id === profile?.id
                        ? lastActiveGame.player1_score || 0
                        : lastActiveGame.player2_score || 0}
                    </Text>
                    <Text style={styles.bannerScoreDivider}>-</Text>
                    <Text style={styles.bannerScore}>
                      {lastActiveGame.player1_id === profile?.id
                        ? lastActiveGame.player2_score || 0
                        : lastActiveGame.player1_score || 0}
                    </Text>
                  </View>
                </View>
              </View>
              <Sparkles size={20} color="#fff" />
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
                <Text style={styles.buttonSubtitle}>Enter friend&apos;s game code</Text>
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
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  bannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 12,
  },
  bannerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  bannerDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bannerOpponent: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  bannerScores: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  bannerScore: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  bannerScoreDivider: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
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
