import { router, useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { ChevronLeft, Flag, Package, Pause, Play, Shuffle, X } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { GameBoard } from '../../src/components/GameBoard';
import { GameEndModal } from '../../src/components/GameEndModal';
import { GameTimer } from '../../src/components/GameTimer';
import { TileBagViewer } from '../../src/components/TileBagViewer';
import { TileRack } from '../../src/components/TileRack';
import { db } from '../../src/lib/firebase';
import { gameService } from '../../src/services/gameService';
import { presenceService } from '../../src/services/presenceService';
import { RootState } from '../../src/store';
import { addSelectedTile, clearSelectedTiles, setCurrentGame, setMyRack, setSelectedTiles } from '../../src/store/slices/gameSlice';
import { colors, spacing } from '../../src/theme/colors';
import { Game, GameSummary, Tile } from '../../src/types/game';
import { validateWordWithDictionary } from '../../src/utils/dictionaryApi';
import { canPlaceTile, getAllFormedWords, isBoardEmpty, isValidWord, wordConnectsToBoard, wordCoversCenter } from '../../src/utils/gameLogic';

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
  const [opponentProfile, setOpponentProfile] = useState<{ displayName: string; id: string } | null>(null);
  const [pauseRequestShown, setPauseRequestShown] = useState(false);
  const [showTileBag, setShowTileBag] = useState(false);
  const [boardLayout, setBoardLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  const [focusCell, setFocusCell] = useState<{ row: number; col: number } | null>(null);

  const isPlayer1 = currentGame?.player1_id === profile?.id;
  const currentBoard = currentGame ? ((isPlayer1 ? currentGame.player1_board : currentGame.player2_board) || currentGame.board) : [];

  const formedWords = useMemo(() => {
    if (!currentGame || currentBoard.length === 0) return [];
    return getAllFormedWords(currentBoard, placedTiles);
  }, [currentGame, currentBoard, placedTiles]);

  useEffect(() => {
    if (!id || typeof id !== 'string' || !profile?.id) return;

    presenceService.setInGame(profile.id, id);

    loadGame();

    const unsubscribe = gameService.subscribeToGame(id, (game) => {
      if (!game) return;

      if (game.player1_id !== profile.id && game.player2_id !== profile.id) {
        console.log('User is not part of this game, ignoring updates');
        return;
      }

      dispatch(setCurrentGame(game));

      if (game.player2_id && !opponentProfile) {
        loadOpponentProfile(game);
      }

      if (game.status === 'waiting' && game.player2_id) {
        startGame(game);
      }

      if (game.status === 'finished' && !showSummary) {
        loadGameSummary();
        if (profile?.id && profile?.display_name) {
          presenceService.setUserOnline(profile.id, profile.display_name);
        }
      }

      if (game.pause_status === 'requested' && game.pause_requested_by && game.pause_requested_by !== profile?.id && !pauseRequestShown) {
        setPauseRequestShown(true);
        showPauseRequest();
      }

      if (game.pause_status === 'none') {
        setPauseRequestShown(false);
      }
    });

    return () => {
      unsubscribe();
      if (profile?.id && profile?.display_name) {
        presenceService.setUserOnline(profile.id, profile.display_name);
      }
    };
  }, [id, opponentProfile, profile?.id]);

  async function loadOpponentProfile(game: Game) {
    if (!profile?.id) return;

    const opponentId = game.player1_id === profile.id ? game.player2_id : game.player1_id;

    if (!opponentId) return;

    try {
      const opponentDoc = await getDoc(doc(db, 'profiles', opponentId));
      if (opponentDoc.exists()) {
        const data = opponentDoc.data();
        setOpponentProfile({
          displayName: data.displayName || 'Player',
          id: opponentId,
        });
      }
    } catch (error) {
      console.error('Failed to load opponent profile:', error);
    }
  }

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

    const isPlayer1 = currentGame.player1_id === profile.id;
    const myRackData = isPlayer1 ? currentGame.player1_rack : currentGame.player2_rack;

    console.log('=== RACK DEBUG ===');
    console.log('Game ID:', currentGame.id);
    console.log('Status:', currentGame.status);
    console.log('Is Player 1:', isPlayer1);
    console.log('Player 1 Rack:', currentGame.player1_rack);
    console.log('Player 2 Rack:', currentGame.player2_rack);
    console.log('My Rack Data:', myRackData);
    console.log('My Rack Length:', myRackData?.length);
    console.log('Current Turn Player:', currentGame.current_turn_player_id);
    console.log('Is My Turn:', currentGame.current_turn_player_id === profile.id);
    console.log('==================');

    if (myRackData && Array.isArray(myRackData) && myRackData.length > 0) {
      console.log('✅ Setting rack with', myRackData.length, 'tiles');
      dispatch(setMyRack(myRackData as Tile[]));
    } else {
      console.error('❌ No valid rack found!');
      console.error('myRackData:', myRackData);
      console.error('Is array?', Array.isArray(myRackData));
    }
  }, [currentGame?.player1_rack, currentGame?.player2_rack, profile?.id, currentGame?.status]);

  useEffect(() => {
    if (!currentGame?.timer_ends_at || !profile?.id || currentGame.status !== 'playing') return;

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
  }, [currentGame?.timer_ends_at, currentGame?.status, profile?.id]);

  async function loadGame() {
    if (!id || typeof id !== 'string' || !profile?.id) return;

    console.log('[GameScreen] Loading game:', id);

    try {
      const game = await gameService.getGame(id);

      if (!game) {
        console.error('[GameScreen] Game not found');
        Alert.alert('Error', 'Game not found', [{ text: 'OK', onPress: () => router.back() }]);
        return;
      }

      console.log('[GameScreen] Loaded game:', {
        id: game.id,
        status: game.status,
        player1_id: game.player1_id,
        player2_id: game.player2_id,
      });

      if (game.player1_id !== profile.id && game.player2_id !== profile.id) {
        console.error('[GameScreen] User is not part of this game');
        Alert.alert('Error', 'You are not part of this game', [{ text: 'OK', onPress: () => router.back() }]);
        return;
      }

      if (game.status === 'waiting' && !game.player2_id) {
        console.error('[GameScreen] Game is still waiting for opponent');
        Alert.alert('Waiting', 'Waiting for opponent to join...', [{ text: 'OK', onPress: () => router.back() }]);
        return;
      }

      if (game.status === 'cancelled') {
        console.error('[GameScreen] Game is cancelled');
        Alert.alert('Game Cancelled', 'This game has been cancelled', [{ text: 'OK', onPress: () => router.back() }]);
        return;
      }

      dispatch(setCurrentGame(game));

      if (game.status === 'waiting' && game.player2_id) {
        startGame(game);
      }

      if (game.status === 'finished') {
        console.log('[GameScreen] Game is finished, loading summary');
      }
    } catch (error) {
      console.error('[GameScreen] Failed to load game:', error);
      Alert.alert('Error', 'Failed to load game', [{ text: 'OK', onPress: () => router.back() }]);
    }
  }

  async function startGame(game: Game) {
  }

  function handleTilePress(tile: Tile, index: number) {
    if (!currentGame) return;
    dispatch(addSelectedTile(tile));
  }

  function handleRemoveTile(index: number) {
    if (!currentGame) return;
    const newSelected = [...selectedTiles];
    newSelected.splice(index, 1);
    dispatch(setSelectedTiles(newSelected));
  }

  async function handleShuffle() {
    if (!currentGame || !profile?.id || !id || typeof id !== 'string') return;

    if (placedTiles.length > 0 || selectedTiles.length > 0) {
      Alert.alert('Clear Board First', 'You must clear your placed and selected tiles before exchanging');
      return;
    }

    if (currentGame.shared_tile_bag.length < 7) {
      Alert.alert('Not Enough Tiles', 'There are not enough tiles left in the bag to exchange all 7 tiles');
      return;
    }

    setLoading(true);
    try {
      await gameService.exchangeTiles(id, profile.id);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to exchange tiles');
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    if (!currentGame) return;
    dispatch(clearSelectedTiles());
    setPlacedTiles([]);
    setSelectedCell(null);
  }

  function handleTileDrag(tile: Tile, index: number, x: number, y: number) {
    if (!currentGame || !boardLayout || !profile?.id) return;

    const relativeX = x - boardLayout.x;
    const relativeY = y - boardLayout.y;

    if (relativeX < 0 || relativeY < 0 || relativeX > boardLayout.width || relativeY > boardLayout.height) {
      setHoveredCell(null);
      return;
    }

    const boardSize = Math.min(boardLayout.width, boardLayout.height);
    const CELL_SIZE = boardSize / 15;
    const padding = 4;

    const col = Math.floor((relativeX - padding) / CELL_SIZE);
    const row = Math.floor((relativeY - padding) / CELL_SIZE);

    if (row >= 0 && row < 15 && col >= 0 && col < 15) {
      setHoveredCell({ row, col });
    } else {
      setHoveredCell(null);
    }
  }

  function handleTileDragEnd(tile: Tile, index: number, x: number, y: number) {
    setHoveredCell(null);

    if (!currentGame || !boardLayout || !profile?.id) return;

    const relativeX = x - boardLayout.x;
    const relativeY = y - boardLayout.y;

    if (relativeX < 0 || relativeY < 0 || relativeX > boardLayout.width || relativeY > boardLayout.height) {
      return;
    }

    const boardSize = Math.min(boardLayout.width, boardLayout.height);
    const CELL_SIZE = boardSize / 15;
    const padding = 4;

    const col = Math.floor((relativeX - padding) / CELL_SIZE);
    const row = Math.floor((relativeY - padding) / CELL_SIZE);

    if (row >= 0 && row < 15 && col >= 0 && col < 15) {
      const isPlayer1 = currentGame.player1_id === profile.id;
      const board = (isPlayer1 ? currentGame.player1_board : currentGame.player2_board) || currentGame.board;
      const cell = board[row][col];

      const existingTile = placedTiles.find(t => t.row === row && t.col === col);
      if (!cell.locked && !existingTile) {
        const canPlace = canPlaceTile(tile, placedTiles, board);

        if (!canPlace) {
          return;
        }

        setPlacedTiles([...placedTiles, { row, col, letter: tile.letter, points: tile.points }]);
        setFocusCell({ row, col });
        setTimeout(() => setFocusCell(null), 700);
      }
    }
  }

  function handleBoardCellPress(row: number, col: number) {
    if (!currentGame) return;
    if (selectedTiles.length === 0) {
      const existingTile = placedTiles.find(t => t.row === row && t.col === col);
      if (existingTile) {
        setPlacedTiles(placedTiles.filter(t => t.row !== row || t.col !== col));
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
    setFocusCell({ row, col });
    setTimeout(() => setFocusCell(null), 700);

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
    const myBoard = (isPlayer1 ? currentGame.player1_board : currentGame.player2_board) || currentGame.board;

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

    const boardIsEmpty = isBoardEmpty(myBoard);

    if (boardIsEmpty) {
      if (!wordCoversCenter(placedTiles)) {
        Alert.alert('Invalid First Move', 'First word must cover the center square (★)');
        return;
      }
    } else {
      if (!wordConnectsToBoard(placedTiles, myBoard)) {
        Alert.alert('Invalid Placement', 'Word must connect to existing tiles on the board');
        return;
      }
    }

    let word = '';
    if (isHorizontal) {
      const row = placedTiles[0].row;
      const minCol = Math.min(...placedTiles.map(t => t.col));
      const maxCol = Math.max(...placedTiles.map(t => t.col));

      for (let col = minCol; col <= maxCol; col++) {
        const placedTile = placedTiles.find(t => t.col === col);
        if (placedTile) {
          word += placedTile.letter;
        } else if (myBoard[row][col].letter) {
          word += myBoard[row][col].letter;
        } else {
          Alert.alert('Invalid Placement', 'Tiles must be placed consecutively');
          return;
        }
      }
    } else {
      const col = placedTiles[0].col;
      const minRow = Math.min(...placedTiles.map(t => t.row));
      const maxRow = Math.max(...placedTiles.map(t => t.row));

      for (let row = minRow; row <= maxRow; row++) {
        const placedTile = placedTiles.find(t => t.row === row);
        if (placedTile) {
          word += placedTile.letter;
        } else if (myBoard[row][col].letter) {
          word += myBoard[row][col].letter;
        } else {
          Alert.alert('Invalid Placement', 'Tiles must be placed consecutively');
          return;
        }
      }
    }

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

      const { calculateTotalScore } = await import('../../src/utils/gameLogic');
      const score = calculateTotalScore(placedTiles, myBoard);

      await gameService.submitMove(id, profile.id, word, score, placedTiles);

      Alert.alert('Success!', `You scored ${score} points!`);

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

  if (!currentGame) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff', marginTop: 16 }}>Loading game...</Text>
      </View>
    );
  }

  const myRackFromGame = isPlayer1 ? currentGame.player1_rack : currentGame.player2_rack;

  // Check if this is an old game with the old schema
  const hasOldSchema = !currentGame.player1_rack && !currentGame.player2_rack && (currentGame as any).shared_rack;

  if (hasOldSchema) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff', marginTop: 16, textAlign: 'center', paddingHorizontal: 20 }}>
          This game uses an old format.{'\n'}Please start a new game.
        </Text>
        <TouchableOpacity
          style={{ marginTop: 20, backgroundColor: '#43A047', padding: 16, borderRadius: 8 }}
          onPress={() => router.back()}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // If game is still waiting for player 2, show different message
  if (currentGame.status === 'waiting' && !currentGame.player2_id) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff', marginTop: 16 }}>Waiting for opponent...</Text>
      </View>
    );
  }

  // If game is playing but no racks yet, wait
  if (currentGame.status === 'playing' && (!myRackFromGame || !Array.isArray(myRackFromGame) || myRackFromGame.length === 0)) {
    console.error('Waiting for racks to load...');
    console.error('Player1 rack exists?', !!currentGame.player1_rack);
    console.error('Player2 rack exists?', !!currentGame.player2_rack);
    console.error('My rack exists?', !!myRackFromGame);
    console.error('Full game object:', JSON.stringify(currentGame, null, 2));
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff', marginTop: 16 }}>Loading tiles...</Text>
        <TouchableOpacity
          style={{ marginTop: 20, backgroundColor: '#F44336', padding: 12, borderRadius: 8 }}
          onPress={() => {
            Alert.alert(
              'Debug Info',
              `Status: ${currentGame.status}\n` +
              `Player1 Rack: ${currentGame.player1_rack ? 'exists' : 'missing'}\n` +
              `Player2 Rack: ${currentGame.player2_rack ? 'exists' : 'missing'}\n` +
              `Is Player1: ${isPlayer1}\n` +
              `My Rack: ${myRackFromGame ? 'exists' : 'missing'}`
            );
          }}
        >
          <Text style={{ color: '#fff', fontSize: 14 }}>Show Debug Info</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const opponent = opponentProfile?.displayName || 'Opponent';
  const myScore = currentGame.player1_id === profile?.id ? currentGame.player1_score : currentGame.player2_score;
  const opponentScore = currentGame.player1_id === profile?.id ? currentGame.player2_score : currentGame.player1_score;

  const getCurrentWord = () => {
    if (placedTiles.length === 0 || !currentGame) return '';

    const myBoard = (isPlayer1 ? currentGame.player1_board : currentGame.player2_board) || currentGame.board;

    const sortedTiles = [...placedTiles].sort((a, b) => {
      if (a.row === b.row) return a.col - b.col;
      return a.row - b.row;
    });

    const isHorizontal = placedTiles.every(t => t.row === placedTiles[0].row);

    let word = '';
    if (isHorizontal) {
      const row = sortedTiles[0].row;
      const minCol = Math.min(...sortedTiles.map(t => t.col));
      const maxCol = Math.max(...sortedTiles.map(t => t.col));

      for (let col = minCol; col <= maxCol; col++) {
        const placedTile = sortedTiles.find(t => t.col === col);
        if (placedTile) {
          word += placedTile.letter;
        } else if (myBoard[row] && myBoard[row][col] && myBoard[row][col].letter) {
          word += myBoard[row][col].letter;
        }
      }
    } else {
      const col = sortedTiles[0].col;
      const minRow = Math.min(...sortedTiles.map(t => t.row));
      const maxRow = Math.max(...sortedTiles.map(t => t.row));

      for (let row = minRow; row <= maxRow; row++) {
        const placedTile = sortedTiles.find(t => t.row === row);
        if (placedTile) {
          word += placedTile.letter;
        } else if (myBoard[row] && myBoard[row][col] && myBoard[row][col].letter) {
          word += myBoard[row][col].letter;
        }
      }
    }

    return word;
  };

  const calculatePlacedScore = () => {
    if (placedTiles.length === 0 || !currentGame) return 0;

    const { calculateTotalScore: calcScore } = require('../../src/utils/gameLogic');
    const myBoard = (isPlayer1 ? currentGame.player1_board : currentGame.player2_board) || currentGame.board;
    return calcScore(placedTiles, myBoard);
  };

  const currentWord = getCurrentWord();
  const totalScore = calculatePlacedScore();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  console.log('Rendering - myRack:', myRack, 'length:', myRack.length);
  console.log('Rendering - currentGame status:', currentGame?.status);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color="#fff" />
        </TouchableOpacity>

        <View style={styles.languageFlag}>
          <Text style={styles.flagText}>🇬🇧</Text>
        </View>

        <View style={[styles.turnIndicator, styles.turnIndicatorMyTurn]}>
          <Text style={styles.turnText}>
            {currentGame.status === 'playing' ? '⚡ Both Playing' : 'Game'}
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
          {currentGame.status === 'playing' && currentGame.timer_ends_at && (
            <GameTimer seconds={timeRemaining} totalSeconds={currentGame.game_duration_seconds || 300} />
          )}
          {currentGame.status === 'waiting' && (
            <Text style={styles.waitingText}>Waiting...</Text>
          )}
        </View>

        <View style={[styles.playerCard, styles.opponentCard]}>
          <View style={styles.playerCardInner}>
            <View style={[styles.playerAvatar, styles.opponentAvatar]}>
              <Text style={styles.playerAvatarText}>
                {opponent?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
            <Text style={styles.playerLabel}>{opponent}</Text>
            <Text style={styles.playerScore}>{opponentScore}</Text>
          </View>
        </View>
      </View>


      <View style={styles.boardWrapper}>
        <GameBoard
          board={(isPlayer1 ? currentGame.player1_board : currentGame.player2_board) || currentGame.board}
          onCellPress={handleBoardCellPress}
          placedTiles={placedTiles}
          selectedCell={selectedCell}
          hasSelectedTiles={selectedTiles.length > 0}
          onMeasureBoard={setBoardLayout}
          hoveredCell={hoveredCell}
          formedWords={formedWords}
          focusCell={focusCell}
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
                <Text style={styles.currentWord}>{currentWord}</Text>
                <Text style={styles.currentScore}>{totalScore} points</Text>
              </View>
            )}
          </View>
        </View>

        <TileRack
          tiles={myRack.length > 0 ? myRack : (currentGame?.shared_rack as Tile[] || [])}
          onTilePress={handleTilePress}
          onTileDrag={handleTileDrag}
          onTileDragEnd={handleTileDragEnd}
          selectedTiles={selectedTiles}
          placedTiles={placedTiles}
          board={(isPlayer1 ? currentGame.player1_board : currentGame.player2_board) || currentGame.board}
        />

        <View style={styles.actionsBar}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowTileBag(true)}
          >
            <Package size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleShuffle} style={styles.actionButton}>
            <Shuffle size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={placedTiles.length < 2 || loading}
            style={[styles.submitButtonNew, (placedTiles.length < 2 || loading) && styles.submitButtonDisabled]}
          >
            <Text style={styles.submitButtonTextNew}>Play Word</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleClear} style={styles.actionButton}>
            <X size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.scoreCircle}>
            <Text style={styles.scoreCircleText}>{totalScore}</Text>
          </View>
        </View>
      </View>
      </ScrollView>

      <GameEndModal
        visible={showSummary}
        summary={gameSummary}
        currentPlayerId={profile?.id || ''}
        onClose={() => {
          setShowSummary(false);
          router.back();
        }}
        onNewGame={() => {
          setShowSummary(false);
          router.replace('/(tabs)');
        }}
      />

      <TileBagViewer
        visible={showTileBag}
        onClose={() => setShowTileBag(false)}
        tileBag={currentGame?.shared_tile_bag || []}
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
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
  waitingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    paddingHorizontal: spacing.xs,
    marginVertical: spacing.xs,
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
    backgroundColor: '#FAE5C8',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#10B981',
    borderBottomWidth: 5,
    borderBottomColor: '#059669',
    position: 'relative',
  },
  selectedTileLetter: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
  selectedTilePoints: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A1A1A',
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
  passButton: {
    backgroundColor: '#FF9800',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  passButtonDisabled: {
    backgroundColor: '#9E9E9E',
    opacity: 0.6,
  },
  passButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  turnIndicatorMyTurn: {
    backgroundColor: '#43A047',
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
