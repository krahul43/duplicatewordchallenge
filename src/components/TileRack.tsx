import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { spacing } from '../theme/colors';
import { Tile } from '../types/game';

interface Props {
  tiles: Tile[];
  onTilePress: (tile: Tile, index: number) => void;
  selectedTiles?: Tile[];
}

export function TileRack({ tiles, onTilePress, selectedTiles = [] }: Props) {
  // Temporary test data
  const testTiles: Tile[] = [
    { letter: 'A', points: 1 },
    { letter: 'B', points: 3 },
    { letter: 'C', points: 3 },
    { letter: 'D', points: 2 },
    { letter: 'E', points: 1 },
    { letter: 'F', points: 4 },
    { letter: 'G', points: 2 },
  ];

  console.log('TileRack received tiles:', tiles);
  const tilesToShow = tiles.length > 0 ? tiles : testTiles;

  return (
    <View style={styles.container}>
      {tilesToShow.length === 0 ? (
        <Text style={styles.emptyMessage}>Loading tiles...</Text>
      ) : (
        tilesToShow.map((tile, index) => {
          const isUsed = selectedTiles.some((st) => st === tile);
          return (
            <TileComponent
              key={index}
              tile={tile}
              onPress={() => onTilePress(tile, index)}
              isUsed={isUsed}
            />
          );
        })
      )}
    </View>
  );
}

interface TileProps {
  tile: Tile;
  onPress: () => void;
  isUsed?: boolean;
}

function TileComponent({ tile, onPress, isUsed = false }: TileProps) {
  const scale = useSharedValue(1);

  const tap = Gesture.Tap()
    .onBegin(() => {
      scale.value = withSpring(0.9);
    })
    .onFinalize(() => {
      scale.value = withSpring(1);
      runOnJS(onPress)();
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={tap}>
      <Animated.View style={[styles.tile, isUsed && styles.tileUsed, animatedStyle]}>
        <Text style={[styles.letter, isUsed && styles.letterUsed]}>{tile.letter}</Text>
        <Text style={[styles.points, isUsed && styles.pointsUsed]}>{tile.points}</Text>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    minHeight: 90,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderTopWidth: 2,
    borderTopColor: 'rgba(255,255,255,0.4)',
    borderRadius: 12,
  },
  tile: {
    width: 54,
    height: 62,
    backgroundColor: '#F5E6D3',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#D4C4A8',
    borderBottomWidth: 4,
    borderBottomColor: '#C4B498',
    position: 'relative',
  },
  tileUsed: {
    backgroundColor: '#D4C4A8',
    opacity: 0.6,
    transform: [{ scale: 0.95 }],
  },
  letter: {
    fontSize: 34,
    fontWeight: '900',
    color: '#2C3E50',
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  letterUsed: {
    opacity: 0.7,
  },
  points: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2C3E50',
    position: 'absolute',
    bottom: 4,
    right: 6,
  },
  pointsUsed: {
    opacity: 0.7,
  },
  emptyMessage: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
