import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { Tile } from '../types/game';

interface Props {
  visible: boolean;
  onClose: () => void;
  tileBag: Tile[];
}

export function TileBagViewer({ visible, onClose, tileBag }: Props) {
  const letterCounts = tileBag.reduce((acc, tile) => {
    acc[tile.letter] = (acc[tile.letter] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedLetters = Object.entries(letterCounts).sort(([a], [b]) => {
    if (a === 'BLANK') return 1;
    if (b === 'BLANK') return -1;
    return a.localeCompare(b);
  });

  const totalTiles = tileBag.length;

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
            <Text style={styles.subtitle}>{totalTiles} tiles remaining</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#2C3E50" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.grid}>
              {sortedLetters.map(([letter, count]) => (
                <View key={letter} style={styles.tileItem}>
                  <View style={styles.tile}>
                    <Text style={styles.letter}>
                      {letter === 'BLANK' ? '★' : letter}
                    </Text>
                    <Text style={styles.points}>
                      {letter === 'BLANK' ? '0' : getLetterPoints(letter)}
                    </Text>
                  </View>
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>×{count}</Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Letters are drawn from a shared tile bag
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
    backgroundColor: '#F5E6D3',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#D4C4A8',
    borderBottomWidth: 4,
    borderBottomColor: '#C4B498',
    position: 'relative',
  },
  letter: {
    fontSize: 28,
    fontWeight: '900',
    color: '#2C3E50',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  points: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2C3E50',
    position: 'absolute',
    bottom: 3,
    right: 5,
  },
  countBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 40,
    alignItems: 'center',
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
