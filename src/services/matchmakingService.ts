import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  Unsubscribe,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { gameService } from './gameService';
import { presenceService } from './presenceService';

export interface MatchmakingRequest {
  userId: string;
  displayName: string;
  createdAt: string;
  status: 'searching' | 'matched' | 'cancelled';
  gameId?: string;
  opponentId?: string;
}

export const matchmakingService = {
  async joinMatchmaking(userId: string, displayName: string): Promise<string> {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to join matchmaking');
    }

    if (auth.currentUser.uid !== userId) {
      throw new Error('User ID mismatch');
    }

    console.log(`[Matchmaking] ${displayName} joining matchmaking`);

    const requestRef = doc(db, 'matchmaking', userId);

    await presenceService.setLookingForGame(userId, true);

    const gameId = await gameService.createGame(userId, false);
    console.log(`[Matchmaking] ${displayName} created game: ${gameId}`);

    await setDoc(requestRef, {
      userId,
      displayName,
      createdAt: new Date().toISOString(),
      status: 'searching',
      gameId,
    });

    await new Promise(resolve => setTimeout(resolve, 300));

    let existingOpponent = await this.findAvailableOpponent(userId);
    console.log(`[Matchmaking] ${displayName} first search result:`, existingOpponent?.displayName || 'none');

    if (!existingOpponent) {
      await new Promise(resolve => setTimeout(resolve, 500));
      existingOpponent = await this.findAvailableOpponent(userId);
      console.log(`[Matchmaking] ${displayName} second search result:`, existingOpponent?.displayName || 'none');
    }

    if (existingOpponent && existingOpponent.gameId && existingOpponent.gameId !== gameId) {
      console.log(`[Matchmaking] ${displayName} found opponent ${existingOpponent.displayName}, joining game ${existingOpponent.gameId}`);
      try {
        await gameService.joinGame(existingOpponent.gameId, userId);

        await updateDoc(requestRef, {
          status: 'matched',
          gameId: existingOpponent.gameId,
          opponentId: existingOpponent.userId,
        });

        const opponentRequestRef = doc(db, 'matchmaking', existingOpponent.userId);
        await updateDoc(opponentRequestRef, {
          status: 'matched',
          opponentId: userId,
        });

        await presenceService.setInGame(userId, existingOpponent.gameId);

        const myGameRef = doc(db, 'games', gameId);
        const myGameSnap = await getDoc(myGameRef);
        if (myGameSnap.exists()) {
          const myGameData = myGameSnap.data();
          if (myGameData.status === 'waiting' && !myGameData.player2_id) {
            await updateDoc(myGameRef, {
              status: 'finished',
              updated_at: new Date().toISOString(),
            });
          }
        }

        console.log(`[Matchmaking] ${displayName} successfully matched! Game: ${existingOpponent.gameId}`);
        return existingOpponent.gameId;
      } catch (error) {
        console.error(`[Matchmaking] ${displayName} failed to join existing game:`, error);
      }
    }

    console.log(`[Matchmaking] ${displayName} waiting for opponent in game: ${gameId}`);
    return gameId;
  },

  async findAvailableOpponent(currentUserId: string): Promise<MatchmakingRequest | null> {
    const matchmakingRef = collection(db, 'matchmaking');
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

    const q = query(
      matchmakingRef,
      where('status', '==', 'searching'),
      where('createdAt', '>', twoMinutesAgo),
      orderBy('createdAt', 'asc'),
      limit(10)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    for (const docSnapshot of snapshot.docs) {
      const potentialMatch = docSnapshot.data() as MatchmakingRequest;

      if (potentialMatch.userId === currentUserId) {
        continue;
      }

      if (!potentialMatch.gameId) {
        continue;
      }

      const gameRef = doc(db, 'games', potentialMatch.gameId);
      const gameSnap = await getDoc(gameRef);

      if (!gameSnap.exists()) {
        await deleteDoc(docSnapshot.ref);
        continue;
      }

      const gameData = gameSnap.data();
      if (gameData.status !== 'waiting' || gameData.player2_id !== null) {
        continue;
      }

      return potentialMatch;
    }

    return null;
  },

  async getMatchmakingRequest(userId: string): Promise<MatchmakingRequest | null> {
    const requestRef = doc(db, 'matchmaking', userId);
    const requestSnap = await getDoc(requestRef);

    if (requestSnap.exists()) {
      return requestSnap.data() as MatchmakingRequest;
    }

    return null;
  },

  async cancelMatchmaking(userId: string): Promise<void> {
    const requestRef = doc(db, 'matchmaking', userId);
    const requestSnap = await getDoc(requestRef);

    if (requestSnap.exists()) {
      const data = requestSnap.data() as MatchmakingRequest;

      if (data.status === 'searching' && data.gameId) {
        try {
          await gameService.resignGame(data.gameId, userId);
        } catch (error) {
          console.error('Error resigning from game during cancel:', error);
        }
      }
    }

    await deleteDoc(requestRef);
    await presenceService.setLookingForGame(userId, false);
  },

  subscribeToMatchmaking(userId: string, callback: (request: MatchmakingRequest | null) => void): Unsubscribe {
    const requestRef = doc(db, 'matchmaking', userId);

    return onSnapshot(requestRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as MatchmakingRequest);
      } else {
        callback(null);
      }
    });
  },

  async cleanupOldRequests(userId: string): Promise<void> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const requestRef = doc(db, 'matchmaking', userId);
    const requestSnap = await getDoc(requestRef);

    if (requestSnap.exists()) {
      const data = requestSnap.data() as MatchmakingRequest;

      if (data.createdAt < fiveMinutesAgo && data.status === 'searching') {
        console.log(`[Matchmaking] Cleaning up old request for user ${userId}`);
        await deleteDoc(requestRef);
        await presenceService.setLookingForGame(userId, false);
      }
    }
  },
};
