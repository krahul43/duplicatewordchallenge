import { router, useLocalSearchParams } from 'expo-router';
import { BookOpen, ChevronLeft, Droplets, Flag, Menu, Pause, Play, Shuffle, X, Zap } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { GameBoard } from '../../src/components/GameBoard';
import { GameSummaryModal } from '../../src/components/GameSummaryModal';
import { RoundResultModal } from '../../src/components/RoundResultModal';
import { TileRack } from '../../src/components/TileRack';
import { gameService } from '../../src/services/gameService';
import { RootState } from '../../src/store';
import { addSelectedTile, clearSelectedTiles, setCurrentGame, setMyRack, setSelectedTiles, shuffleRack } from '../../src/store/slices/gameSlice';
import { colors, spacing } from '../../src/theme/colors';
import { Game, GameSummary, Tile } from '../../src/types/game';
import { validateWordWithDictionary } from '../../src/utils/dictionaryApi';
import { isBoardEmpty, isValidWord, wordConnectsToBoard, wordCoversCenter } from '../../src/utils/gameLogic';

export default function GameScreen() {
  const { id } = useLocalSearchParams();
  const dispatch = useDispatch();
  const profile = useSelector((state: RootState) => state.auth.profile);
  const { currentGame, myRack, selectedTiles } = useSelector((state: RootState) => state.game);
  const [timeRemaining, setTimeRemaining] = useState(120);
  const [loading, setLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [gameSummary, setGameSummary] = useState<GameSummary | null>(null);
  const [placedTiles, setPlacedTiles] = useState<{ row: number; col: number; letter: string; points: number }[]>([]);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [validatingWord, setValidatingWord] = useState(false);
  const [showRoundResult, setShowRoundResult] = useState(false);
  const [roundWinner, setRoundWinner] = useState<string | null>(null);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    loadGame();

    const unsubscribe = gameService.subscribeToGame(id, (game) => {
      dispatch(setCurrentGame(game));

      if (game.status === 'waiting' && game.player2_id) {
        startGame(game);
      }

      if (game.status === 'finished' && !showSummary) {
        loadGameSummary();
      }

      if (game.pause_status === 'requested' && game.pause_requested_by !== profile?.id) {
        showPauseRequest();
      }

      if (game.round_winner_id && game.current_round > (currentGame?.current_round || 0) && !showRoundResult) {
        setRoundWinner(game.round_winner_id === profile?.id ? 'You' : opponent);
        setTimeout(() => setShowRoundResult(true), 500);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [id]);

  async function loadGameSummary() {
    if (!id || typeof id !== 'string') return;

    try {
      const summary = await gameService.getGameSummary(id);
      if (summary) {
        setGameSummary(summary);
        setShowSummary(true);
      }
    } catch (error) {
      console.error('Failed to load game summary:', error);
    }
  }

  function showPauseRequest() {
    if (!currentGame) return;

    Alert.alert(
      'Pause Request',
      'Your opponent wants to pause the game. Do you accept?',
      [
        {
          text: 'Decline',
          style: 'cancel',
          onPress: () => handleRejectPause(),
        },
        {
          text: 'Accept',
          onPress: () => handleAcceptPause(),
        },
      ]
    );
  }

  useEffect(() => {
    if (!currentGame || !profile?.id) return;

    if (currentGame.shared_rack && currentGame.shared_rack.length > 0) {
      dispatch(setMyRack(currentGame.shared_rack as Tile[]));
    }
  }, [currentGame?.shared_rack, profile?.id]);

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
    if (!currentGame || hasSubmitted) return;
    dispatch(addSelectedTile(tile));
  }

  function handleRemoveTile(index: number) {
    if (!currentGame || hasSubmitted) return;
    const newSelected = [...selectedTiles];
    newSelected.splice(index, 1);
    dispatch(setSelectedTiles(newSelected));
  }

  function handleShuffle() {
    if (!currentGame || hasSubmitted) return;
    dispatch(shuffleRack());
  }

  function handleClear() {
    if (!currentGame || hasSubmitted) return;
    dispatch(clearSelectedTiles());
    setPlacedTiles([]);
    setSelectedCell(null);
  }

  function handleBoardCellPress(row: number, col: number) {
    if (!currentGame || hasSubmitted) return;
    if (selectedTiles.length === 0) {
      const existingTile = placedTiles.find(t => t.row === row && t.col === col);
      if (existingTile) {
        setPlacedTiles(placedTiles.filter(t => t.row !== row || t.col !== col));
        dispatch(addSelectedTile({ letter: existingTile.letter, points: existingTile.points }));
      }
      return;
    }

    const existingTile = placedTiles.find(t => t.row === row && t.col === col);
    if (existingTile) {
      Alert.alert('Cell Occupied', 'This cell already has a tile placed. Remove it first.');
      return;
    }

    const nextTile = selectedTiles[0];
    setPlacedTiles([...placedTiles, { row, col, letter: nextTile.letter, points: nextTile.points }]);

    const newSelected = selectedTiles.slice(1);
    dispatch(setSelectedTiles(newSelected));

    if (newSelected.length > 0) {
      setSelectedCell({ row, col });
    } else {
      setSelectedCell(null);
    }
  }

  async function handleSubmit() {
    if (!currentGame || !profile?.id) return;

    const isPlayer1 = currentGame.player1_id === profile.id;
    const alreadySubmitted = isPlayer1 ? currentGame.player1_submitted : currentGame.player2_submitted;

    if (alreadySubmitted) {
      Alert.alert('Already Submitted', 'You have already submitted your word for this round. Wait for your opponent or for the timer to run out.');
      return;
    }

    if (placedTiles.length < 2) {
      Alert.alert('Invalid Move', 'You must place at least 2 tiles on the board');
      return;
    }

    placedTiles.sort((a, b) => {
      if (a.row === b.row) return a.col - b.col;
      return a.row - b.row;
    });

    const isHorizontal = placedTiles.every(t => t.row === placedTiles[0].row);
    const isVertical = placedTiles.every(t => t.col === placedTiles[0].col);

    if (!isHorizontal && !isVertical) {
      Alert.alert('Invalid Placement', 'All tiles must be placed in a single row or column');
      return;
    }

    const boardIsEmpty = isBoardEmpty(currentGame.board);

    if (boardIsEmpty) {
      if (!wordCoversCenter(placedTiles)) {
        Alert.alert('Invalid First Move', 'First word must cover the center square (★)');
        return;
      }
    } else {
      if (!wordConnectsToBoard(placedTiles, currentGame.board)) {
        Alert.alert('Invalid Placement', 'Word must connect to existing tiles on the board');
        return;
      }
    }

    const word = placedTiles.map(t => t.letter).join('');

    if (!isValidWord(word)) {
      Alert.alert('Invalid Word', `"${word}" is not a valid word`);
      return;
    }

    if (!id || typeof id !== 'string') return;

    setLoading(true);
    setValidatingWord(true);

    try {
      const isValidDictionaryWord = await validateWordWithDictionary(word);

      if (!isValidDictionaryWord) {
        setValidatingWord(false);
        Alert.alert('Invalid Word', `"${word}" is not found in the dictionary`);
        setLoading(false);
        return;
      }

      setValidatingWord(false);

      const tiles = placedTiles.map(t => ({ letter: t.letter, points: t.points }));
      const result = await gameService.submitWord(id, profile.id, word, tiles, placedTiles);

      if (result.roundComplete) {
        const winnerName = result.isWinner ? 'You' : 'Your opponent';
        setRoundWinner(winnerName);
        setShowRoundResult(true);
      } else {
        Alert.alert('Submitted!', `You scored ${result.score} points! Waiting for opponent...`);
      }

      dispatch(clearSelectedTiles());
      setPlacedTiles([]);
      setSelectedCell(null);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit word');
    } finally {
      setLoading(false);
      setValidatingWord(false);
    }
  }

  async function handleRequestPause() {
    if (!id || typeof id !== 'string' || !profile?.id) return;

    try {
      await gameService.requestPause(id, profile.id);
      Alert.alert('Pause Requested', 'Waiting for opponent to accept...');
    } catch (error) {
      Alert.alert('Error', 'Failed to request pause');
    }
  }

  async function handleAcceptPause() {
    if (!id || typeof id !== 'string') return;

    try {
      await gameService.acceptPause(id);
    } catch (error) {
      Alert.alert('Error', 'Failed to accept pause');
    }
  }

  async function handleRejectPause() {
    if (!id || typeof id !== 'string') return;

    try {
      await gameService.rejectPause(id);
    } catch (error) {
      Alert.alert('Error', 'Failed to reject pause');
    }
  }

  async function handleResume() {
    if (!id || typeof id !== 'string') return;

    try {
      await gameService.resumeGame(id);
      setShowPauseModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to resume game');
    }
  }

  async function handleResign() {
    if (!id || typeof id !== 'string' || !profile?.id) return;

    Alert.alert(
      'Resign Game',
      'Are you sure you want to resign? You will lose this game.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Resign',
          style: 'destructive',
          onPress: async () => {
            try {
              await gameService.resignGame(id, profile.id);
              Alert.alert('Game Over', 'You have resigned from the game');
            } catch (error) {
              Alert.alert('Error', 'Failed to resign');
            }
          },
        },
      ]
    );
  }

  async function handleTimeUp() {
    if (!id || typeof id !== 'string') return;

    try {
      await gameService.handleTimeExpired(id);
    } catch (error) {
      console.error('Failed to handle time expiration:', error);
    }
  }

  function handleNextRound() {
    setShowRoundResult(false);
    setRoundWinner(null);
    loadGame();
  }

  if (!currentGame) {
    return (
      <View style={styles.loading}>
        <Text>Loading game...</Text>
      </View>
    );
  }

  const isPlayer1 = currentGame.player1_id === profile?.id;
  const hasSubmitted = isPlayer1 ? currentGame.player1_submitted : currentGame.player2_submitted;
  const opponentSubmitted = isPlayer1 ? currentGame.player2_submitted : currentGame.player1_submitted;
  const opponent = currentGame.player1_id === profile?.id ? 'Player 2' : 'Player 1';
  const myScore = currentGame.player1_id === profile?.id ? currentGame.player1_score : currentGame.player2_score;
  const opponentScore = currentGame.player1_id === profile?.id ? currentGame.player2_score : currentGame.player1_score;

  const calculatePlacedScore = () => {
    if (placedTiles.length === 0 || !currentGame) return 0;

    const { calculateTotalScore: calcScore } = require('../../src/utils/gameLogic');
    return calcScore(placedTiles, currentGame.board);
  };

  const totalScore = calculatePlacedScore();

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

        <View style={[styles.turnIndicator, hasSubmitted && styles.turnIndicatorOpponent]}>
          <Text style={styles.turnText}>
            {hasSubmitted ? 'Submitted ✓' : opponentSubmitted ? 'Opponent Submitted' : `Round ${currentGame.current_round}`}
          </Text>
        </View>

        <View style={styles.topRightButtons}>
          {currentGame.status === 'paused' ? (
            <TouchableOpacity onPress={handleResume} style={styles.pauseButton}>
              <Play size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleRequestPause} style={styles.pauseButton}>
              <Pause size={20} color="#fff" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleResign} style={styles.resignButton}>
            <Flag size={20} color="#fff" />
          </TouchableOpacity>
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
        <GameBoard
          board={currentGame.board as any}
          onCellPress={handleBoardCellPress}
          placedTiles={placedTiles}
          selectedCell={selectedCell}
          hasSelectedTiles={selectedTiles.length > 0}
        />
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.wordBuildingArea}>
          <View style={styles.selectedTilesContainer}>
            {selectedTiles.length === 0 && placedTiles.length === 0 ? (
              <View style={styles.instructionContainer}>
                <Text style={styles.instructionTitle}>💡 How to Play</Text>
                <Text style={styles.wordPlaceholder}>1. Tap tiles from your rack below</Text>
                <Text style={styles.wordPlaceholder}>2. Tap empty board cells to place them</Text>
              </View>
            ) : selectedTiles.length > 0 ? (
              <>
                <Text style={styles.instructionTextActive}>👆 Tap board cells to place:</Text>
                <View style={styles.selectedTilesRow}>
                  {selectedTiles.map((tile, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleRemoveTile(index)}
                      style={styles.selectedTile}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.selectedTileLetter}>{tile.letter}</Text>
                      <Text style={styles.selectedTilePoints}>{tile.points}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : (
              <View style={styles.currentWordContainer}>
                <Text style={styles.currentWordLabel}>Current Word:</Text>
                <Text style={styles.currentWord}>{placedTiles.map(t => t.letter).join('')}</Text>
                <Text style={styles.currentScore}>{totalScore} points</Text>
              </View>
            )}
          </View>
        </View>

        <TileRack tiles={myRack} onTilePress={handleTilePress} selectedTiles={selectedTiles} />

        <View style={styles.actionsBar}>
          <TouchableOpacity style={styles.actionButton}>
            <Menu size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleShuffle} style={styles.actionButton} disabled={hasSubmitted}>
            <Shuffle size={24} color={hasSubmitted ? "#888" : "#fff"} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={placedTiles.length < 2 || loading || hasSubmitted}
            style={[styles.submitButtonNew, (placedTiles.length < 2 || loading || hasSubmitted) && styles.submitButtonDisabled]}
          >
            <Text style={styles.submitButtonTextNew}>{hasSubmitted ? 'Submitted' : 'Submit'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleClear} style={styles.actionButton} disabled={hasSubmitted}>
            <X size={24} color={hasSubmitted ? "#888" : "#fff"} />
          </TouchableOpacity>

          <View style={styles.scoreCircle}>
            <Text style={styles.scoreCircleText}>{totalScore}</Text>
          </View>
        </View>
      </View>

      {showRoundResult && currentGame?.round_winner_id && (
        <RoundResultModal
          visible={showRoundResult}
          winnerName={currentGame.round_winner_id === profile?.id ? 'You' : opponent}
          winnerWord={currentGame.round_winner_word || ''}
          winnerScore={currentGame.round_winner_score || 0}
          isWinner={currentGame.round_winner_id === profile?.id}
          onNext={() => {
            setShowRoundResult(false);
            setRoundWinner(null);
          }}
        />
      )}

      <GameSummaryModal
        visible={showSummary}
        summary={gameSummary}
        currentPlayerId={profile?.id || ''}
        player1Name={isPlayer1 ? profile?.display_name || 'You' : opponent}
        player2Name={isPlayer1 ? opponent : profile?.display_name || 'You'}
        onClose={() => {
          setShowSummary(false);
          router.back();
        }}
        onPlayAgain={() => {
          setShowSummary(false);
          router.replace('/(tabs)');
        }}
      />

      {validatingWord && (
        <View style={styles.validatingOverlay}>
          <View style={styles.validatingModal}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.validatingText}>Validating word...</Text>
          </View>
        </View>
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
  turnIndicatorOpponent: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    opacity: 0.6,
  },
  turnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  topRightButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
  },
  pauseButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resignButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(220,53,69,0.8)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
    minHeight: 70,
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  instructionContainer: {
    alignItems: 'center',
    gap: 4,
  },
  instructionTitle: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  wordPlaceholder: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  instructionTextActive: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  selectedTilesRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  currentWordContainer: {
    alignItems: 'center',
    gap: 4,
  },
  currentWordLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  currentWord: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 2,
  },
  currentScore: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '700',
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
  validatingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  validatingModal: {
    backgroundColor: '#fff',
    padding: spacing.xl,
    borderRadius: 16,
    alignItems: 'center',
    gap: spacing.md,
  },
  validatingText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
