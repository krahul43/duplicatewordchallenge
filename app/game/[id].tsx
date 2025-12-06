import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { Shuffle, X, Menu, Zap, BookOpen, Droplets, ChevronLeft, Diamond } from 'lucide-react-native';
import { RootState } from '../../src/store';
import { setCurrentGame, setMyRack, setSelectedTiles, addSelectedTile, shuffleRack, clearSelectedTiles } from '../../src/store/slices/gameSlice';
import { gameService } from '../../src/services/gameService';
import { GameBoard } from '../../src/components/GameBoard';
import { TileRack } from '../../src/components/TileRack';
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
  const totalScore = selectedTiles.reduce((sum, t) => sum + t.points, 0);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color="#fff" />
        </TouchableOpacity>

        <View style={styles.languageFlag}>
          <Text style={styles.flagText}>🇬🇧</Text>
        </View>

        <View style={styles.turnIndicator}>
          <Text style={styles.turnText}>Your Turn</Text>
        </View>

        <View style={styles.gemsContainer}>
          <Diamond size={20} color="#4FC3F7" />
          <Text style={styles.gemsText}>50</Text>
        </View>
      </View>

      <View style={styles.playersSection}>
        <View style={styles.playerCard}>
          <View style={styles.playerCardInner}>
            <View style={styles.playerAvatar}>
              <Text style={styles.playerAvatarText}>
                {profile?.display_name?.charAt(0).toUpperCase() || 'A'}
              </Text>
            </View>
            <Text style={styles.playerLabelDark}>You</Text>
            <Text style={styles.playerScoreDark}>{myScore}</Text>
          </View>
        </View>

        <View style={styles.centerIcon}>
          <View style={styles.giftBox}>
            <Text style={styles.giftEmoji}>🎁</Text>
          </View>
        </View>

        <View style={[styles.playerCard, styles.opponentCard]}>
          <View style={styles.playerCardInner}>
            <View style={[styles.playerAvatar, styles.opponentAvatar]}>
              <Text style={styles.playerAvatarText}>W</Text>
            </View>
            <Text style={styles.playerLabel}>{opponent}</Text>
            <Text style={styles.playerScore}>{opponentScore}</Text>
          </View>
        </View>
      </View>

      <View style={styles.powerUpsContainer}>
        <TouchableOpacity style={styles.powerUpButton}>
          <View style={styles.powerUpIcon}>
            <Zap size={24} color="#FFD700" />
          </View>
          <Text style={styles.powerUpLabel}>Free</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.powerUpButton}>
          <View style={styles.powerUpIcon}>
            <BookOpen size={24} color="#9C27B0" />
          </View>
          <Text style={styles.powerUpLabel}>Free</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.powerUpButton}>
          <View style={styles.powerUpIcon}>
            <Droplets size={24} color="#00BCD4" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.boardWrapper}>
        <GameBoard board={currentGame.board as any} />
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.wordBuildingArea}>
          <View style={styles.selectedTilesContainer}>
            {selectedTiles.length === 0 ? (
              <Text style={styles.wordPlaceholder}>Tap tiles to build your word</Text>
            ) : (
              selectedTiles.map((tile, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleRemoveTile(index)}
                  style={styles.selectedTile}
                  activeOpacity={0.7}
                >
                  <Text style={styles.selectedTileLetter}>{tile.letter}</Text>
                  <Text style={styles.selectedTilePoints}>{tile.points}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>

        <TileRack tiles={myRack} onTilePress={handleTilePress} selectedTiles={selectedTiles} />

        <View style={styles.actionsBar}>
          <TouchableOpacity style={styles.actionButton}>
            <Menu size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleShuffle} style={styles.actionButton}>
            <Shuffle size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={selectedTiles.length < 2 || loading}
            style={[styles.submitButtonNew, (selectedTiles.length < 2 || loading) && styles.submitButtonDisabled]}
          >
            <Text style={styles.submitButtonTextNew}>Submit</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleClear} style={styles.actionButton}>
            <X size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.scoreCircle}>
            <Text style={styles.scoreCircleText}>{totalScore}</Text>
          </View>
        </View>
      </View>

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
    backgroundColor: '#66BB6A',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#66BB6A',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.xl + 10,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageFlag: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flagText: {
    fontSize: 24,
  },
  turnIndicator: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  turnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  gemsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 20,
    gap: 4,
  },
  gemsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  playersSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  playerCard: {
    flex: 1,
    backgroundColor: '#FFF8E1',
    borderRadius: 16,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  opponentCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  playerCardInner: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  playerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E57373',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  opponentAvatar: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  playerAvatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  playerLabelDark: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  playerScoreDark: {
    fontSize: 32,
    fontWeight: '700',
    color: '#333',
  },
  playerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  playerScore: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  centerIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: -spacing.md,
    zIndex: 10,
  },
  giftBox: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#43A047',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  giftEmoji: {
    fontSize: 36,
  },
  powerUpsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  powerUpButton: {
    alignItems: 'center',
    gap: 2,
  },
  powerUpIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  powerUpLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: '#FF9800',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: -8,
  },
  boardWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: spacing.xs,
  },
  bottomSection: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  wordBuildingArea: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedTilesContainer: {
    flexDirection: 'row',
    gap: 6,
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  wordPlaceholder: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontStyle: 'italic',
  },
  selectedTile: {
    width: 52,
    height: 58,
    backgroundColor: '#F5E6D3',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    borderWidth: 3,
    borderColor: '#43A047',
  },
  selectedTileLetter: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2C5F2D',
  },
  selectedTilePoints: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2C5F2D',
    position: 'absolute',
    bottom: 3,
    right: 5,
  },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonNew: {
    flex: 1,
    backgroundColor: '#43A047',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#9E9E9E',
    opacity: 0.6,
  },
  submitButtonTextNew: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  scoreCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  scoreCircleText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '700',
  },
});
