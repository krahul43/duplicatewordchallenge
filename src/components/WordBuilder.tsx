import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Shuffle, X } from 'lucide-react-native';
import { Tile } from '../types/game';
import { colors, spacing, typography } from '../theme/colors';

interface Props {
  selectedTiles: Tile[];
  onRemoveTile: (index: number) => void;
  onClear: () => void;
}

export function WordBuilder({ selectedTiles, onRemoveTile, onClear }: Props) {
  const word = selectedTiles.map(t => t.letter).join('');
  const score = selectedTiles.reduce((sum, t) => sum + t.points, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Your Word</Text>
        {selectedTiles.length > 0 && (
          <TouchableOpacity onPress={onClear} style={styles.clearButton}>
            <X size={16} color={colors.error} />
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.wordContainer}>
        {selectedTiles.length === 0 ? (
          <Text style={styles.placeholder}>Tap tiles to build your word</Text>
        ) : (
          <View style={styles.tilesRow}>
            {selectedTiles.map((tile, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => onRemoveTile(index)}
                style={styles.selectedTile}
              >
                <Text style={styles.selectedLetter}>{tile.letter}</Text>
                <Text style={styles.selectedPoints}>{tile.points}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {selectedTiles.length > 0 && (
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Base Score</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '600',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  clearText: {
    fontSize: 11,
    color: colors.error,
    fontWeight: '600',
  },
  wordContainer: {
    minHeight: 54,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 6,
    paddingVertical: spacing.xs,
  },
  placeholder: {
    fontSize: 13,
    color: colors.muted,
  },
  tilesRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  selectedTile: {
    width: 42,
    height: 48,
    backgroundColor: colors.tile,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  selectedLetter: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.tileText,
  },
  selectedPoints: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.tileText,
    position: 'absolute',
    bottom: 2,
    right: 3,
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.background,
  },
  scoreLabel: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '600',
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
});
