import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Trophy } from 'lucide-react-native';
import { colors, spacing, typography } from '../theme/colors';
import { Button } from './Button';

interface Props {
  visible: boolean;
  winnerName: string;
  winnerWord: string;
  winnerScore: number;
  loserWord?: string;
  loserScore?: number;
  isWinner: boolean;
  onNext: () => void;
}

export function RoundResultModal({
  visible,
  winnerName,
  winnerWord,
  winnerScore,
  loserWord,
  loserScore,
  isWinner,
  onNext,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onNext}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Trophy size={48} color={isWinner ? colors.secondary : colors.muted} />
          </View>

          <Text style={styles.title}>
            {isWinner ? 'You Won!' : `${winnerName} Won!`}
          </Text>

          <View style={styles.resultContainer}>
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>Winning Word</Text>
              <Text style={styles.resultWord}>{winnerWord.toUpperCase()}</Text>
              <Text style={styles.resultScore}>{winnerScore} points</Text>
            </View>

            {loserWord && (
              <View style={[styles.resultCard, styles.loserCard]}>
                <Text style={styles.resultLabel}>Other Word</Text>
                <Text style={styles.resultWord}>{loserWord.toUpperCase()}</Text>
                <Text style={styles.resultScore}>{loserScore} points</Text>
              </View>
            )}
          </View>

          <Button title="Next Round" onPress={onNext} />
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
    padding: spacing.lg,
  },
  container: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  resultContainer: {
    width: '100%',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  resultCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },
  loserCard: {
    opacity: 0.7,
  },
  resultLabel: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  resultWord: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  resultScore: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
});
