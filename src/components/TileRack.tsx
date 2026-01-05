import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { spacing } from '../theme/colors';
import { BoardCell, Tile } from '../types/game';
import { canPlaceTile } from '../utils/gameLogic';

interface Props {
  tiles: Tile[];
  onTilePress: (tile: Tile, index: number) => void;
  onTileDrag?: (tile: Tile, index: number, x: number, y: number) => void;
  onTileDragEnd?: (tile: Tile, index: number, x: number, y: number) => void;
  selectedTiles?: Tile[];
  placedTiles?: { row: number; col: number; letter: string; points: number }[];
  board?: BoardCell[][];
}

export function TileRack({ tiles, onTilePress, onTileDrag, onTileDragEnd, selectedTiles = [], placedTiles = [], board }: Props) {
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

  const availableTiles: Tile[] = [];
  const usedCount: { [key: string]: number } = {};

  placedTiles.forEach(pt => {
    usedCount[pt.letter] = (usedCount[pt.letter] || 0) + 1;
  });

  tilesToShow.forEach(tile => {
    const timesUsed = usedCount[tile.letter] || 0;
    const timesAlreadyAdded = availableTiles.filter(t => t.letter === tile.letter).length;
    const totalAvailable = tilesToShow.filter(t => t.letter === tile.letter).length;

    if (timesAlreadyAdded < (totalAvailable - timesUsed)) {
      availableTiles.push(tile);
    }
  });

  return (
    <View style={styles.container}>
      {availableTiles.length === 0 ? (
        <Text style={styles.emptyMessage}>Loading tiles...</Text>
      ) : (
        availableTiles.map((tile, index) => {
          const isUsed = selectedTiles.some((st) => st === tile);
          const isDisabled = board ? !canPlaceTile(tile, placedTiles, board) : false;
          return (
            <DraggableTile
              key={`${tile.letter}-${index}`}
              tile={tile}
              index={index}
              onPress={() => onTilePress(tile, index)}
              onDrag={onTileDrag}
              onDragEnd={onTileDragEnd}
              isUsed={isUsed}
              isDisabled={isDisabled}
            />
          );
        })
      )}
    </View>
  );
}

interface DraggableTileProps {
  tile: Tile;
  index: number;
  onPress: () => void;
  onDrag?: (tile: Tile, index: number, x: number, y: number) => void;
  onDragEnd?: (tile: Tile, index: number, x: number, y: number) => void;
  isUsed?: boolean;
  isDisabled?: boolean;
}

function DraggableTile({ tile, index, onPress, onDrag, onDragEnd, isUsed = false, isDisabled = false }: DraggableTileProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(0);
  const opacity = useSharedValue(1);
  const isDragging = useSharedValue(false);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const pan = Gesture.Pan()
    .enabled(!isDisabled)
    .onStart((event) => {
      isDragging.value = true;
      startX.value = event.absoluteX;
      startY.value = event.absoluteY;
      scale.value = withSpring(1.3, { damping: 12, stiffness: 200 });
      zIndex.value = 1000;
      opacity.value = withTiming(0.9, { duration: 150 });
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;

      if (onDrag) {
        const currentX = startX.value + event.translationX;
        const currentY = startY.value + event.translationY;
        runOnJS(onDrag)(tile, index, currentX, currentY);
      }
    })
    .onEnd((event) => {
      isDragging.value = false;
      const wasDragged = Math.abs(event.translationX) > 30 || Math.abs(event.translationY) > 30;

      if (onDragEnd && wasDragged) {
        const finalX = startX.value + event.translationX;
        const finalY = startY.value + event.translationY;
        runOnJS(onDragEnd)(tile, index, finalX, finalY);
      }

      translateX.value = withSpring(0, { damping: 20, stiffness: 140 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 140 });
      scale.value = withSpring(1, { damping: 12, stiffness: 180 });
      opacity.value = withTiming(1, { duration: 150 });
      zIndex.value = 0;
    });

  const tap = Gesture.Tap()
    .enabled(!isDisabled)
    .maxDuration(250)
    .onStart(() => {
      if (!isDragging.value) {
        scale.value = withSpring(0.85);
      }
    })
    .onEnd(() => {
      if (!isDragging.value) {
        scale.value = withSpring(1);
        runOnJS(onPress)();
      }
    });

  const gesture = Gesture.Exclusive(pan, tap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    zIndex: zIndex.value,
    opacity: opacity.value,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.tile, isUsed && styles.tileUsed, isDisabled && styles.tileDisabled, animatedStyle]}>
        {isDisabled && <View style={styles.disabledOverlay} />}
        <Text style={[styles.letter, isUsed && styles.letterUsed, isDisabled && styles.letterDisabled]}>{tile.letter}</Text>
        <Text style={[styles.points, isUsed && styles.pointsUsed, isDisabled && styles.pointsDisabled]}>{tile.points}</Text>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    minHeight: 90,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderTopWidth: 2,
    borderTopColor: 'rgba(255,255,255,0.4)',
    borderRadius: 12,
  },
  tile: {
    width: 52,
    height: 58,
    backgroundColor: '#FAE5C8',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#E8D4B0',
    borderBottomWidth: 5,
    borderBottomColor: '#D4C4A8',
    position: 'relative',
  },
  tileUsed: {
    backgroundColor: '#C9B896',
    opacity: 0.5,
    transform: [{ scale: 0.92 }],
  },
  letter: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1A1A1A',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    letterSpacing: 0.5,
  },
  letterUsed: {
    opacity: 0.6,
  },
  points: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A1A1A',
    position: 'absolute',
    bottom: 3,
    right: 5,
  },
  pointsUsed: {
    opacity: 0.6,
  },
  tileDisabled: {
    backgroundColor: '#9E9E9E',
    borderBottomColor: '#757575',
    opacity: 0.6,
  },
  disabledOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(100, 100, 100, 0.4)',
    borderRadius: 10,
  },
  letterDisabled: {
    color: '#4A4A4A',
    opacity: 0.7,
  },
  pointsDisabled: {
    color: '#4A4A4A',
    opacity: 0.7,
  },
  emptyMessage: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
