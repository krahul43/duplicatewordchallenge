import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { MatchmakingLoader } from '../../src/components/MatchmakingLoader';
import { WaitingForFriendScreen } from '../../src/components/WaitingForFriendScreen';
import { gameService } from '../../src/services/gameService';
import { matchmakingService } from '../../src/services/matchmakingService';
import { RootState } from '../../src/store';
import { Game } from '../../src/types/game';

export default function MatchmakingScreen() {
  const { id } = useLocalSearchParams();
  const profile = useSelector((state: RootState) => state.auth.profile);
  const [game, setGame] = useState<Game | null>(null);
  const [matchmakingTimeout, setMatchmakingTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!id || typeof id !== 'string' || !profile?.id) return;

    const gameUnsubscribe = gameService.subscribeToGame(id, (updatedGame) => {
      setGame(updatedGame);

      if (updatedGame.status === 'playing' && updatedGame.player2_id) {
        if (matchmakingTimeout) {
          clearTimeout(matchmakingTimeout);
        }
        router.replace(`/game/${id}`);
      }
    });

    const matchmakingUnsubscribe = matchmakingService.subscribeToMatchmaking(
      profile.id,
      (request) => {
        if (request?.status === 'matched' && request.gameId) {
          if (matchmakingTimeout) {
            clearTimeout(matchmakingTimeout);
          }
          router.replace(`/game/${request.gameId}`);
        }
      }
    );

    const timeout = setTimeout(() => {
      Alert.alert(
        'No Opponent Found',
        'Unable to find an opponent. Please try again.',
        [
          {
            text: 'OK',
            onPress: () => handleCancel(),
          },
        ]
      );
    }, 60000);

    setMatchmakingTimeout(timeout);

    loadGame();

    return () => {
      gameUnsubscribe();
      matchmakingUnsubscribe();
      if (matchmakingTimeout) {
        clearTimeout(matchmakingTimeout);
      }
    };
  }, [id, profile?.id]);

  async function loadGame() {
    if (!id || typeof id !== 'string') return;

    try {
      const gameData = await gameService.getGame(id);
      if (gameData) {
        setGame(gameData);
        if (gameData.status === 'playing') {
          router.replace(`/game/${id}`);
        }
      }
    } catch (error) {
      console.error('Failed to load game:', error);
    }
  }

  async function handleCancel() {
    if (!profile?.id) return;

    try {
      if (matchmakingTimeout) {
        clearTimeout(matchmakingTimeout);
      }

      await matchmakingService.cancelMatchmaking(profile.id);

      if (id && typeof id === 'string') {
        await gameService.resignGame(id, profile.id);
      }

      router.back();
    } catch (error) {
      console.error('Failed to cancel matchmaking:', error);
      router.back();
    }
  }

  if (!game) {
    return (
      <View style={styles.container}>
        <MatchmakingLoader message="Loading..." />
      </View>
    );
  }

  if (game.is_private && game.join_code) {
    return (
      <WaitingForFriendScreen
        joinCode={game.join_code}
        gameId={game.id}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <View style={styles.container}>
      <MatchmakingLoader message="Finding opponent..." />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
