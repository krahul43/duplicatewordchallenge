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
import { Game, Round, GameMove, Tile, BoardCell } from '../types/game';
import { initializeBoard, generateRack, flattenBoard, unflattenBoard } from '../utils/gameLogic';

function calculateScore(tiles: Tile[]): number {
  return tiles.reduce((sum, tile) => sum + tile.points, 0);
}

export const gameService = {
  async createGame(playerId: string, isPrivate: boolean): Promise<string> {
    const gameRef = doc(collection(db, 'games'));
    const board = initializeBoard();
    const rack = generateRack();
    const joinCode = isPrivate ? generateJoinCode() : null;

    const gameData: any = {
      id: gameRef.id,
      player1_id: playerId,
      player2_id: null,
      status: 'waiting',
      board: flattenBoard(board),
      current_round: 0,
      current_rack: rack,
      round_duration_seconds: 120,
      player1_score: 0,
      player2_score: 0,
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
    const timerEnd = new Date(Date.now() + 120000).toISOString();

    await updateDoc(gameRef, {
      player2_id: playerId,
      status: 'playing',
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
    tiles: Tile[]
  ): Promise<{ success: boolean; roundComplete: boolean; result?: any }> {
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
    const points = calculateScore(tiles);

    const roundRef = doc(collection(db, 'rounds'));
    const roundId = roundRef.id;

    let roundData: any = {
      id: roundId,
      game_id: gameId,
      round_number: game.current_round,
      rack: game.current_rack,
      created_at: new Date().toISOString(),
    };

    if (isPlayer1) {
      roundData.player1_word = word;
      roundData.player1_points = points;
      roundData.player1_submitted_at = new Date().toISOString();
    } else {
      roundData.player2_word = word;
      roundData.player2_points = points;
      roundData.player2_submitted_at = new Date().toISOString();
    }

    const existingRoundQuery = query(
      collection(db, 'rounds'),
      where('game_id', '==', gameId),
      where('round_number', '==', game.current_round),
      limit(1)
    );

    const existingRoundSnap = await getDocs(existingRoundQuery);

    if (!existingRoundSnap.empty) {
      const existingRound = existingRoundSnap.docs[0];
      const existingRoundData = existingRound.data() as Round;

      if (isPlayer1) {
        await updateDoc(doc(db, 'rounds', existingRound.id), {
          player1_word: word,
          player1_points: points,
          player1_submitted_at: new Date().toISOString(),
        });
      } else {
        await updateDoc(doc(db, 'rounds', existingRound.id), {
          player2_word: word,
          player2_points: points,
          player2_submitted_at: new Date().toISOString(),
        });
      }

      const bothSubmitted = isPlayer1
        ? existingRoundData.player2_submitted_at
        : existingRoundData.player1_submitted_at;

      if (bothSubmitted) {
        const p1Points = isPlayer1 ? points : (existingRoundData.player1_points || 0);
        const p2Points = isPlayer1 ? (existingRoundData.player2_points || 0) : points;
        const p1Word = isPlayer1 ? word : (existingRoundData.player1_word || '');
        const p2Word = isPlayer1 ? (existingRoundData.player2_word || '') : word;

        const winnerId = p1Points > p2Points ? game.player1_id : game.player2_id;
        const winningWord = p1Points > p2Points ? p1Word : p2Word;
        const winningPoints = Math.max(p1Points, p2Points);

        await updateDoc(doc(db, 'rounds', existingRound.id), {
          winner_id: winnerId,
          winning_word: winningWord,
          winning_points: winningPoints,
        });

        const newRack = generateRack();
        const newTimerEnd = new Date(Date.now() + game.round_duration_seconds * 1000).toISOString();

        await updateDoc(gameRef, {
          player1_score: game.player1_score + p1Points,
          player2_score: game.player2_score + p2Points,
          current_round: game.current_round + 1,
          current_rack: newRack,
          timer_ends_at: newTimerEnd,
          updated_at: new Date().toISOString(),
        });

        return {
          success: true,
          roundComplete: true,
          result: {
            winnerId,
            winningWord,
            winningScore: winningPoints,
            loserWord: p1Points > p2Points ? p2Word : p1Word,
            loserScore: Math.min(p1Points, p2Points),
            winnerName: winnerId === game.player1_id ? 'Player 1' : 'Player 2',
          },
        };
      }
    } else {
      await setDoc(roundRef, roundData);
    }

    return { success: true, roundComplete: false };
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
