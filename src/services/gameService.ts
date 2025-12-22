import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  or,
  orderBy,
  query,
  setDoc,
  Unsubscribe,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Game, GameSummary, TimerDuration } from '../types/game';
import {
  calculateFinalScores,
  drawTiles,
  flattenBoard,
  generateTileBag,
  initializeBoard,
  unflattenBoard,
} from '../utils/gameLogic';

export const gameService = {
  async createGame(playerId: string, isPrivate: boolean, timerDuration: TimerDuration = 300): Promise<string> {
    const gameRef = doc(collection(db, 'games'));
    const player1Board = initializeBoard();
    const player2Board = initializeBoard();
    const sharedTileBag = generateTileBag();

    const { tiles: player1Rack } = drawTiles(sharedTileBag, 7);
    const { tiles: player2Rack } = drawTiles(sharedTileBag, 7);
    const joinCode = isPrivate ? generateJoinCode() : null;

    console.log('Creating dual-board game:');
    console.log('Player 1 Rack:', player1Rack, 'Length:', player1Rack.length);
    console.log('Player 2 Rack:', player2Rack, 'Length:', player2Rack.length);
    console.log('Shared Tile Bag:', sharedTileBag.length);

    const gameData: any = {
      id: gameRef.id,
      player1_id: playerId,
      player2_id: null,
      status: 'waiting',
      player1_board: flattenBoard(player1Board),
      player2_board: flattenBoard(player2Board),
      shared_tile_bag: sharedTileBag,
      player1_rack: player1Rack,
      player2_rack: player2Rack,
      player1_score: 0,
      player2_score: 0,
      player1_submitted: false,
      player2_submitted: false,
      game_duration_seconds: timerDuration,
      is_private: isPrivate,
      dictionary: 'en',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (joinCode) {
      gameData.join_code = joinCode;
    }

    console.log('Saving game data to Firebase:', {
      ...gameData,
      player1_board: '[BOARD]',
      player2_board: '[BOARD]',
      shared_tile_bag: `[${sharedTileBag.length} tiles]`,
    });

    await setDoc(gameRef, gameData);
    console.log('Game created successfully with ID:', gameRef.id);
    return gameRef.id;
  },

  async joinGame(gameId: string, playerId: string): Promise<void> {
    const gameRef = doc(db, 'games', gameId);
    const gameSnap = await getDoc(gameRef);

    if (!gameSnap.exists()) {
      throw new Error('Game not found');
    }

    const gameData = gameSnap.data();
    const gameDuration = gameData.game_duration_seconds || 300;
    const timerEnd = new Date(Date.now() + gameDuration * 1000).toISOString();

    await updateDoc(gameRef, {
      player2_id: playerId,
      status: 'playing',
      timer_ends_at: timerEnd,
      game_started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  },

  async findWaitingGame(playerId: string): Promise<Game | null> {
    const gamesRef = collection(db, 'games');
    const q = query(
      gamesRef,
      where('status', '==', 'waiting'),
      where('is_private', '==', false),
      where('player2_id', '==', null),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const gameDoc = snapshot.docs[0];
    const data = gameDoc.data();
    const game = {
      id: gameDoc.id,
      ...data,
      board: unflattenBoard(data.board),
    } as Game;

    if (game.player1_id === playerId) {
      return null;
    }

    return game;
  },

  async getGame(gameId: string): Promise<Game | null> {
    const gameRef = doc(db, 'games', gameId);
    const gameSnap = await getDoc(gameRef);

    if (!gameSnap.exists()) {
      return null;
    }

    const data = gameSnap.data();
    return {
      id: gameSnap.id,
      ...data,
      player1_board: unflattenBoard(data.player1_board || data.board),
      player2_board: unflattenBoard(data.player2_board || data.board),
    } as Game;
  },

  async getPlayerGames(playerId: string): Promise<Game[]> {
    if (!playerId) return [];

    try {
      const gamesRef = collection(db, 'games');
      const q = query(
        gamesRef,
        or(
          where('player1_id', '==', playerId),
          where('player2_id', '==', playerId)
        ),
        orderBy('created_at', 'desc'),
        limit(10)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          player1_board: unflattenBoard(data.player1_board || data.board),
          player2_board: unflattenBoard(data.player2_board || data.board),
        } as Game;
      });
    } catch (error) {
      console.error('Error getting player games:', error);
      return [];
    }
  },

  subscribeToGame(gameId: string, callback: (game: Game) => void): Unsubscribe {
    const gameRef = doc(db, 'games', gameId);

    return onSnapshot(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();

        console.log('📥 Game data received from Firebase:');
        console.log('- Status:', data.status);
        console.log('- Player1 Rack:', data.player1_rack);
        console.log('- Player2 Rack:', data.player2_rack);
        console.log('- Player1 Submitted:', data.player1_submitted);
        console.log('- Player2 Submitted:', data.player2_submitted);

        const game = {
          id: snapshot.id,
          ...data,
          player1_board: unflattenBoard(data.player1_board || data.board),
          player2_board: unflattenBoard(data.player2_board || data.board),
        } as Game;
        callback(game);
      }
    });
  },

  async submitMove(
    gameId: string,
    playerId: string,
    word: string,
    score: number,
    placements: { row: number; col: number; letter: string; points: number }[]
  ): Promise<{ success: boolean }> {
    const gameRef = doc(db, 'games', gameId);
    const gameSnap = await getDoc(gameRef);

    if (!gameSnap.exists()) {
      throw new Error('Game not found');
    }

    const data = gameSnap.data();
    const game = {
      id: gameSnap.id,
      ...data,
      player1_board: unflattenBoard(data.player1_board || data.board),
      player2_board: unflattenBoard(data.player2_board || data.board),
    } as Game;

    const isPlayer1 = game.player1_id === playerId;
    const currentBoard = isPlayer1 ? game.player1_board : game.player2_board;
    const boardKey = isPlayer1 ? 'player1_board' : 'player2_board';

    let newBoard = currentBoard.map(row => row.map(cell => ({ ...cell })));

    for (const tile of placements) {
      newBoard[tile.row][tile.col] = {
        ...newBoard[tile.row][tile.col],
        letter: tile.letter,
        locked: true,
      };
    }

    const tilesUsed = placements.length;
    const currentRack = isPlayer1 ? game.player1_rack : game.player2_rack;
    const usedTiles = placements.map(p => ({ letter: p.letter, points: p.points }));

    const newRack = currentRack.filter(tile => {
      const usedIndex = usedTiles.findIndex(used => used.letter === tile.letter && used.points === tile.points);
      if (usedIndex !== -1) {
        usedTiles.splice(usedIndex, 1);
        return false;
      }
      return true;
    });

    const { tiles: drawnTiles } = drawTiles(game.shared_tile_bag, Math.min(tilesUsed, game.shared_tile_bag.length));
    const updatedRack = [...newRack, ...drawnTiles];

    const newScore = (isPlayer1 ? game.player1_score : game.player2_score) + score;

    const updateData: any = {
      [boardKey]: flattenBoard(newBoard),
      updated_at: new Date().toISOString(),
    };

    if (isPlayer1) {
      updateData.player1_rack = updatedRack;
      updateData.player1_score = newScore;

      if (!game.player1_highest_score || score > game.player1_highest_score) {
        updateData.player1_highest_word = word;
        updateData.player1_highest_score = score;
      }
    } else {
      updateData.player2_rack = updatedRack;
      updateData.player2_score = newScore;

      if (!game.player2_highest_score || score > game.player2_highest_score) {
        updateData.player2_highest_word = word;
        updateData.player2_highest_score = score;
      }
    }

    await updateDoc(gameRef, updateData);

    return { success: true };
  },

  async submitGame(gameId: string, playerId: string): Promise<void> {
    const gameRef = doc(db, 'games', gameId);
    const gameSnap = await getDoc(gameRef);

    if (!gameSnap.exists()) {
      throw new Error('Game not found');
    }

    const data = gameSnap.data();
    const game = {
      id: gameSnap.id,
      ...data,
      player1_board: unflattenBoard(data.player1_board || data.board),
      player2_board: unflattenBoard(data.player2_board || data.board),
    } as Game;

    const isPlayer1 = game.player1_id === playerId;

    const updateData: any = {
      [isPlayer1 ? 'player1_submitted' : 'player2_submitted']: true,
      [isPlayer1 ? 'player1_submitted_at' : 'player2_submitted_at']: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await updateDoc(gameRef, updateData);

    if (
      (isPlayer1 && game.player2_submitted) ||
      (!isPlayer1 && game.player1_submitted) ||
      (updateData.player1_submitted && updateData.player2_submitted)
    ) {
      await this.endGame(gameId);
    }
  },

  async endGame(gameId: string): Promise<void> {
    const game = await this.getGame(gameId);
    if (!game) return;

    const gameRef = doc(db, 'games', gameId);

    const winnerId = game.player1_score > game.player2_score ? game.player1_id : game.player2_id;

    const endData = {
      status: 'finished',
      winner_id: winnerId,
      game_ended_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await updateDoc(gameRef, endData);
  },

  async handleTimeExpired(gameId: string): Promise<void> {
    const game = await this.getGame(gameId);
    if (!game) return;

    if (game.status !== 'playing') return;

    await this.endGame(gameId);
  },

  async requestPause(gameId: string, playerId: string): Promise<void> {
    const gameRef = doc(db, 'games', gameId);
    await updateDoc(gameRef, {
      pause_requested_by: playerId,
      pause_status: 'requested',
      updated_at: new Date().toISOString(),
    });
  },

  async acceptPause(gameId: string): Promise<void> {
    const gameRef = doc(db, 'games', gameId);
    const gameSnap = await getDoc(gameRef);

    if (!gameSnap.exists()) {
      throw new Error('Game not found');
    }

    const game = gameSnap.data() as Game;
    const now = Date.now();
    const timerEnd = game.timer_ends_at ? new Date(game.timer_ends_at).getTime() : now;
    const remainingTime = Math.max(0, timerEnd - now);

    await updateDoc(gameRef, {
      status: 'paused',
      pause_status: 'accepted',
      paused_at: new Date().toISOString(),
      remaining_time_seconds: Math.floor(remainingTime / 1000),
      updated_at: new Date().toISOString(),
    });
  },

  async rejectPause(gameId: string): Promise<void> {
    const gameRef = doc(db, 'games', gameId);
    await updateDoc(gameRef, {
      pause_requested_by: null,
      pause_status: 'none',
      updated_at: new Date().toISOString(),
    });
  },

  async resumeGame(gameId: string): Promise<void> {
    const gameRef = doc(db, 'games', gameId);
    const gameSnap = await getDoc(gameRef);

    if (!gameSnap.exists()) {
      throw new Error('Game not found');
    }

    const game = gameSnap.data() as Game;

    // Use saved remaining time, or fallback to game duration
    const remainingSeconds = game.remaining_time_seconds || game.game_duration_seconds || 300;
    const newTimerEnd = new Date(Date.now() + remainingSeconds * 1000).toISOString();

    await updateDoc(gameRef, {
      status: 'playing',
      pause_status: 'none',
      pause_requested_by: null,
      timer_ends_at: newTimerEnd,
      paused_at: null,
      remaining_time_seconds: null,
      updated_at: new Date().toISOString(),
    });
  },

  async resignGame(gameId: string, playerId: string): Promise<void> {
    const gameRef = doc(db, 'games', gameId);
    const gameSnap = await getDoc(gameRef);

    if (!gameSnap.exists()) {
      throw new Error('Game not found');
    }

    const game = gameSnap.data() as Game;

    if (game.status === 'finished') {
      console.log('Game already finished, skipping resign');
      return;
    }

    const winnerId = game.player1_id === playerId ? game.player2_id : game.player1_id;

    await updateDoc(gameRef, {
      status: 'finished',
      winner_id: winnerId,
      resigned_player_id: playerId,
      game_ended_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  },

  async getGameSummary(gameId: string): Promise<GameSummary | null> {
    const game = await this.getGame(gameId);

    if (!game || game.status !== 'finished') {
      return null;
    }

    const startTime = game.game_started_at || game.created_at;
    const endTime = game.game_ended_at || game.updated_at;
    const durationMinutes = Math.round(
      (new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000
    );

    const player1RemainingTiles = game.player1_remaining_tiles || [];
    const player2RemainingTiles = game.player2_remaining_tiles || [];

    const finalScores = calculateFinalScores(
      game.player1_score,
      game.player2_score,
      player1RemainingTiles,
      player2RemainingTiles,
      game.winner_id,
      game.player1_id
    );

    return {
      game_id: game.id,
      winner_id: game.winner_id || game.player1_id,
      player1_id: game.player1_id,
      player2_id: game.player2_id || '',
      player1_score: game.player1_score,
      player2_score: game.player2_score,
      player1_final_score: finalScores.player1Final,
      player2_final_score: finalScores.player2Final,
      player1_remaining_tiles_penalty: finalScores.player1Penalty,
      player2_remaining_tiles_penalty: finalScores.player2Penalty,
      player1_highest_word: game.player1_highest_word || '',
      player1_highest_score: game.player1_highest_score || 0,
      player2_highest_word: game.player2_highest_word || '',
      player2_highest_score: game.player2_highest_score || 0,
      player1_moves_count: game.player1_moves_count,
      player2_moves_count: game.player2_moves_count,
      total_moves: game.player1_moves_count + game.player2_moves_count,
      duration_minutes: durationMinutes,
      resigned: !!game.resigned_player_id,
      resigned_player_id: game.resigned_player_id,
    };
  },

  async cancelWaitingGame(gameId: string): Promise<void> {
    const gameRef = doc(db, 'games', gameId);
    const gameSnap = await getDoc(gameRef);

    if (!gameSnap.exists()) {
      return;
    }

    const game = gameSnap.data() as Game;

    if (game.status === 'cancelled') {
      console.log('Game already cancelled');
      return;
    }

    if (game.status === 'playing') {
      console.log('Game is already playing, cannot cancel');
      return;
    }

    await updateDoc(gameRef, {
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    });
  },
};

function generateJoinCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
