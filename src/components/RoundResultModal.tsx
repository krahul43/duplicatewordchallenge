import { Monitor, User, Users } from 'lucide-react-native';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing, typography } from '../theme/colors';

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
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onNext}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.title}>
            {isWinner ? 'You Won!' : `${winnerName} Won!`}
          </Text>
          <Text style={styles.subtitle}>Dogna3 resigned</Text>

          <View style={styles.playersRow}>
            <View style={styles.playerAvatar}>
              <Text style={styles.avatarText}>C</Text>
            </View>
            <View style={styles.playerAvatar}>
              <Text style={styles.avatarText}>D</Text>
            </View>
          </View>

          <View style={styles.playersNames}>
            <Text style={styles.playerName}>Chairmanb</Text>
            <View style={styles.heartIcon}><Text>♡</Text></View>
            <Text style={styles.playerName}>DonnaS</Text>
          </View>

          <View style={styles.scoreBreakdown}>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>Top Word</Text>
            </View>
            <View style={styles.scoreValues}>
              <Text style={styles.scoreValue}>0 Points</Text>
              <Text style={styles.scoreValue}>0 Points</Text>
            </View>

            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>Game Score</Text>
            </View>
            <View style={styles.scoreValues}>
              <Text style={styles.scoreLarge}>0</Text>
              <Text style={styles.scoreLarge}>0</Text>
            </View>

            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>Time Penalties</Text>
            </View>
            <View style={styles.scoreValues}>
              <Text style={styles.scoreLarge}>0</Text>
              <Text style={styles.scoreLarge}>0</Text>
            </View>

            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>Leftover Tiles</Text>
            </View>
            <View style={styles.scoreValues}>
              <Text style={styles.scoreLarge}>0</Text>
              <Text style={styles.scoreLarge}>0</Text>
            </View>

            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>Total Score</Text>
            </View>
            <View style={styles.scoreValues}>
              <Text style={styles.scoreLarge}>0</Text>
              <Text style={styles.scoreLarge}>0</Text>
            </View>
          </View>

          <Text style={styles.closeGameText}>Close Game!</Text>

          <View style={styles.playTiles}>
            {renderTileLetter('P')}
            {renderTileLetter('L')}
            {renderTileLetter('A')}
            {renderTileLetter('Y')}
          </View>

          <View style={styles.gameOptions}>
            <TouchableOpacity style={styles.optionButton}>
              <Users size={32} color={colors.button.pink} />
              <Text style={styles.optionText}>ONLINE</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionButton}>
              <User size={32} color={colors.button.yellow} />
              <Text style={styles.optionText}>FRIEND</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionButton}>
              <Monitor size={32} color={colors.accent} />
              <Text style={styles.optionText}>COMPUTER</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.continueButton} onPress={onNext}>
            <Text style={styles.continueButtonText}>Continue</Text>
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
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.muted,
    marginBottom: spacing.lg,
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
