import { LinearGradient } from 'expo-linear-gradient';
import { Award, Home, RotateCcw, Star, TrendingUp, Trophy, Zap } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GameSummary } from '../types/game';

const { width } = Dimensions.get('window');

interface GameEndModalProps {
  visible: boolean;
  summary: GameSummary | null;
  currentPlayerId: string;
  onClose: () => void;
  onNewGame?: () => void;
}

export function GameEndModal({ visible, summary, currentPlayerId, onClose, onNewGame }: GameEndModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const trophyBounce = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
      trophyBounce.setValue(-20);
      shimmerAnim.setValue(0);

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(trophyBounce, {
          toValue: 0,
          friction: 5,
          tension: 60,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [visible]);

  if (!summary) return null;

  const isWinner = summary.winner_id === currentPlayerId;
  const isDraw = !summary.winner_id || summary.player1_score === summary.player2_score;
  const isPlayer1 = summary.player1_id === currentPlayerId;

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

  const iResigned = summary.resigned_player_id === currentPlayerId;

  const gradColors: [string, string, string] = isDraw
    ? ['#1e293b', '#334155', '#475569']
    : isWinner
    ? ['#064e3b', '#065f46', '#047857']
    : ['#7f1d1d', '#991b1b', '#b91c1c'];

  const accentColor = isDraw ? '#94a3b8' : isWinner ? '#34d399' : '#f87171';
  const highlightColor = isDraw ? '#64748b' : isWinner ? '#10b981' : '#ef4444';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <Animated.View style={[styles.sheet, { transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient colors={gradColors} style={styles.gradient}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              bounces={false}
            >
              <View style={styles.heroSection}>
                {isWinner && (
                  <View style={styles.confettiRow}>
                    {['🎉', '✨', '🎊', '⭐', '💫'].map((e, i) => (
                      <Text key={i} style={styles.confetti}>{e}</Text>
                    ))}
                  </View>
                )}

                <Animated.View
                  style={[
                    styles.trophyRing,
                    { backgroundColor: highlightColor, transform: [{ translateY: trophyBounce }] },
                  ]}
                >
                  {isDraw ? (
                    <Award size={52} color="#fff" strokeWidth={2} />
                  ) : isWinner ? (
                    <Trophy size={52} color="#fff" strokeWidth={2} />
                  ) : (
                    <Star size={52} color="#fff" strokeWidth={2} />
                  )}
                </Animated.View>

                <Text style={styles.resultTitle}>
                  {isDraw ? 'DRAW!' : isWinner ? 'VICTORY!' : 'DEFEATED'}
                </Text>

                {summary.resigned && (
                  <View style={styles.resignedBadge}>
                    <Text style={styles.resignedText}>
                      {iResigned ? 'You resigned' : 'Opponent resigned'}
                    </Text>
                  </View>
                )}

                <Text style={styles.resultSubtitle}>
                  {isDraw
                    ? 'Evenly matched!'
                    : isWinner
                    ? 'Outstanding performance!'
                    : 'Better luck next time!'}
                </Text>
              </View>

              <View style={styles.scoreRow}>
                <View style={[styles.scoreCard, isWinner && styles.scoreCardWinner]}>
                  <View style={[styles.avatarCircle, { backgroundColor: highlightColor }]}>
                    <Text style={styles.avatarText}>Y</Text>
                  </View>
                  <Text style={styles.scoreCardLabel}>YOU</Text>
                  <View style={[styles.scoreDisc, isWinner && styles.scoreDiscWinner]}>
                    <Text style={[styles.scoreNum, isWinner && styles.scoreNumWinner]}>
                      {playerFinalScore}
                    </Text>
                    <Text style={styles.scoreUnit}>PTS</Text>
                  </View>
                  {playerPenalty > 0 && (
                    <Text style={styles.penaltyNote}>-{playerPenalty} tiles</Text>
                  )}
                </View>

                <View style={styles.vsDivider}>
                  <View style={styles.vsLine} />
                  <View style={styles.vsBadge}>
                    <Text style={styles.vsText}>VS</Text>
                  </View>
                  <View style={styles.vsLine} />
                </View>

                <View style={[styles.scoreCard, !isWinner && !isDraw && styles.scoreCardWinner]}>
                  <View style={[styles.avatarCircle, { backgroundColor: '#6b7280' }]}>
                    <Text style={styles.avatarText}>O</Text>
                  </View>
                  <Text style={styles.scoreCardLabel}>OPP</Text>
                  <View style={[styles.scoreDisc, !isWinner && !isDraw && styles.scoreDiscWinner]}>
                    <Text style={[styles.scoreNum, !isWinner && !isDraw && styles.scoreNumWinner]}>
                      {opponentFinalScore}
                    </Text>
                    <Text style={styles.scoreUnit}>PTS</Text>
                  </View>
                  {opponentPenalty > 0 && (
                    <Text style={styles.penaltyNote}>-{opponentPenalty} tiles</Text>
                  )}
                </View>
              </View>

              <View style={styles.statsSection}>
                <Text style={styles.statsSectionLabel}>MATCH STATS</Text>

                <View style={styles.statCard}>
                  <View style={[styles.statIconBg, { backgroundColor: 'rgba(251,191,36,0.2)' }]}>
                    <Zap size={22} color="#fbbf24" fill="#fbbf24" />
                  </View>
                  <View style={styles.statBody}>
                    <Text style={styles.statLabel}>Best Word</Text>
                    <View style={styles.statCompare}>
                      <View style={styles.statSide}>
                        <Text style={styles.statWord}>{playerHighestWord || '—'}</Text>
                        <Text style={styles.statPts}>{playerHighestScore} pts</Text>
                      </View>
                      <View style={styles.statDivider} />
                      <View style={styles.statSide}>
                        <Text style={styles.statWord}>{opponentHighestWord || '—'}</Text>
                        <Text style={styles.statPts}>{opponentHighestScore} pts</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.statCard}>
                  <View style={[styles.statIconBg, { backgroundColor: 'rgba(59,130,246,0.2)' }]}>
                    <TrendingUp size={22} color="#3b82f6" />
                  </View>
                  <View style={styles.statBody}>
                    <Text style={styles.statLabel}>Total Moves</Text>
                    <View style={styles.statCompare}>
                      <View style={styles.statSide}>
                        <Text style={styles.statBigNum}>{playerMoves}</Text>
                      </View>
                      <View style={styles.statDivider} />
                      <View style={styles.statSide}>
                        <Text style={styles.statBigNum}>{opponentMoves}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {summary.duration_minutes > 0 && (
                  <View style={[styles.statCard, styles.statCardSingle]}>
                    <Text style={styles.statSingleLabel}>Game Duration</Text>
                    <Text style={styles.statSingleValue}>{summary.duration_minutes} min</Text>
                  </View>
                )}
              </View>

              <View style={styles.actions}>
                {onNewGame && (
                  <TouchableOpacity style={styles.primaryBtn} onPress={onNewGame} activeOpacity={0.85}>
                    <LinearGradient
                      colors={['#3b82f6', '#1d4ed8']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.primaryBtnGrad}
                    >
                      <RotateCcw size={20} color="#fff" strokeWidth={2.5} />
                      <Text style={styles.primaryBtnText}>Play Again</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.secondaryBtn} onPress={onClose} activeOpacity={0.85}>
                  <Home size={20} color="#fff" strokeWidth={2.5} />
                  <Text style={styles.secondaryBtnText}>Back to Home</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    maxHeight: '92%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 20,
  },
  gradient: {
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 36,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  confettiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  confetti: {
    fontSize: 24,
  },
  trophyRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 10,
  },
  resultTitle: {
    fontSize: 44,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  resignedBadge: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
  },
  resignedText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  resultSubtitle: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.4,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  scoreCardWinner: {
    borderColor: '#fbbf24',
    backgroundColor: 'rgba(251,191,36,0.12)',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
  },
  scoreCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.5,
  },
  scoreDisc: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  scoreDiscWinner: {
    borderColor: '#fbbf24',
    backgroundColor: 'rgba(251,191,36,0.18)',
  },
  scoreNum: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 30,
  },
  scoreNumWinner: {
    color: '#fbbf24',
  },
  scoreUnit: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1,
  },
  penaltyNote: {
    fontSize: 11,
    fontWeight: '600',
    color: '#f87171',
  },
  vsDivider: {
    alignItems: 'center',
    paddingHorizontal: 4,
    gap: 6,
  },
  vsLine: {
    width: 1.5,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  vsBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  vsText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
  statsSection: {
    marginBottom: 28,
    gap: 10,
  },
  statsSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 2,
    marginBottom: 4,
    textAlign: 'center',
  },
  statCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  statCardSingle: {
    justifyContent: 'space-between',
  },
  statIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statBody: {
    flex: 1,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 8,
  },
  statCompare: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statSide: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1.5,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  statWord: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statPts: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.65)',
  },
  statBigNum: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fff',
  },
  statSingleLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.75)',
  },
  statSingleValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  actions: {
    gap: 12,
  },
  primaryBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 17,
    gap: 10,
  },
  primaryBtnText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.4,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
});
