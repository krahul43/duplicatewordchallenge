import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { GameSummary } from '../types/game';
import { Trophy, Award, TrendingUp, Clock, Zap } from 'lucide-react-native';

interface GameEndModalProps {
  visible: boolean;
  summary: GameSummary | null;
  currentPlayerId: string;
  onClose: () => void;
  onNewGame?: () => void;
}

export function GameEndModal({ visible, summary, currentPlayerId, onClose, onNewGame }: GameEndModalProps) {
  if (!summary) return null;

  const isWinner = summary.winner_id === currentPlayerId;
  const isPlayer1 = summary.player1_id === currentPlayerId;

  const playerScore = isPlayer1 ? summary.player1_score : summary.player2_score;
  const opponentScore = isPlayer1 ? summary.player2_score : summary.player1_score;

  const playerFinalScore = isPlayer1 ? summary.player1_final_score : summary.player2_final_score;
  const opponentFinalScore = isPlayer1 ? summary.player2_final_score : summary.player1_final_score;

  const playerPenalty = isPlayer1 ? summary.player1_remaining_tiles_penalty : summary.player2_remaining_tiles_penalty;
  const opponentPenalty = isPlayer1 ? summary.player2_remaining_tiles_penalty : summary.player1_remaining_tiles_penalty;

  const playerHighestWord = isPlayer1 ? summary.player1_highest_word : summary.player2_highest_word;
  const playerHighestScore = isPlayer1 ? summary.player1_highest_score : summary.player2_highest_score;
  const opponentHighestWord = isPlayer1 ? summary.player2_highest_word : summary.player1_highest_word;
  const opponentHighestScore = isPlayer1 ? summary.player2_highest_score : summary.player1_highest_score;

  const playerMoves = isPlayer1 ? summary.player1_moves_count : summary.player2_moves_count;
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
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={[styles.header, isWinner ? styles.winnerHeader : styles.loserHeader]}>
              <Trophy size={48} color="#FFF" />
              <Text style={styles.headerTitle}>
                {summary.resigned ? 'Game Ended' : (isWinner ? 'Victory!' : 'Game Over')}
              </Text>
              {summary.resigned && (
                <Text style={styles.resignedText}>Opponent resigned</Text>
              )}
            </View>

            <View style={styles.finalScoresContainer}>
              <Text style={styles.sectionTitle}>Final Scores</Text>

              <View style={styles.scoreRow}>
                <View style={[styles.playerScoreBox, isWinner && styles.winnerBox]}>
                  <Text style={styles.playerLabel}>You</Text>
                  <Text style={styles.finalScore}>{playerFinalScore}</Text>
                  {isWinner && <Award size={20} color="#4CAF50" />}
                </View>

                <View style={[styles.playerScoreBox, !isWinner && styles.winnerBox]}>
                  <Text style={styles.playerLabel}>Opponent</Text>
                  <Text style={styles.finalScore}>{opponentFinalScore}</Text>
                  {!isWinner && <Award size={20} color="#4CAF50" />}
                </View>
              </View>
            </View>

            <View style={styles.breakdownContainer}>
              <Text style={styles.sectionTitle}>Score Breakdown</Text>

              <View style={styles.breakdownTable}>
                <View style={styles.breakdownHeader}>
                  <Text style={styles.breakdownHeaderText}>Metric</Text>
                  <Text style={styles.breakdownHeaderText}>You</Text>
                  <Text style={styles.breakdownHeaderText}>Opponent</Text>
                </View>

                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Points Earned</Text>
                  <Text style={styles.breakdownValue}>{playerScore}</Text>
                  <Text style={styles.breakdownValue}>{opponentScore}</Text>
                </View>

                <View style={[styles.breakdownRow, styles.alternateRow]}>
                  <Text style={styles.breakdownLabel}>Remaining Tiles</Text>
                  <Text style={[styles.breakdownValue, styles.penaltyText]}>-{playerPenalty}</Text>
                  <Text style={[styles.breakdownValue, styles.penaltyText]}>-{opponentPenalty}</Text>
                </View>

                <View style={styles.breakdownRow}>
                  <Text style={[styles.breakdownLabel, styles.boldText]}>Final Score</Text>
                  <Text style={[styles.breakdownValue, styles.boldText]}>{playerFinalScore}</Text>
                  <Text style={[styles.breakdownValue, styles.boldText]}>{opponentFinalScore}</Text>
                </View>
              </View>
            </View>

            <View style={styles.statsContainer}>
              <Text style={styles.sectionTitle}>Game Statistics</Text>

              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <TrendingUp size={20} color="#2196F3" />
                  <Text style={styles.statLabel}>Highest Word</Text>
                  <Text style={styles.statValue}>{playerHighestWord || 'N/A'}</Text>
                  <Text style={styles.statSubvalue}>({playerHighestScore} pts)</Text>
                </View>

                <View style={styles.statItem}>
                  <TrendingUp size={20} color="#FF9800" />
                  <Text style={styles.statLabel}>Opponent's Best</Text>
                  <Text style={styles.statValue}>{opponentHighestWord || 'N/A'}</Text>
                  <Text style={styles.statSubvalue}>({opponentHighestScore} pts)</Text>
                </View>
              </View>

              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Zap size={20} color="#9C27B0" />
                  <Text style={styles.statLabel}>Your Moves</Text>
                  <Text style={styles.statValue}>{playerMoves}</Text>
                </View>

                <View style={styles.statItem}>
                  <Zap size={20} color="#FF5722" />
                  <Text style={styles.statLabel}>Opponent Moves</Text>
                  <Text style={styles.statValue}>{opponentMoves}</Text>
                </View>
              </View>

              <View style={styles.statRowSingle}>
                <Clock size={20} color="#607D8B" />
                <Text style={styles.statLabel}>Game Duration</Text>
                <Text style={styles.statValue}>{summary.duration_minutes} min</Text>
              </View>
            </View>

            <View style={styles.actions}>
              {onNewGame && (
                <TouchableOpacity style={styles.newGameButton} onPress={onNewGame}>
                  <Text style={styles.newGameButtonText}>New Game</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
  },
  winnerHeader: {
    backgroundColor: '#4CAF50',
  },
  loserHeader: {
    backgroundColor: '#FF5722',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
  },
  resignedText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 8,
    opacity: 0.9,
  },
  finalScoresContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 16,
    textAlign: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
  },
  playerScoreBox: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  winnerBox: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  playerLabel: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 8,
    fontWeight: '600',
  },
  finalScore: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  breakdownContainer: {
    marginBottom: 24,
  },
  breakdownTable: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  breakdownHeader: {
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  breakdownHeaderText: {
    flex: 1,
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  breakdownRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  alternateRow: {
    backgroundColor: '#F5F5F5',
  },
  breakdownLabel: {
    flex: 1,
    fontSize: 14,
    color: '#424242',
  },
  breakdownValue: {
    flex: 1,
    fontSize: 14,
    color: '#424242',
    textAlign: 'center',
    fontWeight: '600',
  },
  penaltyText: {
    color: '#F44336',
  },
  boldText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  statsContainer: {
    marginBottom: 24,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  statRowSingle: {
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#757575',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    textAlign: 'center',
  },
  statSubvalue: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 2,
  },
  actions: {
    gap: 12,
  },
  newGameButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  newGameButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#757575',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
