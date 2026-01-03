import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Calendar, Clock, Crown, Play, Trophy, User, Users } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import { gameService } from '../../src/services/gameService';
import { RootState } from '../../src/store';
import { Game } from '../../src/types/game';

export default function GamesScreen() {
  const profile = useSelector((state: RootState) => state.auth.profile);
  const [activeGames, setActiveGames] = useState<Game[]>([]);
  const [completedGames, setCompletedGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;

    loadGames();

    const unsubscribe = gameService.subscribeToPlayerGames(profile.id, (games) => {
      const now = Date.now();

      const active = games.filter(g => {
        if (g.status === 'playing' || g.status === 'paused') {
          return true;
        }

        if (g.status === 'waiting') {
          if (g.join_code_expires_at) {
            const expiresAt = new Date(g.join_code_expires_at).getTime();
            return now <= expiresAt;
          }
          return true;
        }

        return false;
      });

      const completed = games.filter(g =>
        g.status === 'finished'
      );

      setActiveGames(active);
      setCompletedGames(completed);
    });

    return () => {
      unsubscribe();
    };
  }, [profile?.id]);

  async function loadGames() {
    if (!profile) return;

    try {
      setLoading(true);

      await gameService.cleanupExpiredWaitingGames(profile.id);

      const playerGames = await gameService.getPlayerGames(profile.id);

      const now = Date.now();

      const active = playerGames.filter(g => {
        if (g.status === 'playing' || g.status === 'paused') {
          return true;
        }

        if (g.status === 'waiting') {
          if (g.join_code_expires_at) {
            const expiresAt = new Date(g.join_code_expires_at).getTime();
            return now <= expiresAt;
          }
          return true;
        }

        return false;
      });

      const completed = playerGames.filter(g =>
        g.status === 'finished'
      );

      setActiveGames(active);
      setCompletedGames(completed);
    } catch (error) {
      console.error('Failed to load games:', error);
      Alert.alert('Error', 'Failed to load games');
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadGames();
    setRefreshing(false);
  }

  function getOpponentName(game: Game): string {
    const isPlayer1 = game.player1_id === profile?.id;
    return isPlayer1
      ? (game.player2_display_name || 'Waiting...')
      : (game.player1_display_name || 'Opponent');
  }

  function getMyScore(game: Game): number {
    const isPlayer1 = game.player1_id === profile?.id;
    return isPlayer1 ? (game.player1_score || 0) : (game.player2_score || 0);
  }

  function getOpponentScore(game: Game): number {
    const isPlayer1 = game.player1_id === profile?.id;
    return isPlayer1 ? (game.player2_score || 0) : (game.player1_score || 0);
  }

  function getGameResult(game: Game): 'won' | 'lost' | 'draw' {
    const myScore = getMyScore(game);
    const opponentScore = getOpponentScore(game);

    if (myScore > opponentScore) return 'won';
    if (myScore < opponentScore) return 'lost';
    return 'draw';
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInHours / 24;

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInMs / (1000 * 60));
      return `${minutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  function renderActiveGame(game: Game) {
    const opponent = getOpponentName(game);
    const myScore = getMyScore(game);
    const opponentScore = getOpponentScore(game);
    const isWaiting = game.status === 'waiting';

    return (
      <TouchableOpacity
        key={game.id}
        onPress={() => {
          if (isWaiting) {
            router.push(`/matchmaking/${game.id}`);
          } else {
            router.push(`/game/${game.id}`);
          }
        }}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={isWaiting ? ['#3b82f6', '#2563eb'] : ['#10b981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gameCard}
        >
          <View style={styles.gameCardHeader}>
            <View style={styles.gameCardTitleRow}>
              <Users size={20} color="#fff" strokeWidth={2.5} />
              <Text style={styles.gameCardTitle}>
                {isWaiting ? 'Waiting for Opponent' : `vs ${opponent}`}
              </Text>
            </View>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>
                {isWaiting ? 'Waiting' : game.status === 'paused' ? 'Paused' : 'Active'}
              </Text>
            </View>
          </View>

          {!isWaiting && (
            <View style={styles.scoreRow}>
              <View style={styles.scoreItem}>
                <Text style={styles.scoreLabel}>You</Text>
                <Text style={styles.scoreValue}>{myScore}</Text>
              </View>
              <View style={styles.scoreDivider} />
              <View style={styles.scoreItem}>
                <Text style={styles.scoreLabel}>{opponent}</Text>
                <Text style={styles.scoreValue}>{opponentScore}</Text>
              </View>
            </View>
          )}

          <View style={styles.gameCardFooter}>
            <View style={styles.gameInfoRow}>
              <Clock size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.gameInfoText}>
                {formatDate(game.updated_at || game.created_at)}
              </Text>
            </View>
            <View style={styles.playButton}>
              <Play size={16} color="#fff" fill="#fff" />
              <Text style={styles.playButtonText}>
                {isWaiting ? 'View' : 'Resume'}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  function renderCompletedGame(game: Game) {
    const opponent = getOpponentName(game);
    const myScore = getMyScore(game);
    const opponentScore = getOpponentScore(game);
    const result = getGameResult(game);

    const gradientColors =
      result === 'won' ? ['#059669', '#047857'] :
      result === 'lost' ? ['#dc2626', '#b91c1c'] :
      ['#6b7280', '#4b5563'];

    return (
      <TouchableOpacity
        key={game.id}
        onPress={() => router.push(`/game/${game.id}`)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.completedCard}
        >
          <View style={styles.completedHeader}>
            <View style={styles.resultBadge}>
              {result === 'won' && <Crown size={18} color="#fff" fill="#fff" />}
              {result === 'lost' && <User size={18} color="#fff" />}
              {result === 'draw' && <Users size={18} color="#fff" />}
              <Text style={styles.resultText}>
                {result === 'won' ? 'Victory' : result === 'lost' ? 'Defeat' : 'Draw'}
              </Text>
            </View>
            <Text style={styles.opponentName}>vs {opponent}</Text>
          </View>

          <View style={styles.completedScoreRow}>
            <View style={styles.completedScoreItem}>
              <Text style={styles.completedScoreLabel}>You</Text>
              <Text style={styles.completedScoreValue}>{myScore}</Text>
            </View>
            <View style={styles.completedScoreDivider}>
              <View style={styles.completedScoreLine} />
            </View>
            <View style={styles.completedScoreItem}>
              <Text style={styles.completedScoreLabel}>{opponent}</Text>
              <Text style={styles.completedScoreValue}>{opponentScore}</Text>
            </View>
          </View>

          <View style={styles.completedFooter}>
            <View style={styles.completedInfoRow}>
              <Calendar size={12} color="rgba(255,255,255,0.7)" />
              <Text style={styles.completedInfoText}>
                {formatDate(game.updated_at || game.created_at)}
              </Text>
            </View>
            <Text style={styles.viewDetailsText}>View Details →</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <LinearGradient
      colors={['#1e1b4b', '#312e81', '#1e1b4b']}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.header}>
          <Trophy size={32} color="#fff" strokeWidth={2.5} />
          <Text style={styles.headerTitle}>My Games</Text>
        </View>

        {/* Active Games Section */}
        {activeGames.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Play size={20} color="#10b981" fill="#10b981" />
              <Text style={styles.sectionTitle}>Active Games</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{activeGames.length}</Text>
              </View>
            </View>
            <View style={styles.gamesGrid}>
              {activeGames.map(renderActiveGame)}
            </View>
          </View>
        )}

        {/* Completed Games Section */}
        {completedGames.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Trophy size={20} color="#fbbf24" />
              <Text style={styles.sectionTitle}>Match History</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{completedGames.length}</Text>
              </View>
            </View>
            <View style={styles.gamesGrid}>
              {completedGames.map(renderCompletedGame)}
            </View>
          </View>
        )}

        {/* Loading State */}
        {loading && activeGames.length === 0 && completedGames.length === 0 && (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Loading your games...</Text>
          </View>
        )}

        {/* Empty State */}
        {activeGames.length === 0 && completedGames.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Trophy size={64} color="rgba(255,255,255,0.2)" />
            <Text style={styles.emptyStateTitle}>No Games Yet</Text>
            <Text style={styles.emptyStateText}>
              Start playing to see your game history here!
            </Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    gap: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  countBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  gamesGrid: {
    gap: 16,
  },
  gameCard: {
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gameCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  gameCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  gameCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  scoreItem: {
    flex: 1,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 6,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
  },
  scoreDivider: {
    width: 2,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 16,
  },
  gameCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gameInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gameInfoText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  playButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  completedCard: {
    padding: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  completedHeader: {
    marginBottom: 14,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  resultText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  opponentName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
  completedScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  completedScoreItem: {
    flex: 1,
    alignItems: 'center',
  },
  completedScoreLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  completedScoreValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
  },
  completedScoreDivider: {
    marginHorizontal: 12,
  },
  completedScoreLine: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  completedFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completedInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  completedInfoText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 22,
  },
});
