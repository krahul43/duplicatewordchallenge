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
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Game, Round, GameMove, Tile, BoardCell, GameSummary, TimerDuration } from '../types/game';
import { initializeBoard, generateRack, generateTileBag, drawTiles, flattenBoard, unflattenBoard } from '../utils/gameLogic';

function calculateScore(tiles: Tile[]): number {
  return tiles.reduce((sum, tile) => sum + tile.points, 0);
}

export const gameService = {
  async createGame(playerId: string, isPrivate: boolean, timerDuration: TimerDuration = 180): Promise<string> {
    const gameRef = doc(collection(db, 'games'));
    const board = initializeBoard();
    const tileBag = generateTileBag();

    const { tiles: sharedRack, remainingBag } = drawTiles(tileBag, 7);
    const joinCode = isPrivate ? generateJoinCode() : null;

    const gameData: any = {
      id: gameRef.id,
      player1_id: playerId,
      player2_id: null,
      status: 'waiting',
      board: flattenBoard(board),
      current_round: 0,
      shared_rack: sharedRack,
      tile_bag: remainingBag,
      round_duration_seconds: timerDuration,
      player1_score: 0,
      player2_score: 0,
      player1_moves_count: 0,
      player2_moves_count: 0,
      player1_submitted: false,
      player2_submitted: false,
      pause_status: 'none',
      is_private: isPrivate,
      dictionary: 'en',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (joinCode) {
      gameData.join_code = joinCode;
    }

    await setDoc(gameRef, gameData);
    return gameRef.id;
  },

  async joinGame(gameId: string, playerId: string): Promise<void> {
    const gameRef = doc(db, 'games', gameId);
    const gameSnap = await getDoc(gameRef);

    if (!gameSnap.exists()) {
      throw new Error('Game not found');
    }

    const gameData = gameSnap.data();
    const roundDuration = gameData.round_duration_seconds || 180;
    const timerEnd = new Date(Date.now() + roundDuration * 1000).toISOString();

    await updateDoc(gameRef, {
      player2_id: playerId,
      status: 'playing',
      timer_ends_at: timerEnd,
      current_round: 1,
      player1_submitted: false,
      player2_submitted: false,
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
        const game = {
          id: snapshot.id,
          ...data,
          board: unflattenBoard(data.board),
        } as Game;
        callback(game);
      }
    });
  },

  async submitWord(
    gameId: string,
    playerId: string,
    word: string,
    tiles: Tile[],
    placements: { row: number; col: number; letter: string; points: number }[]
  ): Promise<{ success: boolean; score: number; roundComplete?: boolean; isWinner?: boolean }> {
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

    const isPlayer1 = game.player1_id === playerId;

    if ((isPlayer1 && game.player1_submitted) || (!isPlayer1 && game.player2_submitted)) {
      throw new Error('Already submitted for this round');
    }

    const { calculateTotalScore } = await import('../utils/gameLogic');
    const score = calculateTotalScore(placements, game.board);

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (isPlayer1) {
      updateData.player1_submitted = true;
      updateData.player1_current_word = word;
      updateData.player1_current_score = score;
      updateData.player1_current_tiles = placements;
    } else {
      updateData.player2_submitted = true;
      updateData.player2_current_word = word;
      updateData.player2_current_score = score;
      updateData.player2_current_tiles = placements;
    }

    const bothSubmitted = (isPlayer1 ? game.player2_submitted : game.player1_submitted) && true;

    if (bothSubmitted) {
      const result = await this.completeRound(gameId, game, updateData, isPlayer1);
      return { success: true, score, roundComplete: true, isWinner: result.isWinner };
    }

    await updateDoc(gameRef, updateData);
    return { success: true, score, roundComplete: false };
  },

  async completeRound(
    gameId: string,
    game: Game,
    existingUpdates: any,
    currentIsPlayer1: boolean
  ): Promise<{ isWinner: boolean }> {
    const player1Score = currentIsPlayer1 ? existingUpdates.player1_current_score : game.player1_current_score;
    const player2Score = currentIsPlayer1 ? game.player2_current_score : existingUpdates.player2_current_score;
    const player1Word = currentIsPlayer1 ? existingUpdates.player1_current_word : game.player1_current_word;
    const player2Word = currentIsPlayer1 ? game.player2_current_word : existingUpdates.player2_current_word;
    const player1Tiles = currentIsPlayer1 ? existingUpdates.player1_current_tiles : game.player1_current_tiles;
    const player2Tiles = currentIsPlayer1 ? game.player2_current_tiles : existingUpdates.player2_current_tiles;

    const player1Won = (player1Score || 0) > (player2Score || 0);
    const roundWinnerId = player1Won ? game.player1_id : game.player2_id;
    const winningWord = player1Won ? player1Word : player2Word;
    const winningScore = player1Won ? player1Score : player2Score;
    const winningTiles = player1Won ? player1Tiles : player2Tiles;

    let newBoard = game.board.map(row => row.map(cell => ({ ...cell })));

    if (winningTiles && winningTiles.length > 0) {
      for (const tile of winningTiles) {
        newBoard[tile.row][tile.col] = {
          ...newBoard[tile.row][tile.col],
          letter: tile.letter,
          locked: true,
        };
      }
    }

    const { tiles: newSharedRack, remainingBag } = drawTiles(game.tile_bag, 7);

    const newRoundDuration = game.round_duration_seconds;
    const timerEnd = new Date(Date.now() + newRoundDuration * 1000).toISOString();

    const updateData: any = {
      ...existingUpdates,
      board: flattenBoard(newBoard),
      shared_rack: newSharedRack,
      tile_bag: remainingBag,
      player1_score: game.player1_score + (player1Score || 0),
      player2_score: game.player2_score + (player2Score || 0),
      player1_moves_count: game.player1_moves_count + 1,
      player2_moves_count: game.player2_moves_count + 1,
      player1_submitted: false,
      player2_submitted: false,
      round_winner_id: roundWinnerId,
      round_winner_word: winningWord,
      round_winner_score: winningScore,
      current_round: game.current_round + 1,
      timer_ends_at: timerEnd,
      player1_current_word: null,
      player2_current_word: null,
      player1_current_score: null,
      player2_current_score: null,
      player1_current_tiles: null,
      player2_current_tiles: null,
    };

    if (!game.player1_highest_score || (player1Score || 0) > game.player1_highest_score) {
      updateData.player1_highest_word = player1Word;
      updateData.player1_highest_score = player1Score;
    }

    if (!game.player2_highest_score || (player2Score || 0) > game.player2_highest_score) {
      updateData.player2_highest_word = player2Word;
      updateData.player2_highest_score = player2Score;
    }

    if (remainingBag.length === 0) {
      updateData.status = 'finished';
      updateData.winner_id = updateData.player1_score > updateData.player2_score ? game.player1_id : game.player2_id;
    }

    const gameRef = doc(db, 'games', gameId);
    await updateDoc(gameRef, updateData);

    return { isWinner: currentIsPlayer1 === player1Won };
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

    const player1Score = game.player1_current_score || 0;
    const player2Score = game.player2_current_score || 0;

    if (player1Score === 0 && player2Score === 0) {
      const { tiles: newSharedRack, remainingBag } = drawTiles(game.tile_bag, 7);
      const timerEnd = new Date(Date.now() + game.round_duration_seconds * 1000).toISOString();

      await updateDoc(gameRef, {
        shared_rack: newSharedRack,
        tile_bag: remainingBag,
        player1_submitted: false,
        player2_submitted: false,
        player1_current_word: null,
        player2_current_word: null,
        player1_current_score: null,
        player2_current_score: null,
        player1_current_tiles: null,
        player2_current_tiles: null,
        current_round: game.current_round + 1,
        timer_ends_at: timerEnd,
        updated_at: new Date().toISOString(),
      });
      return;
    }

    await this.completeRound(gameId, game, {}, true);
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
    const newTimerEnd = new Date(Date.now() + game.round_duration_seconds * 1000).toISOString();

    await updateDoc(gameRef, {
      status: 'playing',
      pause_status: 'none',
      pause_requested_by: null,
      timer_ends_at: newTimerEnd,
      player1_submitted: false,
      player2_submitted: false,
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
    const winnerId = game.player1_id === playerId ? game.player2_id : game.player1_id;

    await updateDoc(gameRef, {
      status: 'finished',
      winner_id: winnerId,
      resigned_player_id: playerId,
      updated_at: new Date().toISOString(),
    });
  },

  async getGameSummary(gameId: string): Promise<GameSummary | null> {
    const game = await this.getGame(gameId);

    if (!game || game.status !== 'finished') {
      return null;
    }

    const durationMinutes = Math.round(
      (new Date(game.updated_at).getTime() - new Date(game.created_at).getTime()) / 60000
    );

    return {
      game_id: game.id,
      winner_id: game.winner_id || game.player1_id,
      player1_id: game.player1_id,
      player2_id: game.player2_id || '',
      player1_score: game.player1_score,
      player2_score: game.player2_score,
      player1_highest_word: game.player1_highest_word || '',
      player1_highest_score: game.player1_highest_score || 0,
      player2_highest_word: game.player2_highest_word || '',
      player2_highest_score: game.player2_highest_score || 0,
      player1_moves_count: game.player1_moves_count,
      player2_moves_count: game.player2_moves_count,
      total_moves: game.player1_moves_count + game.player2_moves_count,
      duration_minutes: durationMinutes,
      resigned: !!game.resigned_player_id,
    };
  },

  async getRound(gameId: string, roundNumber: number): Promise<Round | null> {
    const roundsRef = collection(db, 'rounds');
    const q = query(
      roundsRef,
      where('game_id', '==', gameId),
      where('round_number', '==', roundNumber),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Round;
  },
};

function generateJoinCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
