import { and, collection, getDocs, or, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Game } from '../types/game';

export interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  totalScore: number;
  highestWordScore: number;
  winRate: number;
  averageScore: number;
}

export const statsService = {
  async getUserStats(userId: string): Promise<UserStats> {
    try {
      const gamesRef = collection(db, 'games');
      const q = query(
        gamesRef,
        and(
          or(
            where('player1_id', '==', userId),
            where('player2_id', '==', userId)
          ),
          where('status', '==', 'finished')
        )
      );

      const snapshot = await getDocs(q);
      const games = snapshot.docs.map(doc => doc.data() as Game);

      let totalScore = 0;
      let gamesWon = 0;
      let highestWordScore = 0;

      for (const game of games) {
        const isPlayer1 = game.player1_id === userId;
        const myScore = isPlayer1 ? game.player1_score : game.player2_score;

        totalScore += myScore;

        if (game.winner_id === userId) {
          gamesWon++;
        }

        if (game.player1_highest_score && isPlayer1) {
          highestWordScore = Math.max(highestWordScore, game.player1_highest_score);
        }
        if (game.player2_highest_score && !isPlayer1) {
          highestWordScore = Math.max(highestWordScore, game.player2_highest_score);
        }
      }

      const gamesPlayed = games.length;
      const winRate = gamesPlayed > 0 ? (gamesWon / gamesPlayed) * 100 : 0;
      const averageScore = gamesPlayed > 0 ? totalScore / gamesPlayed : 0;

      return {
        gamesPlayed,
        gamesWon,
        totalScore,
        highestWordScore,
        winRate,
        averageScore,
      };
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
      return {
        gamesPlayed: 0,
        gamesWon: 0,
        totalScore: 0,
        highestWordScore: 0,
        winRate: 0,
        averageScore: 0,
      };
    }
  },
};
