import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { Shuffle, Send } from 'lucide-react-native';
import { RootState } from '../../src/store';
import { setCurrentGame, setMyRack, setSelectedTiles, addSelectedTile, shuffleRack, clearSelectedTiles } from '../../src/store/slices/gameSlice';
import { gameService } from '../../src/services/gameService';
import { GameBoard } from '../../src/components/GameBoard';
import { TileRack } from '../../src/components/TileRack';
import { WordBuilder } from '../../src/components/WordBuilder';
import { GameTimer } from '../../src/components/GameTimer';
import { Button } from '../../src/components/Button';
import { RoundResultModal } from '../../src/components/RoundResultModal';
import { colors, spacing, typography } from '../../src/theme/colors';
import { Game, Tile } from '../../src/types/game';
import { isValidWord } from '../../src/utils/gameLogic';

export default function GameScreen() {
  const { id } = useLocalSearchParams();
  const dispatch = useDispatch();
  const profile = useSelector((state: RootState) => state.auth.profile);
  const { currentGame, myRack, selectedTiles } = useSelector((state: RootState) => state.game);
  const [timeRemaining, setTimeRemaining] = useState(120);
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [roundResult, setRoundResult] = useState<any>(null);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    loadGame();

    const unsubscribe = gameService.subscribeToGame(id, (game) => {
      dispatch(setCurrentGame(game));

      if (game.status === 'waiting' && game.player2_id) {
        startGame(game);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [id]);

  useEffect(() => {
    if (currentGame?.current_rack) {
      dispatch(setMyRack(currentGame.current_rack as Tile[]));
    }
  }, [currentGame?.current_rack]);

  useEffect(() => {
    if (!currentGame?.timer_ends_at) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(currentGame.timer_ends_at!).getTime();
      const remaining = Math.max(0, Math.floor((end - now) / 1000));
      setTimeRemaining(remaining);

      if (remaining === 0) {
        handleTimeUp();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentGame?.timer_ends_at]);

  async function loadGame() {
    if (!id || typeof id !== 'string') return;

    try {
      const game = await gameService.getGame(id);

      if (game) {
        dispatch(setCurrentGame(game));

        if (game.status === 'waiting' && game.player2_id) {
          startGame(game);
        }
      }
    } catch (error) {
      console.error('Failed to load game:', error);
    }
  }

  async function startGame(game: Game) {
  }

  function handleTilePress(tile: Tile, index: number) {
    dispatch(addSelectedTile(tile));
  }

  function handleRemoveTile(index: number) {
    const newSelected = [...selectedTiles];
    newSelected.splice(index, 1);
    dispatch(setSelectedTiles(newSelected));
  }

  function handleShuffle() {
    dispatch(shuffleRack());
  }

  function handleClear() {
    dispatch(clearSelectedTiles());
  }

  async function handleSubmit() {
    const word = selectedTiles.map(t => t.letter).join('');

    if (!isValidWord(word)) {
      Alert.alert('Invalid Word', 'Please create a valid word (at least 2 letters)');
      return;
    }

    if (!id || typeof id !== 'string' || !profile?.id) return;

    setLoading(true);

    try {
      const result = await gameService.submitWord(id, profile.id, word, selectedTiles);

      if (result.roundComplete && result.result) {
        setRoundResult(result.result);
        setShowResult(true);
      }

      dispatch(clearSelectedTiles());
    } catch (error) {
      Alert.alert('Error', 'Failed to submit word');
    } finally {
      setLoading(false);
    }
  }

  async function handleTimeUp() {
    const word = selectedTiles.map(t => t.letter).join('');
    if (word.length >= 2) {
      await handleSubmit();
    }
  }

  function handleNextRound() {
    setShowResult(false);
    setRoundResult(null);
    loadGame();
  }

  if (!currentGame) {
    return (
      <View style={styles.loading}>
        <Text>Loading game...</Text>
      </View>
    );
  }

  const isMyTurn = currentGame.status === 'playing';
  const opponent = currentGame.player1_id === profile?.id ? 'Player 2' : 'Player 1';
  const myScore = currentGame.player1_id === profile?.id ? currentGame.player1_score : currentGame.player2_score;
  const opponentScore = currentGame.player1_id === profile?.id ? currentGame.player2_score : currentGame.player1_score;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.scoreContainer}>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreName}>You</Text>
            <Text style={styles.scoreValue}>{myScore}</Text>
          </View>
          <GameTimer seconds={timeRemaining} totalSeconds={currentGame.round_duration_seconds} />
          <View style={styles.scoreCard}>
            <Text style={styles.scoreName}>{opponent}</Text>
            <Text style={styles.scoreValue}>{opponentScore}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.boardContainer}>
          <GameBoard board={currentGame.board as any} />
        </View>

        <WordBuilder
          selectedTiles={selectedTiles}
          onRemoveTile={handleRemoveTile}
          onClear={handleClear}
        />

        <TileRack tiles={myRack} onTilePress={handleTilePress} />

        <View style={styles.actions}>
          <TouchableOpacity onPress={handleShuffle} style={styles.iconButton}>
            <Shuffle size={24} color={colors.primary} />
          </TouchableOpacity>

          <Button
            title="Submit Word"
            onPress={handleSubmit}
            disabled={selectedTiles.length < 2 || loading}
            loading={loading}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>

      {roundResult && (
        <RoundResultModal
          visible={showResult}
          winnerName={roundResult.winnerName}
          winnerWord={roundResult.winningWord}
          winnerScore={roundResult.winningScore}
          loserWord={roundResult.loserWord}
          loserScore={roundResult.loserScore}
          isWinner={roundResult.winnerId === profile?.id}
          onNext={handleNextRound}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreCard: {
    alignItems: 'center',
  },
  scoreName: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  scoreValue: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
  },
  boardContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  iconButton: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  submitButton: {
    flex: 1,
  },
});
