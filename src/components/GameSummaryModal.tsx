import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Award, Home, RotateCcw, Star, TrendingUp, Trophy, Zap } from 'lucide-react-native';
import React from 'react';
import { Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GameSummary } from '../types/game';

const { width } = Dimensions.get('window');

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
}: GameSummaryModalProps) {
  if (!summary) return null;

  const isPlayer1 = currentPlayerId === summary.player1_id;
  const didWin = currentPlayerId === summary.winner_id;
  const isDraw = !summary.winner_id || summary.player1_score === summary.player2_score;
  const opponentName = isPlayer1 ? player2Name : player1Name;

  const myScore = isPlayer1 ? summary.player1_score : summary.player2_score;
  const opponentScore = isPlayer1 ? summary.player2_score : summary.player1_score;
  const myHighestWord = isPlayer1 ? summary.player1_highest_word : summary.player2_highest_word;
  const myHighestScore = isPlayer1 ? summary.player1_highest_score : summary.player2_highest_score;
  const opponentHighestWord = isPlayer1 ? summary.player2_highest_word : summary.player1_highest_word;
  const opponentHighestScore = isPlayer1 ? summary.player2_highest_score : summary.player1_highest_score;
  const myMoves = isPlayer1 ? summary.player1_moves_count : summary.player2_moves_count;
  const opponentMoves = isPlayer1 ? summary.player2_moves_count : summary.player1_moves_count;
  const myName = isPlayer1 ? player1Name : player2Name;

  const mainColor = isDraw ? '#64748b' : didWin ? '#10b981' : '#ef4444';
  const accentColor = isDraw ? '#94a3b8' : didWin ? '#34d399' : '#f87171';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.fullScreen}>
        <LinearGradient
          colors={isDraw ? ['#1e293b', '#334155'] : didWin ? ['#064e3b', '#065f46', '#047857'] : ['#7f1d1d', '#991b1b', '#b91c1c']}
          style={styles.backgroundGradient}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}
            bounces={false}
          >
            <View style={styles.container}>
              <View style={styles.confettiContainer}>
                {didWin && (
                  <>
                    <Text style={[styles.confetti, { top: 40, left: 30 }]}>🎉</Text>
                    <Text style={[styles.confetti, { top: 60, right: 40 }]}>✨</Text>
                    <Text style={[styles.confetti, { top: 100, left: 60 }]}>🎊</Text>
                    <Text style={[styles.confetti, { top: 80, right: 70 }]}>⭐</Text>
                    <Text style={[styles.confetti, { top: 120, left: 100 }]}>🏆</Text>
                    <Text style={[styles.confetti, { top: 140, right: 90 }]}>💫</Text>
                  </>
                )}
              </View>

              <View style={styles.topSection}>
                <View style={[styles.trophyCircle, { backgroundColor: mainColor }]}>
                  {isDraw ? (
                    <Award size={56} color="#fff" strokeWidth={2} />
                  ) : didWin ? (
                    <Trophy size={56} color="#fff" strokeWidth={2} />
                  ) : (
                    <Star size={56} color="#fff" strokeWidth={2} />
                  )}
                </View>

                <Text style={styles.mainTitle}>
                  {isDraw ? 'DRAW!' : didWin ? 'VICTORY!' : 'DEFEATED'}
                </Text>

                {summary.resigned && (
                  <View style={styles.resignBadge}>
                    <Text style={styles.resignText}>{opponentName} resigned</Text>
                  </View>
                )}

                <Text style={styles.subtitle}>
                  {isDraw ? 'Evenly matched!' : didWin ? 'Outstanding performance!' : 'Better luck next time!'}
                </Text>
              </View>

              <View style={styles.scoreComparisonSection}>
                <View style={styles.playerCard}>
                  <View style={styles.playerHeader}>
                    <View style={[styles.playerAvatar, { backgroundColor: mainColor }]}>
                      <Text style={styles.playerInitial}>{myName[0].toUpperCase()}</Text>
                    </View>
                    <Text style={styles.playerNameLabel}>YOU</Text>
                  </View>
                  <Text style={styles.playerName}>{myName}</Text>
                  <View style={[styles.scoreCircle, didWin && styles.winnerScoreCircle]}>
                    <Text style={[styles.scoreNumber, didWin && styles.winnerScoreNumber]}>
                      {myScore}
                    </Text>
                    <Text style={styles.scoreLabel}>POINTS</Text>
                  </View>
                </View>

                <View style={styles.vsSection}>
                  <View style={styles.vsLine} />
                  <View style={styles.vsBadge}>
                    <Text style={styles.vsText}>VS</Text>
                  </View>
                  <View style={styles.vsLine} />
                </View>

                <View style={styles.playerCard}>
                  <View style={styles.playerHeader}>
                    <View style={[styles.playerAvatar, { backgroundColor: '#6b7280' }]}>
                      <Text style={styles.playerInitial}>{opponentName[0].toUpperCase()}</Text>
                    </View>
                    <Text style={styles.playerNameLabel}>OPPONENT</Text>
                  </View>
                  <Text style={styles.playerName}>{opponentName}</Text>
                  <View style={[styles.scoreCircle, !didWin && !isDraw && styles.winnerScoreCircle]}>
                    <Text style={[styles.scoreNumber, !didWin && !isDraw && styles.winnerScoreNumber]}>
                      {opponentScore}
                    </Text>
                    <Text style={styles.scoreLabel}>POINTS</Text>
                  </View>
                </View>
              </View>

              <View style={styles.statsSection}>
                <Text style={styles.statsSectionTitle}>MATCH STATISTICS</Text>

                <View style={styles.statCard}>
                  <View style={styles.statIconWrapper}>
                    <Zap size={24} color="#fbbf24" fill="#fbbf24" />
                  </View>
                  <View style={styles.statContent}>
                    <Text style={styles.statTitle}>Best Word</Text>
                    <View style={styles.statComparison}>
                      <View style={styles.statItem}>
                        <Text style={styles.statWord}>{myHighestWord || '-'}</Text>
                        <Text style={styles.statValue}>{myHighestScore || 0} pts</Text>
                      </View>
                      <View style={styles.statDividerVertical} />
                      <View style={styles.statItem}>
                        <Text style={styles.statWord}>{opponentHighestWord || '-'}</Text>
                        <Text style={styles.statValue}>{opponentHighestScore || 0} pts</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.statCard}>
                  <View style={styles.statIconWrapper}>
                    <TrendingUp size={24} color="#3b82f6" />
                  </View>
                  <View style={styles.statContent}>
                    <Text style={styles.statTitle}>Total Moves</Text>
                    <View style={styles.statComparison}>
                      <View style={styles.statItem}>
                        <Text style={styles.statValueLarge}>{myMoves}</Text>
                      </View>
                      <View style={styles.statDividerVertical} />
                      <View style={styles.statItem}>
                        <Text style={styles.statValueLarge}>{opponentMoves}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => {
                    onClose();
                    router.push('/');
                  }}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#3b82f6', '#2563eb']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryButtonGradient}
                  >
                    <RotateCcw size={22} color="#fff" strokeWidth={2.5} />
                    <Text style={styles.primaryButtonText}>Play Again</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={onClose}
                  activeOpacity={0.85}
                >
                  <Home size={20} color="#fff" strokeWidth={2.5} />
                  <Text style={styles.secondaryButtonText}>Back to Home</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  backgroundGradient: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 40,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  confettiContainer: {
    position: 'absolute',
    width: '100%',
    height: 200,
    zIndex: 0,
  },
  confetti: {
    position: 'absolute',
    fontSize: 32,
    opacity: 0.7,
  },
  topSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  trophyCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  mainTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  resignBadge: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  resignText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  scoreComparisonSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 12,
  },
  playerCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  playerHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  playerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  playerInitial: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
  },
  playerNameLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.5,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  winnerScoreCircle: {
    borderColor: '#fbbf24',
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
  },
  winnerScoreNumber: {
    color: '#fbbf24',
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1,
    marginTop: 4,
  },
  vsSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  vsLine: {
    width: 2,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  vsBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  vsText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
  statsSection: {
    marginBottom: 32,
  },
  statsSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 2,
    marginBottom: 16,
    textAlign: 'center',
  },
  statCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  statComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statWord: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  statValueLarge: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
  },
  statDividerVertical: {
    width: 2,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  actionButtons: {
    gap: 12,
    paddingBottom: 20,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
});
