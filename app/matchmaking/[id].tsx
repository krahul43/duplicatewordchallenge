import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { MatchmakingLoader } from '../../src/components/MatchmakingLoader';
import { WaitingForFriendScreen } from '../../src/components/WaitingForFriendScreen';
import { gameService } from '../../src/services/gameService';
import { matchmakingService } from '../../src/services/matchmakingService';
import { presenceService } from '../../src/services/presenceService';
import { RootState } from '../../src/store';
import { Game } from '../../src/types/game';

export default function MatchmakingScreen() {
  const { id } = useLocalSearchParams();
  const profile = useSelector((state: RootState) => state.auth.profile);
  const [game, setGame] = useState<Game | null>(null);
  const [matchmakingTimeout, setMatchmakingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    if (!id || typeof id !== 'string' || !profile?.id) return;

    let hasNavigated = false;

    const gameUnsubscribe = gameService.subscribeToGame(id, (updatedGame) => {
      if (hasTimedOut || hasNavigated) return;

      setGame(updatedGame);

      if (updatedGame.status === 'playing' && updatedGame.player2_id) {
        hasNavigated = true;
        if (matchmakingTimeout) {
          clearTimeout(matchmakingTimeout);
        }
        console.log('Game started, navigating to game:', id);
        router.replace(`/game/${id}`);
      }
    });

    const matchmakingUnsubscribe = matchmakingService.subscribeToMatchmaking(
      profile.id,
      async (request) => {
        if (hasTimedOut || hasNavigated) return;

        if (request?.status === 'matched' && request.gameId && request.gameId !== id) {
          hasNavigated = true;
          if (matchmakingTimeout) {
            clearTimeout(matchmakingTimeout);
          }
          console.log('Matched with opponent, navigating to game:', request.gameId);
          await presenceService.setInGame(profile.id, request.gameId);
          router.replace(`/game/${request.gameId}`);
        } else if (request?.status === 'matched' && request.gameId === id && request.opponentId) {
          const gameData = await gameService.getGame(id);
          if (gameData && gameData.status === 'playing' && gameData.player2_id) {
            hasNavigated = true;
            if (matchmakingTimeout) {
              clearTimeout(matchmakingTimeout);
            }
            console.log('Opponent joined our game, navigating to game:', id);
            router.replace(`/game/${id}`);
          }
        }
      }
    );

    const checkInterval = setInterval(async () => {
      if (hasNavigated || hasTimedOut) {
        clearInterval(checkInterval);
        return;
      }

      try {
        const currentRequest = await matchmakingService.getMatchmakingRequest(profile.id);

        if (currentRequest?.status === 'matched' && currentRequest.gameId) {
          hasNavigated = true;
          clearInterval(checkInterval);
          if (matchmakingTimeout) {
            clearTimeout(matchmakingTimeout);
          }
          console.log('Found match during polling, navigating to game:', currentRequest.gameId);
          await presenceService.setInGame(profile.id, currentRequest.gameId);
          router.replace(`/game/${currentRequest.gameId}`);
          return;
        }

        if (id && typeof id === 'string') {
          const gameData = await gameService.getGame(id);
          if (gameData && gameData.status === 'playing' && gameData.player2_id) {
            hasNavigated = true;
            clearInterval(checkInterval);
            if (matchmakingTimeout) {
              clearTimeout(matchmakingTimeout);
            }
            console.log('Opponent joined our game during polling, navigating to game:', id);
            await presenceService.setInGame(profile.id, id);
            router.replace(`/game/${id}`);
          }
        }
      } catch (error) {
        console.error('Error during matchmaking poll:', error);
      }
    }, 2000);

    const timeout = setTimeout(async () => {
      console.log('Matchmaking timeout reached');
      setHasTimedOut(true);
      clearInterval(checkInterval);

      try {
        await matchmakingService.cancelMatchmaking(profile.id);
        if (id && typeof id === 'string') {
          await gameService.resignGame(id, profile.id);
        }
      } catch (error) {
        console.error('Error during timeout cleanup:', error);
      }

      Alert.alert(
        'No Opponent Found',
        'Unable to find an opponent. Please try again.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ],
        { onDismiss: () => router.back() }
      );
    }, 60000);

    setMatchmakingTimeout(timeout);

    loadGame();

    return () => {
      gameUnsubscribe();
      matchmakingUnsubscribe();
      clearInterval(checkInterval);
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
    if (!profile?.id || hasTimedOut) return;

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
