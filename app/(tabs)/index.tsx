import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSelector } from 'react-redux';
import { Users, User, Trophy } from 'lucide-react-native';
import { RootState } from '../../src/store';
import { gameService } from '../../src/services/gameService';
import { Button } from '../../src/components/Button';
import { colors, spacing, typography } from '../../src/theme/colors';
import { Game } from '../../src/types/game';

export default function HomeScreen() {
  const profile = useSelector((state: RootState) => state.auth.profile);
  const subscription = useSelector((state: RootState) => state.subscription);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGames();
  }, []);

  async function loadGames() {
    if (!profile) return;

    try {
      const playerGames = await gameService.getPlayerGames(profile.id);
      setGames(playerGames);
    } catch (error) {
      console.error('Failed to load games:', error);
    }
  }

  async function handleQuickPlay() {
    if (!canPlay()) {
      router.push('/subscription-required');
      return;
    }

    if (!profile?.id) return;

    setLoading(true);

    try {
      const waitingGame = await gameService.findWaitingGame(profile.id);

      if (waitingGame) {
        await gameService.joinGame(waitingGame.id, profile.id);
        router.push(`/game/${waitingGame.id}`);
      } else {
        await createNewGame(false);
      }
    } catch (error) {
      console.error('Failed to quick play:', error);
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
      const gameId = await gameService.createGame(profile.id, isPrivate);
      router.push(`/game/${gameId}`);
    } catch (error) {
      console.error('Failed to create game:', error);
    } finally {
      setLoading(false);
    }
  }

  function canPlay(): boolean {
    return subscription.status === 'trialing' || subscription.status === 'active';
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {subscription.status === 'trialing' && subscription.daysLeftInTrial > 0 && (
        <View style={styles.trialBanner}>
          <Text style={styles.trialText}>
            {subscription.daysLeftInTrial} days left in your free trial
          </Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/settings')}>
            <Text style={styles.trialLink}>Subscribe Now</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.title}>Mirror Scrabble</Text>
        <Text style={styles.subtitle}>
          Welcome back, {profile?.display_name || 'Player'}
        </Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{profile?.games_won || 0}</Text>
          <Text style={styles.statLabel}>Wins</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{profile?.games_played || 0}</Text>
          <Text style={styles.statLabel}>Games</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{profile?.highest_word_score || 0}</Text>
          <Text style={styles.statLabel}>Best Word</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          title="Quick Play"
          onPress={handleQuickPlay}
          loading={loading}
          style={styles.actionButton}
        />
        <Button
          title="Play with Friend"
          onPress={() => createNewGame(true)}
          variant="outline"
          loading={loading}
          style={styles.actionButton}
        />
      </View>

      {games.length > 0 && (
        <View style={styles.gamesSection}>
          <Text style={styles.sectionTitle}>Recent Games</Text>
          {games.map((game: any) => (
            <TouchableOpacity
              key={game.id}
              style={styles.gameCard}
              onPress={() => router.push(`/game/${game.id}`)}
            >
              <View style={styles.gameInfo}>
                <Text style={styles.gameStatus}>{game.status}</Text>
                <Text style={styles.gameScore}>
                  {game.player1_score} - {game.player2_score}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
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
  trialBanner: {
    backgroundColor: colors.success,
    padding: spacing.md,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  trialText: {
    ...typography.body,
    color: colors.surface,
    fontWeight: '600',
  },
  trialLink: {
    ...typography.body,
    color: colors.surface,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  header: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.muted,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
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
  },
  actions: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  actionButton: {
    width: '100%',
  },
  gamesSection: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  gameCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  gameInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gameStatus: {
    ...typography.body,
    color: colors.text,
    textTransform: 'capitalize',
  },
  gameScore: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
});
