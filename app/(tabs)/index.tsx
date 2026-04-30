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
    cleanupOldWaitingGames();
    loadLastActiveGame();

    const unsubscribe = gameService.subscribeToPlayerGames(profile.id, (games) => {
      const now = Date.now();
      const activeGames = games.filter(g => {
        if (g.status !== 'playing' && g.status !== 'paused') return false;
        if (!g.player2_id) return false;
        if (g.status === 'finished' || g.game_ended_at) return false;
        if (g.timer_ends_at) {
          const timerEnd = new Date(g.timer_ends_at).getTime();
          if (now >= timerEnd) {
            gameService.handleTimeExpired(g.id).catch(err => console.error('Failed to mark expired game as finished:', err));
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
        if (g.status !== 'playing' && g.status !== 'paused') return false;
        if (!g.player2_id) return false;
        if (g.status === 'finished' || g.game_ended_at) return false;
        if (g.timer_ends_at) {
          const timerEnd = new Date(g.timer_ends_at).getTime();
          if (now >= timerEnd) {
            gameService.handleTimeExpired(g.id).catch(err => console.error('Failed to mark expired game as finished:', err));
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
    if (!canPlay()) { router.push('/subscription-required'); return; }
    if (!profile?.id || !profile?.display_name) return;
    setLoading(true);
    try {
      await matchmakingService.cleanupOldRequests(profile.id);
      const gameId = await matchmakingService.joinMatchmaking(profile.id, profile.display_name);
      router.push(`/matchmaking/${gameId}`);
    } catch (error) {
      console.error('Failed to start matchmaking:', error);
      await presenceService.setLookingForGame(profile.id, false);
    } finally {
      setLoading(false);
    }
  }

  async function createNewGame(isPrivate: boolean) {
    if (!canPlay()) { router.push('/subscription-required'); return; }
    if (!profile?.id) return;
    setLoading(true);
    try {
      dispatch(resetGame());
      await cleanupOldWaitingGames();
      if (isPrivate) {
        try { await matchmakingService.cancelMatchmaking(profile.id); } catch (error) {}
      }
      const gameId = await gameService.createGame(profile.id, isPrivate);
      if (!gameId || typeof gameId !== 'string') throw new Error('Invalid game ID received');
      await new Promise(resolve => setTimeout(resolve, 500));
      router.push(`/matchmaking/${gameId}`);
    } catch (error) {
      console.error('Failed to create game:', error);
      Alert.alert('Error', 'Failed to create game. Please try again.');
    } finally {
      setLoading(false);
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
        const isExpired = g.join_code_expires_at && new Date(g.join_code_expires_at).getTime() < now;
        const hasEndedButNotFinished = g.game_ended_at && g.status !== 'finished';
        const isStaleWaiting = g.status === 'waiting' && !g.player2_id && (now - new Date(g.created_at).getTime()) > 5 * 60 * 1000;
        return isOldWaiting || isUnfinishedPrivate || isExpired || hasEndedButNotFinished || isStaleWaiting;
      });
      const gamesWithExpiredTimers = playerGames.filter(g => {
        if (g.status !== 'playing' && g.status !== 'paused') return false;
        if (!g.timer_ends_at) return false;
        return now >= new Date(g.timer_ends_at).getTime();
      });
      for (const game of gamesWithExpiredTimers) {
        await gameService.handleTimeExpired(game.id);
      }
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

  const firstName = profile?.display_name?.split(' ')[0] || 'Player';

  return (
    <LinearGradient colors={['#0d0d1a', '#13132a', '#0d0d1a']} style={styles.container}>
      <View style={styles.bgDecor}>
        <View style={[styles.bgBlob, { top: -60, right: -60, backgroundColor: '#4c1d95', width: 220, height: 220 }]} />
        <View style={[styles.bgBlob, { top: 300, left: -80, backgroundColor: '#1e3a5f', width: 180, height: 180 }]} />
        <View style={[styles.bgBlob, { bottom: 100, right: -40, backgroundColor: '#0e4d4d', width: 160, height: 160 }]} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#a78bfa"
            colors={['#a78bfa']}
          />
        }
      >
        {lastActiveGame && (
          <TouchableOpacity
            style={styles.resumeBanner}
            onPress={() => router.push(`/game/${lastActiveGame.id}`)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#0891b2', '#0e7490']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.resumeGradient}
            >
              <View style={styles.resumeIconCircle}>
                <Play size={20} color="#fff" fill="#fff" />
              </View>
              <View style={styles.resumeContent}>
                <Text style={styles.resumeTitle}>Resume Game</Text>
                <Text style={styles.resumeSubtitle}>
                  vs {lastActiveGame.player1_id === profile?.id
                    ? (lastActiveGame.player2_display_name || 'Waiting...')
                    : (lastActiveGame.player1_display_name || 'Opponent')}
                  {'  '}
                  <Text style={styles.resumeScore}>
                    {lastActiveGame.player1_id === profile?.id ? lastActiveGame.player1_score || 0 : lastActiveGame.player2_score || 0}
                    {' — '}
                    {lastActiveGame.player1_id === profile?.id ? lastActiveGame.player2_score || 0 : lastActiveGame.player1_score || 0}
                  </Text>
                </Text>
              </View>
              <Sparkles size={18} color="rgba(255,255,255,0.7)" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={styles.logoSection}>
          <Image
            style={styles.logo}
            source={require('../../assets/images/logo.png')}
            resizeMode="contain"
          />
        </View>

        <View style={styles.greetCard}>
          <LinearGradient
            colors={['rgba(99,102,241,0.25)', 'rgba(139,92,246,0.15)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.greetGradient}
          >
            <View style={styles.greetTop}>
              <View>
                <Text style={styles.greetHello}>Hello, {firstName} 👋</Text>
                <Text style={styles.greetTagline}>Ready to battle with words?</Text>
              </View>
              <View style={styles.greetBadge}>
                <Sparkles size={14} color="#a78bfa" />
                <Text style={styles.greetBadgeText}>{canPlay() ? 'Active' : 'Expired'}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.sectionLabel}>
          <View style={styles.sectionLine} />
          <Text style={styles.sectionLabelText}>START A GAME</Text>
          <View style={styles.sectionLine} />
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={handleQuickPlay}
            disabled={loading}
            activeOpacity={0.82}
            style={styles.actionCardWrapper}
          >
            <LinearGradient
              colors={['#9333ea', '#7c3aed']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionCard}
            >
              <View style={styles.actionIconCircle}>
                <Users size={28} color="#fff" strokeWidth={2} />
              </View>
              <View style={styles.actionTextBlock}>
                <Text style={styles.actionTitle}>Quick Match</Text>
                <Text style={styles.actionSubtitle}>Play vs a random opponent</Text>
              </View>
              <Zap size={22} color="rgba(255,255,255,0.6)" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => createNewGame(true)}
            disabled={loading}
            activeOpacity={0.82}
            style={styles.actionCardWrapper}
          >
            <LinearGradient
              colors={['#2563eb', '#1d4ed8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionCard}
            >
              <View style={styles.actionIconCircle}>
                <UserIcon size={28} color="#fff" strokeWidth={2} />
              </View>
              <View style={styles.actionTextBlock}>
                <Text style={styles.actionTitle}>Play a Friend</Text>
                <Text style={styles.actionSubtitle}>Create a private game code</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/join-game')}
            disabled={loading}
            activeOpacity={0.82}
            style={styles.actionCardWrapper}
          >
            <LinearGradient
              colors={['#0891b2', '#0e7490']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionCard}
            >
              <View style={styles.actionIconCircle}>
                <KeyRound size={28} color="#fff" strokeWidth={2} />
              </View>
              <View style={styles.actionTextBlock}>
                <Text style={styles.actionTitle}>Join with Code</Text>
                <Text style={styles.actionSubtitle}>Enter a friend's game code</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.decorTiles}>
          {['D', 'W', 'C', ''].map((letter, i) => (
            <View key={i} style={[styles.decorTile, { opacity: 0.06 + i * 0.03 }]}>
              {letter ? <Text style={styles.decorTileLetter}>{letter}</Text> : null}
            </View>
          ))}
        </View>
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
    opacity: 0.18,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 58,
    paddingBottom: 40,
  },
  resumeBanner: {
    marginBottom: 22,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#0891b2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  resumeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 12,
  },
  resumeIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resumeContent: {
    flex: 1,
  },
  resumeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 2,
  },
  resumeSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  resumeScore: {
    fontWeight: '800',
    color: '#fff',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: width * 0.82,
    height: 160,
  },
  greetCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.2)',
  },
  greetGradient: {
    padding: 20,
  },
  greetTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greetHello: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  greetTagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  greetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(167,139,250,0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.25)',
  },
  greetBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#a78bfa',
  },
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  sectionLabelText: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1.5,
  },
  actions: {
    gap: 14,
  },
  actionCardWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    gap: 16,
  },
  actionIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTextBlock: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  actionSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
  },
  decorTiles: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 32,
  },
  decorTile: {
    width: 36,
    height: 42,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  decorTileLetter: {
    fontSize: 16,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.3)',
  },
});
