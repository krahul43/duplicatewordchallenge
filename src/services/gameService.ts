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

    const { tiles: player1Rack, remainingBag } = drawTiles(tileBag, 7);
    const joinCode = isPrivate ? generateJoinCode() : null;

    const gameData: any = {
      id: gameRef.id,
      player1_id: playerId,
      player2_id: null,
      status: 'waiting',
      board: flattenBoard(board),
      current_round: 0,
      player1_rack: player1Rack,
      player2_rack: [],
      tile_bag: remainingBag,
      current_player_id: null,
      round_duration_seconds: timerDuration,
      player1_score: 0,
      player2_score: 0,
      player1_moves_count: 0,
      player2_moves_count: 0,
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
    const tileBag = gameData.tile_bag || [];
    const { tiles: player2Rack, remainingBag } = drawTiles(tileBag, 7);
    const timerEnd = new Date(Date.now() + 120000).toISOString();

    await updateDoc(gameRef, {
      player2_id: playerId,
      player2_rack: player2Rack,
      tile_bag: remainingBag,
      status: 'playing',
      current_player_id: gameData.player1_id,
      timer_ends_at: timerEnd,
      current_round: 1,
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
  ): Promise<{ success: boolean; score: number }> {
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

    if (game.current_player_id !== playerId) {
      throw new Error('Not your turn');
    }

    const isPlayer1 = game.player1_id === playerId;
    const board = game.board;

    let score = 0;
    let wordMultiplier = 1;

    placements.forEach(placement => {
      const cell = board[placement.row][placement.col];
      let tileScore = placement.points;

      if (!cell.locked) {
        switch (cell.type) {
          case 'DL':
            tileScore *= 2;
            break;
          case 'TL':
            tileScore *= 3;
            break;
          case 'DW':
          case 'CENTER':
            wordMultiplier *= 2;
            break;
          case 'TW':
            wordMultiplier *= 3;
            break;
        }
      }

      score += tileScore;
      board[placement.row][placement.col] = {
        ...cell,
        letter: placement.letter,
        locked: true,
      };
    });

    score *= wordMultiplier;

    if (tiles.length === 7) {
      score += 50;
    }

    const currentRack = isPlayer1 ? game.player1_rack : game.player2_rack;
    const newRack = currentRack.filter(
      tile => !tiles.some(t => t.letter === tile.letter && t.points === tile.points)
    );

    const { tiles: drawnTiles, remainingBag } = drawTiles(game.tile_bag, Math.min(tiles.length, game.tile_bag.length));
    newRack.push(...drawnTiles);

    const nextPlayerId = isPlayer1 ? game.player2_id : game.player1_id;
    const newTimerEnd = new Date(Date.now() + game.round_duration_seconds * 1000).toISOString();

    const updateData: any = {
      board: flattenBoard(board),
      tile_bag: remainingBag,
      current_player_id: nextPlayerId,
      timer_ends_at: newTimerEnd,
      updated_at: new Date().toISOString(),
    };

    if (isPlayer1) {
      const newScore = game.player1_score + score;
      const newMoves = game.player1_moves_count + 1;
      updateData.player1_score = newScore;
      updateData.player1_rack = newRack;
      updateData.player1_moves_count = newMoves;

      if (!game.player1_highest_score || score > game.player1_highest_score) {
        updateData.player1_highest_word = word;
        updateData.player1_highest_score = score;
      }
    } else {
      const newScore = game.player2_score + score;
      const newMoves = game.player2_moves_count + 1;
      updateData.player2_score = newScore;
      updateData.player2_rack = newRack;
      updateData.player2_moves_count = newMoves;

      if (!game.player2_highest_score || score > game.player2_highest_score) {
        updateData.player2_highest_word = word;
        updateData.player2_highest_score = score;
      }
    }

    if (remainingBag.length === 0 && newRack.length === 0) {
      updateData.status = 'finished';
      updateData.winner_id = (isPlayer1 ? updateData.player1_score : updateData.player2_score) >
                              (isPlayer1 ? game.player2_score : game.player1_score)
                              ? playerId
                              : nextPlayerId;
    }

    await updateDoc(gameRef, updateData);

    return { success: true, score };
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

  async resumeGame(gameId: string, currentPlayerId: string): Promise<void> {
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
