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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.playerInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile?.display_name?.charAt(0).toUpperCase() || 'P'}
            </Text>
          </View>
          <View style={styles.scoreInfo}>
            <Text style={styles.scoreLabel}>SC: {myScore}</Text>
            <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
          </View>
        </View>

        <View style={styles.timerDot} />

        <View style={styles.playerInfo}>
          <View style={styles.scoreInfo}>
            <Text style={styles.scoreLabel}>SC: {opponentScore}</Text>
            <Text style={styles.timerText}>{formatTime(currentGame.round_duration_seconds - timeRemaining)}</Text>
          </View>
          <View style={[styles.avatar, styles.opponentAvatar]}>
            <Text style={styles.avatarText}>O</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.boardContainer}>
          <GameBoard board={currentGame.board as any} />
        </View>

        <TileRack tiles={myRack} onTilePress={handleTilePress} />

        <View style={styles.actions}>
          <TouchableOpacity onPress={handleShuffle} style={styles.iconButton}>
            <Shuffle size={20} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={selectedTiles.length < 2 || loading}
            style={[styles.submitButton, (selectedTiles.length < 2 || loading) && styles.submitButtonDisabled]}
          >
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleClear} style={styles.iconButton}>
            <Text style={styles.iconButtonText}>↺</Text>
          </TouchableOpacity>
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
    paddingTop: spacing.xl + 10,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  opponentAvatar: {
    backgroundColor: '#8B7355',
  },
  avatarText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: '700',
  },
  scoreInfo: {
    alignItems: 'flex-start',
  },
  scoreLabel: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  timerText: {
    ...typography.caption,
    color: colors.muted,
    fontSize: 12,
  },
  timerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.warning,
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
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconButtonText: {
    fontSize: 24,
    color: colors.text,
  },
  submitButton: {
    flex: 1,
    backgroundColor: colors.button.primary,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: colors.muted,
    opacity: 0.5,
  },
  submitButtonText: {
    ...typography.button,
    color: colors.surface,
    fontWeight: '700',
  },
});
