import { X } from 'lucide-react-native';
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Tile } from '../types/game';

const ORIGINAL_DISTRIBUTION: Record<string, number> = {
  A: 9, B: 2, C: 2, D: 4, E: 12, F: 2, G: 3, H: 2, I: 9, J: 1,
  K: 1, L: 4, M: 2, N: 6, O: 8, P: 2, Q: 1, R: 6, S: 4, T: 6,
  U: 4, V: 2, W: 2, X: 1, Y: 2, Z: 1, BLANK: 2
};

interface Props {
  visible: boolean;
  onClose: () => void;
  tileBag: Tile[];
}

export function TileBagViewer({ visible, onClose, tileBag }: Props) {
  const remainingCounts = tileBag.reduce((acc, tile) => {
    acc[tile.letter] = (acc[tile.letter] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const allLetters = Object.entries(ORIGINAL_DISTRIBUTION).sort(([a], [b]) => {
    if (a === 'BLANK') return 1;
    if (b === 'BLANK') return -1;
    return a.localeCompare(b);
  });

  const totalRemaining = tileBag.length;
  const totalOriginal = Object.values(ORIGINAL_DISTRIBUTION).reduce((sum, count) => sum + count, 0);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Tile Bag</Text>
            <Text style={styles.subtitle}>
              {totalRemaining} / {totalOriginal} tiles remaining
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#2C3E50" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.grid}>
              {allLetters.map(([letter, originalCount]) => {
                const remaining = remainingCounts[letter] || 0;
                const used = originalCount - remaining;
                const isFullyUsed = remaining === 0;

                return (
                  <View key={letter} style={styles.tileItem}>
                    <View style={[styles.tile, isFullyUsed && styles.tileUsed]}>
                      <Text style={[styles.letter, isFullyUsed && styles.letterUsed]}>
                        {letter === 'BLANK' ? '★' : letter}
                      </Text>
                      <Text style={[styles.points, isFullyUsed && styles.pointsUsed]}>
                        {letter === 'BLANK' ? '0' : getLetterPoints(letter)}
                      </Text>
                    </View>
                    <View style={[styles.countBadge, isFullyUsed && styles.countBadgeUsed]}>
                      <Text style={styles.countText}>
                        {remaining}/{originalCount}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Shows remaining / total tiles for each letter
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function getLetterPoints(letter: string): number {
  const points: Record<string, number> = {
    A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8,
    K: 5, L: 1, M: 3, N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1,
    U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10
  };
  return points[letter] || 0;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    padding: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
    alignItems: 'center',
    position: 'relative',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2C3E50',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 4,
  },
  content: {
    padding: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  tileItem: {
    alignItems: 'center',
    gap: 8,
  },
  tile: {
    width: 50,
    height: 56,
    backgroundColor: '#FAE5C8',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E8D4B0',
    borderBottomWidth: 5,
    borderBottomColor: '#D4C4A8',
    position: 'relative',
  },
  letter: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1A1A1A',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    letterSpacing: 0.5,
  },
  points: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1A1A1A',
    position: 'absolute',
    bottom: 3,
    right: 5,
  },
  tileUsed: {
    backgroundColor: '#D1D5DB',
    borderColor: '#9CA3AF',
    borderBottomColor: '#6B7280',
    opacity: 0.6,
  },
  letterUsed: {
    color: '#6B7280',
  },
  pointsUsed: {
    color: '#6B7280',
  },
  countBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 40,
    alignItems: 'center',
  },
  countBadgeUsed: {
    backgroundColor: '#6B7280',
  },
  countText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  footer: {
    padding: 16,
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '600',
  },
});
