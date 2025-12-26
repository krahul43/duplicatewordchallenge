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
  const currentGameIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!id || typeof id !== 'string' || !profile?.id) {
      console.error('[MatchmakingScreen] Missing required data:', { id, hasProfile: !!profile?.id });
      return;
    }

    console.log('[MatchmakingScreen] ========== SCREEN MOUNTED/UPDATED ==========');
    console.log('[MatchmakingScreen] Game ID from route:', id);
    console.log('[MatchmakingScreen] Game ID type:', typeof id);
    console.log('[MatchmakingScreen] User ID:', profile.id);
    console.log('[MatchmakingScreen] Previous game ID:', currentGameIdRef.current);

    // Store current game ID
    currentGameIdRef.current = id;

    // Reset state for new game
    setGame(null);
    setIsExpired(false);
    hasNavigatedRef.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    console.log('[MatchmakingScreen] State reset, loading game...');
    loadInitialGame();

    console.log('[MatchmakingScreen] Setting up subscription for game:', id);
    const gameUnsubscribe = gameService.subscribeToGame(id, (updatedGame) => {
      // Check if this update is for the current game
      if (currentGameIdRef.current !== id) {
        console.log('[MatchmakingScreen] ⚠️ Update ignored - stale subscription');
        console.log('[MatchmakingScreen] Current game ID:', currentGameIdRef.current);
        console.log('[MatchmakingScreen] Update game ID:', id);
        return;
      }

      if (hasNavigatedRef.current) {
        console.log('[MatchmakingScreen] Update ignored - already navigated');
        return;
      }

      if (!updatedGame) {
        console.log('[MatchmakingScreen] Game not found in subscription');
        return;
      }

      console.log('[MatchmakingScreen] 📥 Game update received for subscription ID:', id);
      console.log('[MatchmakingScreen] Update data:', {
        gameId: updatedGame.id,
        subscriptionId: id,
        currentGameId: currentGameIdRef.current,
        idsMatch: updatedGame.id === id && id === currentGameIdRef.current,
        status: updatedGame.status,
        is_private: updatedGame.is_private,
        player2_id: updatedGame.player2_id,
      });

      if (updatedGame.status === 'finished') {
        console.error('[MatchmakingScreen] Game is finished, should not be in matchmaking');
        hasNavigatedRef.current = true;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        Alert.alert('Error', 'This game has already ended', [
          {
            text: 'OK',
            onPress: () => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)');
              }
            }
          }
        ]);
        return;
      }

      const isPlayer1 = updatedGame.player1_id === profile.id;
      const isPlayer2 = updatedGame.player2_id === profile.id;
      const isParticipant = isPlayer1 || isPlayer2;

      if (updatedGame.is_private && !isPlayer1) {
        console.log('[MatchmakingScreen] Not the game creator for private match');
        return;
      }

      if (!updatedGame.is_private && !isParticipant) {
        console.log('[MatchmakingScreen] Not a participant in this public match');
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

      if (updatedGame.status === 'cancelled') {
        hasNavigatedRef.current = true;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        console.log('[MatchmakingScreen] Game cancelled, going back');
        router.back();
        return;
      }

      if (updatedGame.status === 'playing' && updatedGame.player2_id) {
        hasNavigatedRef.current = true;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        console.log('[MatchmakingScreen] Game started with both players, navigating to game:', id);
        router.replace(`/game/${id}`);
      }
    });

    let matchmakingUnsubscribe: (() => void) | null = null;

    // Only subscribe to matchmaking for PUBLIC games
    loadInitialGame().then((gameData) => {
      if (gameData && !gameData.is_private) {
        console.log('[MatchmakingScreen] Setting up matchmaking subscription for public game');
        matchmakingUnsubscribe = matchmakingService.subscribeToMatchmaking(
          profile.id,
          async (request) => {
            if (hasNavigatedRef.current) return;
            if (currentGameIdRef.current !== id) return;

            if (request?.status === 'matched' && request.gameId && request.gameId !== id) {
              hasNavigatedRef.current = true;
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
              console.log('Matched with opponent in different game, navigating to:', request.gameId);
              await presenceService.setInGame(profile.id, request.gameId);
              router.replace(`/game/${request.gameId}`);
            }
          }
        );
      } else {
        console.log('[MatchmakingScreen] Private game - skipping matchmaking subscription');
      }
    });

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
      console.log('[MatchmakingScreen] Cleanup for game:', id);
      hasNavigatedRef.current = true;
      gameUnsubscribe();
      if (matchmakingUnsubscribe) {
        matchmakingUnsubscribe();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Clear current game ID on cleanup
      if (currentGameIdRef.current === id) {
        currentGameIdRef.current = null;
      }
    };
  }, [id, profile?.id]);

  async function loadInitialGame(): Promise<Game | null> {
    if (!id || typeof id !== 'string' || !profile?.id) return null;

    console.log('[MatchmakingScreen] Loading initial game:', id);
    const loadGameId = id; // Capture the ID at call time

    try {
      const gameData = await gameService.getGame(loadGameId);

      // Check if we're still on the same game after async operation
      if (currentGameIdRef.current !== loadGameId) {
        console.log('[MatchmakingScreen] ⚠️ Load cancelled - game ID changed');
        console.log('[MatchmakingScreen] Loaded ID:', loadGameId);
        console.log('[MatchmakingScreen] Current ID:', currentGameIdRef.current);
        return null;
      }

      if (!gameData) {
        console.error('[MatchmakingScreen] Game not found');
        Alert.alert('Error', 'Game not found', [{ text: 'OK', onPress: () => router.back() }]);
        return null;
      }

      console.log('[MatchmakingScreen] Loaded game:', {
        id: gameData.id,
        status: gameData.status,
        is_private: gameData.is_private,
        player1_id: gameData.player1_id,
        player2_id: gameData.player2_id,
      });

      if (gameData.status === 'finished' || gameData.status === 'cancelled') {
        console.error('[MatchmakingScreen] Game is already finished/cancelled');
        hasNavigatedRef.current = true;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        Alert.alert('Error', 'This game has already ended', [
          {
            text: 'OK',
            onPress: () => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)');
              }
            }
          }
        ]);
        return null;
      }

      const isPlayer1 = gameData.player1_id === profile.id;
      const isPlayer2 = gameData.player2_id === profile.id;
      const isParticipant = isPlayer1 || isPlayer2;

      if (gameData.is_private && !isPlayer1) {
        console.error('[MatchmakingScreen] User is not the game creator for private game');
        Alert.alert('Error', 'You cannot access this private game', [{ text: 'OK', onPress: () => router.back() }]);
        return null;
      }

      if (!gameData.is_private && !isParticipant) {
        console.error('[MatchmakingScreen] User is not a participant in this public game');
        Alert.alert('Error', 'You are not part of this game', [{ text: 'OK', onPress: () => router.back() }]);
        return null;
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
          return null;
        }
      }

      setGame(gameData);

      if (gameData.status === 'playing' && gameData.player2_id) {
        hasNavigatedRef.current = true;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        console.log('[MatchmakingScreen] Game already playing on initial load, navigating');
        router.replace(`/game/${id}`);
      }

      return gameData;
    } catch (error) {
      console.error('[MatchmakingScreen] Failed to load game:', error);
      Alert.alert('Error', 'Failed to load game', [{ text: 'OK', onPress: () => router.back() }]);
      return null;
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
