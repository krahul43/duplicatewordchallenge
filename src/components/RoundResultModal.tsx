import { Monitor, User, Users } from 'lucide-react-native';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing, typography } from '../theme/colors';

interface Props {
  visible: boolean;
  winnerName: string;
  winnerWord: string;
  winnerScore: number;
  isWinner: boolean;
  onNext: () => void;
}

export function RoundResultModal({
  visible,
  winnerName,
  winnerWord,
  winnerScore,
  isWinner,
  onNext,
}: Props) {
  const renderTileLetter = (letter: string) => (
    <View style={styles.letterTile}>
      <Text style={styles.letterTileText}>{letter}</Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onNext}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>
            {isWinner ? '🎉 You Won This Round!' : `${winnerName} Won This Round`}
          </Text>

          <View style={styles.winnerSection}>
            <Text style={styles.subtitle}>Winning Word</Text>
            <View style={styles.wordContainer}>
              {winnerWord.split('').map((letter, index) => (
                <View key={index} style={styles.letterTile}>
                  <Text style={styles.letterTileText}>{letter}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.scoreText}>{winnerScore} Points</Text>
          </View>

          <TouchableOpacity style={styles.continueButton} onPress={onNext}>
            <Text style={styles.continueButtonText}>Next Round</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 24,
    color: colors.text,
  },
  title: {
    ...typography.h1,
    fontSize: 28,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.muted,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  winnerSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  wordContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  scoreText: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: '700',
  },
  playersRow: {
    flexDirection: 'row',
    gap: spacing.xl * 2,
    marginBottom: spacing.sm,
  },
  playerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.surface,
    fontSize: 24,
    fontWeight: '700',
  },
  playersNames: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  playerName: {
    ...typography.body,
    color: colors.text,
  },
  heartIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreBreakdown: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  scoreRow: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  scoreLabel: {
    ...typography.body,
    color: colors.muted,
    fontSize: 14,
  },
  scoreValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: spacing.xl * 2,
    marginTop: spacing.xs,
  },
  scoreValue: {
    ...typography.body,
    color: colors.text,
    fontSize: 14,
  },
  scoreLarge: {
    ...typography.h2,
    color: colors.text,
    fontSize: 24,
  },
  closeGameText: {
    ...typography.body,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  playTiles: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  letterTile: {
    width: 40,
    height: 45,
    backgroundColor: colors.tile,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  letterTileText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.tileText,
  },
  gameOptions: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  optionButton: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  optionText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    fontSize: 11,
  },
  continueButton: {
    width: '100%',
    backgroundColor: colors.button.primary,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButtonText: {
    ...typography.button,
    color: colors.surface,
    fontWeight: '700',
  },
});
