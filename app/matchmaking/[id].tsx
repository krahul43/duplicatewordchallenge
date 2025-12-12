import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { MatchmakingLoader } from '../../src/components/MatchmakingLoader';
import { WaitingForFriendScreen } from '../../src/components/WaitingForFriendScreen';
import { gameService } from '../../src/services/gameService';
import { RootState } from '../../src/store';
import { Game } from '../../src/types/game';

export default function MatchmakingScreen() {
  const { id } = useLocalSearchParams();
  const profile = useSelector((state: RootState) => state.auth.profile);
  const [game, setGame] = useState<Game | null>(null);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    const unsubscribe = gameService.subscribeToGame(id, (updatedGame) => {
      setGame(updatedGame);

      if (updatedGame.status === 'playing') {
        router.replace(`/game/${id}`);
      }
    });

    loadGame();

    return () => unsubscribe();
  }, [id]);

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
    if (!id || typeof id !== 'string' || !profile?.id) return;

    try {
      await gameService.resignGame(id, profile.id);
      router.back();
    } catch (error) {
      console.error('Failed to cancel game:', error);
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
