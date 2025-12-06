import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Tile } from '../types/game';
import { colors, spacing } from '../theme/colors';

interface Props {
  tiles: Tile[];
  onTilePress: (tile: Tile, index: number) => void;
  selectedTiles?: Tile[];
}

export function TileRack({ tiles, onTilePress, selectedTiles = [] }: Props) {
  return (
    <View style={styles.container}>
      {tiles.map((tile, index) => {
        const isUsed = selectedTiles.some((st) => st === tile);
        return (
          <TileComponent
            key={index}
            tile={tile}
            onPress={() => onTilePress(tile, index)}
            isUsed={isUsed}
          />
        );
      })}
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
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  tile: {
    width: 52,
    height: 58,
    backgroundColor: '#F5E6D3',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#D4C4A8',
  },
  tileUsed: {
    backgroundColor: '#D4C4A8',
    opacity: 0.5,
  },
  letter: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2C5F2D',
  },
  letterUsed: {
    opacity: 0.7,
  },
  points: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2C5F2D',
    position: 'absolute',
    bottom: 3,
    right: 5,
  },
  pointsUsed: {
    opacity: 0.7,
  },
});
