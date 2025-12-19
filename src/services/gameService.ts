import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  or,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Game, Tile, GameSummary, TimerDuration } from '../types/game';
import {
  initializeBoard,
  generateTileBag,
  drawTiles,
  flattenBoard,
  unflattenBoard,
  calculateFinalScores,
} from '../utils/gameLogic';

export const gameService = {
  async createGame(playerId: string, isPrivate: boolean, timerDuration: TimerDuration = 180): Promise<string> {
    const gameRef = doc(collection(db, 'games'));
    const board = initializeBoard();
    const tileBag = generateTileBag();

    const { tiles: player1Rack, remainingBag: bagAfterPlayer1 } = drawTiles(tileBag, 7);
    const { tiles: player2Rack, remainingBag } = drawTiles(bagAfterPlayer1, 7);
    const joinCode = isPrivate ? generateJoinCode() : null;

    console.log('Creating game with racks:');
    console.log('Player 1 Rack:', player1Rack, 'Length:', player1Rack.length);
    console.log('Player 2 Rack:', player2Rack, 'Length:', player2Rack.length);
    console.log('Tile Bag Remaining:', remainingBag.length);

    const gameData: any = {
      id: gameRef.id,
      player1_id: playerId,
      player2_id: null,
      status: 'waiting',
      board: flattenBoard(board),
      tile_bag: remainingBag,
      turn_duration_seconds: timerDuration,
      player1_rack: player1Rack,
      player2_rack: player2Rack,
      player1_score: 0,
      player2_score: 0,
      player1_moves_count: 0,
      player2_moves_count: 0,
      player1_consecutive_passes: 0,
      player2_consecutive_passes: 0,
      pause_status: 'none',
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
      board: '[BOARD]',
      tile_bag: `[${remainingBag.length} tiles]`,
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
    const turnDuration = gameData.turn_duration_seconds || 180;
    const timerEnd = new Date(Date.now() + turnDuration * 1000).toISOString();

    const startingPlayer = Math.random() < 0.5 ? gameData.player1_id : playerId;

    await updateDoc(gameRef, {
      player2_id: playerId,
      status: 'playing',
      current_turn_player_id: startingPlayer,
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
      board: unflattenBoard(data.board),
    } as Game;
  },

  async getPlayerGames(playerId: string): Promise<Game[]> {
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
        board: unflattenBoard(data.board),
      } as Game;
    });
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
        console.log('- Has old shared_rack?:', !!(data as any).shared_rack);
        console.log('- Current turn player:', data.current_turn_player_id);

        const game = {
          id: snapshot.id,
          ...data,
          board: unflattenBoard(data.board),
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
      board: unflattenBoard(data.board),
    } as Game;

    if (game.current_turn_player_id !== playerId) {
      throw new Error('Not your turn');
    }

    const isPlayer1 = game.player1_id === playerId;

    let newBoard = game.board.map(row => row.map(cell => ({ ...cell })));

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

    const { tiles: drawnTiles, remainingBag } = drawTiles(game.tile_bag, Math.min(tilesUsed, game.tile_bag.length));
    const updatedRack = [...newRack, ...drawnTiles];

    const newScore = (isPlayer1 ? game.player1_score : game.player2_score) + score;
    const nextPlayer = isPlayer1 ? game.player2_id : game.player1_id;

    const updateData: any = {
      board: flattenBoard(newBoard),
      tile_bag: remainingBag,
      current_turn_player_id: nextPlayer,
      timer_ends_at: new Date(Date.now() + game.turn_duration_seconds * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isPlayer1) {
      updateData.player1_rack = updatedRack;
      updateData.player1_score = newScore;
      updateData.player1_moves_count = game.player1_moves_count + 1;
      updateData.player1_consecutive_passes = 0;

      if (!game.player1_highest_score || score > game.player1_highest_score) {
        updateData.player1_highest_word = word;
        updateData.player1_highest_score = score;
      }
    } else {
      updateData.player2_rack = updatedRack;
      updateData.player2_score = newScore;
      updateData.player2_moves_count = game.player2_moves_count + 1;
      updateData.player2_consecutive_passes = 0;

      if (!game.player2_highest_score || score > game.player2_highest_score) {
        updateData.player2_highest_word = word;
        updateData.player2_highest_score = score;
      }
    }

    if (updatedRack.length === 0 && remainingBag.length === 0) {
      await this.endGame(gameId, game, updateData, playerId);
    } else {
      await updateDoc(gameRef, updateData);
    }

    return { success: true };
  },

  async passTurn(gameId: string, playerId: string): Promise<void> {
    const gameRef = doc(db, 'games', gameId);
    const gameSnap = await getDoc(gameRef);

    if (!gameSnap.exists()) {
      throw new Error('Game not found');
    }

    const data = gameSnap.data();
    const game = {
      id: gameSnap.id,
      ...data,
      board: unflattenBoard(data.board),
    } as Game;

    if (game.current_turn_player_id !== playerId) {
      throw new Error('Not your turn');
    }

    const isPlayer1 = game.player1_id === playerId;
    const nextPlayer = isPlayer1 ? game.player2_id : game.player1_id;

    const updateData: any = {
      current_turn_player_id: nextPlayer,
      timer_ends_at: new Date(Date.now() + game.turn_duration_seconds * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isPlayer1) {
      updateData.player1_consecutive_passes = game.player1_consecutive_passes + 1;
    } else {
      updateData.player2_consecutive_passes = game.player2_consecutive_passes + 1;
    }

    const player1Passes = isPlayer1 ? updateData.player1_consecutive_passes : game.player1_consecutive_passes;
    const player2Passes = isPlayer1 ? game.player2_consecutive_passes : updateData.player2_consecutive_passes;

    if (player1Passes >= 2 && player2Passes >= 2) {
      await this.endGame(gameId, game, updateData, undefined);
    } else {
      await updateDoc(gameRef, updateData);
    }
  },

  async endGame(gameId: string, game: Game, additionalUpdates: any, playerWhoFinishedId?: string): Promise<void> {
    const gameRef = doc(db, 'games', gameId);

    const player1Rack = additionalUpdates.player1_rack || game.player1_rack;
    const player2Rack = additionalUpdates.player2_rack || game.player2_rack;
    const player1Score = additionalUpdates.player1_score || game.player1_score;
    const player2Score = additionalUpdates.player2_score || game.player2_score;

    const finalScores = calculateFinalScores(
      player1Score,
      player2Score,
      player1Rack,
      player2Rack,
      playerWhoFinishedId,
      game.player1_id
    );

    const winnerId = finalScores.player1Final > finalScores.player2Final ? game.player1_id : game.player2_id;

    const endData = {
      ...additionalUpdates,
      status: 'finished',
      winner_id: winnerId,
      player1_remaining_tiles: player1Rack,
      player2_remaining_tiles: player2Rack,
      game_ended_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await updateDoc(gameRef, endData);
  },

  async handleTimeExpired(gameId: string): Promise<void> {
    const gameRef = doc(db, 'games', gameId);
    const gameSnap = await getDoc(gameRef);

    if (!gameSnap.exists()) return;

    const data = gameSnap.data();
    const game = {
      id: gameSnap.id,
      ...data,
      board: unflattenBoard(data.board),
    } as Game;

    if (game.status !== 'playing') return;

    if (game.current_turn_player_id) {
      await this.passTurn(gameId, game.current_turn_player_id);
    }
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
    await updateDoc(gameRef, {
      status: 'paused',
      pause_status: 'accepted',
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
    const newTimerEnd = new Date(Date.now() + game.turn_duration_seconds * 1000).toISOString();

    await updateDoc(gameRef, {
      status: 'playing',
      pause_status: 'none',
      pause_requested_by: null,
      timer_ends_at: newTimerEnd,
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
};

function generateJoinCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
