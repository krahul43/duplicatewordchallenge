import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    onSnapshot,
    query,
    setDoc,
    where
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface UserPresence {
  userId: string;
  status: 'online' | 'in_game' | 'offline';
  lastSeen: string;
  lookingForGame: boolean;
  displayName: string;
  currentGameId?: string;
}

export const presenceService = {
  async setUserOnline(userId: string, displayName: string): Promise<void> {
    const presenceRef = doc(db, 'presence', userId);
    await setDoc(presenceRef, {
      userId,
      displayName,
      status: 'online',
      lastSeen: new Date().toISOString(),
      lookingForGame: false,
      updatedAt: new Date().toISOString(),
    });
  },

  async setLookingForGame(userId: string, looking: boolean): Promise<void> {
    const presenceRef = doc(db, 'presence', userId);
    await setDoc(presenceRef, {
      lookingForGame: looking,
      status: looking ? 'online' : 'online',
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  },

  async setInGame(userId: string, gameId: string): Promise<void> {
    const presenceRef = doc(db, 'presence', userId);
    await setDoc(presenceRef, {
      status: 'in_game',
      currentGameId: gameId,
      lookingForGame: false,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  },

  async setUserOffline(userId: string): Promise<void> {
    const presenceRef = doc(db, 'presence', userId);
    await setDoc(presenceRef, {
      status: 'offline',
      lookingForGame: false,
      lastSeen: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  },

  async removePresence(userId: string): Promise<void> {
    const presenceRef = doc(db, 'presence', userId);
    await deleteDoc(presenceRef);
  },

  async getOnlineUsers(): Promise<UserPresence[]> {
    const presenceRef = collection(db, 'presence');
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const q = query(
      presenceRef,
      where('status', '==', 'online'),
      where('updatedAt', '>', fiveMinutesAgo)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as UserPresence);
  },

  async getUsersLookingForGame(excludeUserId: string): Promise<UserPresence[]> {
    const presenceRef = collection(db, 'presence');
    const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000).toISOString();

    const q = query(
      presenceRef,
      where('lookingForGame', '==', true),
      where('status', '==', 'online'),
      where('updatedAt', '>', oneMinuteAgo)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => doc.data() as UserPresence)
      .filter(presence => presence.userId !== excludeUserId);
  },

  subscribeToPresence(userId: string, callback: (presence: UserPresence | null) => void) {
    const presenceRef = doc(db, 'presence', userId);

    return onSnapshot(presenceRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as UserPresence);
      } else {
        callback(null);
      }
    });
  },
};
