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

    const requestRef = doc(db, 'matchmaking', userId);

    await presenceService.setLookingForGame(userId, true);

    const existingOpponent = await this.findAvailableOpponent(userId);

    if (existingOpponent) {
      const gameId = existingOpponent.gameId || await gameService.createGame(existingOpponent.userId, false);

      await setDoc(requestRef, {
        userId,
        displayName,
        createdAt: new Date().toISOString(),
        status: 'matched',
        gameId,
        opponentId: existingOpponent.userId,
      });

      const opponentRequestRef = doc(db, 'matchmaking', existingOpponent.userId);
      await updateDoc(opponentRequestRef, {
        status: 'matched',
        opponentId: userId,
      });

      await presenceService.setInGame(userId, gameId);

      await gameService.joinGame(gameId, userId);

      return gameId;
    }

    const gameId = await gameService.createGame(userId, false);

    await setDoc(requestRef, {
      userId,
      displayName,
      createdAt: new Date().toISOString(),
      status: 'searching',
      gameId,
    });

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
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const potentialMatch = snapshot.docs[0].data() as MatchmakingRequest;

    if (potentialMatch.userId === currentUserId) {
      return null;
    }

    const opponentPresence = await presenceService.getUsersLookingForGame(currentUserId);
    const isOpponentOnline = opponentPresence.some(p => p.userId === potentialMatch.userId);

    if (!isOpponentOnline) {
      await deleteDoc(snapshot.docs[0].ref);
      return null;
    }

    return potentialMatch;
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

  async cleanupOldRequests(): Promise<void> {
    const matchmakingRef = collection(db, 'matchmaking');
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const q = query(
      matchmakingRef,
      where('createdAt', '<', fiveMinutesAgo)
    );

    const snapshot = await getDocs(q);

    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  },
};
