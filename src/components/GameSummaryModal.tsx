import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { X } from 'lucide-react-native';
import { colors, spacing, typography } from '../theme/colors';
import { GameSummary } from '../types/game';

interface GameSummaryModalProps {
  visible: boolean;
  summary: GameSummary | null;
  currentPlayerId: string;
  player1Name: string;
  player2Name: string;
  onClose: () => void;
  onPlayAgain?: () => void;
}

export function GameSummaryModal({
  visible,
  summary,
  currentPlayerId,
  player1Name,
  player2Name,
  onClose,
  onPlayAgain,
}: GameSummaryModalProps) {
  if (!summary) return null;

  const isPlayer1 = currentPlayerId === summary.player1_id;
  const didWin = currentPlayerId === summary.winner_id;
  const opponentName = isPlayer1 ? player2Name : player1Name;

  const myScore = isPlayer1 ? summary.player1_score : summary.player2_score;
  const opponentScore = isPlayer1 ? summary.player2_score : summary.player1_score;
  const myHighestWord = isPlayer1 ? summary.player1_highest_word : summary.player2_highest_word;
  const myHighestScore = isPlayer1 ? summary.player1_highest_score : summary.player2_highest_score;
  const opponentHighestWord = isPlayer1 ? summary.player2_highest_word : summary.player1_highest_word;
  const opponentHighestScore = isPlayer1 ? summary.player2_highest_score : summary.player1_highest_score;
  const myMoves = isPlayer1 ? summary.player1_moves_count : summary.player2_moves_count;
  const opponentMoves = isPlayer1 ? summary.player2_moves_count : summary.player1_moves_count;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={colors.text.primary} />
          </TouchableOpacity>

          <View style={styles.confetti}>
            <Text style={styles.confettiText}>🎉</Text>
            <Text style={styles.confettiText}>✨</Text>
            <Text style={styles.confettiText}>🎊</Text>
          </View>

          <Text style={styles.resultTitle}>
            {didWin ? 'You Won!' : 'You Lost'}
          </Text>

          {summary.resigned && (
            <Text style={styles.resignedText}>
              {opponentName} resigned
            </Text>
          )}

          <View style={styles.playersContainer}>
            <View style={styles.playerAvatar}>
              <Text style={styles.avatarText}>
                {(isPlayer1 ? player1Name : player2Name)[0].toUpperCase()}
              </Text>
            </View>
            <View style={styles.vsText}>
              <Text style={styles.vsLabel}>VS</Text>
            </View>
            <View style={styles.playerAvatar}>
              <Text style={styles.avatarText}>
                {opponentName[0].toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.namesContainer}>
            <Text style={styles.playerName}>{isPlayer1 ? player1Name : player2Name}</Text>
            <View style={styles.heartIcon}>
              <Text>♥</Text>
            </View>
            <Text style={styles.playerName}>{opponentName}</Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statSection}>
              <Text style={styles.statLabel}>Top Word</Text>
              <View style={styles.statRow}>
                <View style={styles.statValue}>
                  <Text style={styles.statWord}>{myHighestWord || '-'}</Text>
                  <Text style={styles.statPoints}>{myHighestScore || 0} Points</Text>
                </View>
                <View style={styles.statValue}>
                  <Text style={styles.statWord}>{opponentHighestWord || '-'}</Text>
                  <Text style={styles.statPoints}>{opponentHighestScore || 0} Points</Text>
                </View>
              </View>
            </View>

            <View style={styles.statSection}>
              <Text style={styles.statLabel}>Game Score</Text>
              <View style={styles.statRow}>
                <Text style={styles.scoreValue}>{myScore}</Text>
                <Text style={styles.scoreValue}>{opponentScore}</Text>
              </View>
            </View>

            <View style={styles.statSection}>
              <Text style={styles.statLabel}>Total Moves</Text>
              <View style={styles.statRow}>
                <Text style={styles.scoreValue}>{myMoves}</Text>
                <Text style={styles.scoreValue}>{opponentMoves}</Text>
              </View>
            </View>

            <View style={styles.statSection}>
              <Text style={styles.statLabel}>Game Duration</Text>
              <View style={styles.statRow}>
                <Text style={styles.scoreValue} numberOfLines={1}>
                  {summary.duration_minutes} min
                </Text>
              </View>
            </View>

            <View style={styles.statSection}>
              <Text style={styles.statLabel}>Total Score</Text>
              <View style={styles.statRow}>
                <Text style={[styles.totalScore, didWin && styles.winnerScore]}>{myScore}</Text>
                <Text style={[styles.totalScore, !didWin && styles.winnerScore]}>{opponentScore}</Text>
              </View>
            </View>
          </View>

          {onPlayAgain && (
            <View style={styles.actionsContainer}>
              <TouchableOpacity style={styles.playAgainButton} onPress={onPlayAgain}>
                <Text style={styles.playAgainText}>Play Again</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 10,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confetti: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  confettiText: {
    fontSize: 28,
  },
  resultTitle: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  resignedText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  playersContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing.md,
    gap: spacing.md,
  },
  playerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  vsText: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  vsLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  namesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  heartIcon: {
    marginHorizontal: spacing.sm,
  },
  statsContainer: {
    gap: spacing.md,
  },
  statSection: {
    gap: spacing.xs,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  statValue: {
    flex: 1,
    alignItems: 'center',
  },
  statWord: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    textTransform: 'uppercase',
  },
  statPoints: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  totalScore: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  winnerScore: {
    color: colors.success,
  },
  actionsContainer: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  playAgainButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    alignItems: 'center',
  },
  playAgainText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
