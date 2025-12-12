import { router } from 'expo-router';
import { User as UserIcon, Users, KeyRound } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import { gameService } from '../../src/services/gameService';
import { RootState } from '../../src/store';
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
      setGames(playerGames.filter(g => g.status === 'playing'));
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
        const gameId = await gameService.createGame(profile.id, false);
        router.push(`/matchmaking/${gameId}`);
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
      router.push(`/matchmaking/${gameId}`);
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
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {games.length > 0 && (
          <TouchableOpacity
            style={styles.gameInProgressBanner}
            onPress={() => router.push(`/game/${games[0].id}`)}
          >
            <Text style={styles.bannerText}>You have a game in progress play</Text>
          </TouchableOpacity>
        )}

        <Image style={styles.scrableimg} source={require('../../assets/images/bannerimage.png')} />

        <Text style={styles.description}>
          Play your favorite game of Scrabble with friends and family or practice against the computer in real-time. Play Scrabble online for free now!
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleQuickPlay}
            disabled={loading}
          >
            <View style={[styles.iconWrapper, styles.pinkIcon]}>
              <Users size={24} color={colors.surface} />
            </View>
            <Text style={styles.actionButtonText}>Find a Match</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => createNewGame(true)}
            disabled={loading}
          >
            <View style={[styles.iconWrapper, styles.yellowIcon]}>
              <UserIcon size={24} color={colors.surface} />
            </View>
            <Text style={styles.actionButtonText}>Play a Friend</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/join-game')}
            disabled={loading}
          >
            <View style={[styles.iconWrapper, styles.greenIcon]}>
              <KeyRound size={24} color={colors.surface} />
            </View>
            <Text style={styles.actionButtonText}>Join with Code</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  gameInProgressBanner: {
    backgroundColor: '#FBD59A',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  bannerText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
scrableimg: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    marginBottom: spacing.xl,
    alignSelf: 'center',
  },  
  description: {
    fontSize:14,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  actions: {
    gap: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  pinkIcon: {
    backgroundColor: colors.button.pink,
  },
  yellowIcon: {
    backgroundColor: colors.button.yellow,
  },
  greenIcon: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
});
