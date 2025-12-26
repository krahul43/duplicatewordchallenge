import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
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
  const [isExpired, setIsExpired] = useState(false);
  const hasNavigatedRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!id || typeof id !== 'string' || !profile?.id) return;

    hasNavigatedRef.current = false;

    loadInitialGame();

    const gameUnsubscribe = gameService.subscribeToGame(id, (updatedGame) => {
      if (hasNavigatedRef.current) return;

      if (!updatedGame) {
        console.log('Game not found');
        return;
      }

      const isPlayer1 = updatedGame.player1_id === profile.id;
      const isPlayer2 = updatedGame.player2_id === profile.id;
      const isParticipant = isPlayer1 || isPlayer2;

      if (updatedGame.is_private && !isPlayer1) {
        console.log('Not the game creator for private match');
        return;
      }

      if (!updatedGame.is_private && !isParticipant) {
        console.log('Not a participant in this public match');
        return;
      }

      setGame(updatedGame);

      if (updatedGame.is_private && updatedGame.join_code_expires_at) {
        const expiresAt = new Date(updatedGame.join_code_expires_at).getTime();
        if (Date.now() > expiresAt && updatedGame.status === 'waiting') {
          setIsExpired(true);
          hasNavigatedRef.current = true;
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          Alert.alert(
            'Code Expired',
            'Your game code has expired. Please create a new game.',
            [{ text: 'OK', onPress: () => router.back() }],
            { onDismiss: () => router.back() }
          );
          return;
        }
      }

      if (updatedGame.status === 'cancelled' || updatedGame.status === 'finished') {
        hasNavigatedRef.current = true;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        router.back();
        return;
      }

      if (updatedGame.status === 'playing' && updatedGame.player2_id) {
        hasNavigatedRef.current = true;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        console.log('Game started with both players, navigating to game:', id);
        router.replace(`/game/${id}`);
      }
    });

    const matchmakingUnsubscribe = matchmakingService.subscribeToMatchmaking(
      profile.id,
      async (request) => {
        if (hasNavigatedRef.current) return;

        if (request?.status === 'matched' && request.gameId && request.gameId !== id) {
          hasNavigatedRef.current = true;
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          console.log('Matched with opponent in different game, navigating to:', request.gameId);
          await presenceService.setInGame(profile.id, request.gameId);
          router.replace(`/game/${request.gameId}`);
        }
      }
    );

    const timeout = setTimeout(async () => {
      if (hasNavigatedRef.current) {
        console.log('Matchmaking timeout cancelled - already navigated');
        return;
      }

      console.log('Matchmaking timeout reached');
      hasNavigatedRef.current = true;

      try {
        await matchmakingService.cancelMatchmaking(profile.id);
        if (id && typeof id === 'string') {
          const gameData = await gameService.getGame(id);
          if (gameData && gameData.status === 'waiting') {
            await gameService.cancelWaitingGame(id);
          }
        }
      } catch (error) {
        console.error('Error during timeout cleanup:', error);
      }

      Alert.alert(
        'No Opponent Found',
        'Unable to find an opponent. Please try again.',
        [{ text: 'OK', onPress: () => router.back() }],
        { onDismiss: () => router.back() }
      );
    }, 60000);

    timeoutRef.current = timeout;

    return () => {
      console.log('Matchmaking screen cleanup');
      hasNavigatedRef.current = true;
      gameUnsubscribe();
      matchmakingUnsubscribe();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [id, profile?.id]);

  async function loadInitialGame() {
    if (!id || typeof id !== 'string' || !profile?.id) return;

    try {
      const gameData = await gameService.getGame(id);
      if (!gameData) {
        console.error('Game not found');
        Alert.alert('Error', 'Game not found', [{ text: 'OK', onPress: () => router.back() }]);
        return;
      }

      const isPlayer1 = gameData.player1_id === profile.id;
      const isPlayer2 = gameData.player2_id === profile.id;
      const isParticipant = isPlayer1 || isPlayer2;

      if (gameData.is_private && !isPlayer1) {
        console.error('User is not the game creator for private game');
        Alert.alert('Error', 'You cannot access this private game', [{ text: 'OK', onPress: () => router.back() }]);
        return;
      }

      if (!gameData.is_private && !isParticipant) {
        console.error('User is not a participant in this public game');
        Alert.alert('Error', 'You are not part of this game', [{ text: 'OK', onPress: () => router.back() }]);
        return;
      }

      if (gameData.is_private && gameData.join_code_expires_at) {
        const expiresAt = new Date(gameData.join_code_expires_at).getTime();
        if (Date.now() > expiresAt) {
          setIsExpired(true);
          Alert.alert(
            'Code Expired',
            'Your game code has expired. Please create a new game.',
            [{ text: 'OK', onPress: () => router.back() }],
            { onDismiss: () => router.back() }
          );
          return;
        }
      }

      setGame(gameData);

      if (gameData.status === 'playing' && gameData.player2_id) {
        hasNavigatedRef.current = true;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        console.log('Game already playing on initial load, navigating');
        router.replace(`/game/${id}`);
      }
    } catch (error) {
      console.error('Failed to load game:', error);
      Alert.alert('Error', 'Failed to load game', [{ text: 'OK', onPress: () => router.back() }]);
    }
  }

  async function handleCancel() {
    if (!profile?.id || hasNavigatedRef.current || isExpired) return;

    try {
      hasNavigatedRef.current = true;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      await matchmakingService.cancelMatchmaking(profile.id);

      if (id && typeof id === 'string') {
        const gameData = await gameService.getGame(id);
        if (gameData && gameData.status === 'waiting') {
          await gameService.cancelWaitingGame(id);
        }
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
        expiresAt={game.join_code_expires_at}
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
