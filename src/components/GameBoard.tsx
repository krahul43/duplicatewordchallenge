import React, { useCallback } from 'react';
import { Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { BoardCell as BoardCellType } from '../types/game';
import { FormedWord } from '../utils/gameLogic';

interface Props {
  board: BoardCellType[][];
  onCellPress?: (row: number, col: number) => void;
  placedTiles?: { row: number; col: number; letter: string; points: number }[];
  selectedCell?: { row: number; col: number } | null;
  hasSelectedTiles?: boolean;
  onMeasureBoard?: (layout: { x: number; y: number; width: number; height: number }) => void;
  hoveredCell?: { row: number; col: number } | null;
  formedWords?: FormedWord[];
  focusCell?: { row: number; col: number } | null;
  onTileDragFromBoard?: (tile: { row: number; col: number; letter: string; points: number }, x: number, y: number) => void;
  onTileDragEndFromBoard?: (tile: { row: number; col: number; letter: string; points: number }, x: number, y: number) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const AVAILABLE_HEIGHT = Platform.OS === 'web' ? SCREEN_HEIGHT - 450 : SCREEN_HEIGHT - 500;
const AVAILABLE_WIDTH = SCREEN_WIDTH - 24;
const MAX_SIZE = Math.min(AVAILABLE_WIDTH, AVAILABLE_HEIGHT);
const CELL_SIZE = Math.floor(MAX_SIZE / 15);

export function GameBoard({ board, onCellPress, placedTiles = [], selectedCell, hasSelectedTiles = false, onMeasureBoard, hoveredCell = null, formedWords = [], focusCell = null, onTileDragFromBoard, onTileDragEndFromBoard }: Props) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);

  React.useEffect(() => {
    if (focusCell) {
      const cellCenterX = (focusCell.col - 7.5) * CELL_SIZE;

      const targetScale = 1.15;
      scale.value = withTiming(targetScale, { duration: 200, easing: Easing.out(Easing.ease) });
      savedScale.value = targetScale;

      translateX.value = withTiming(-cellCenterX * 0.15, { duration: 200, easing: Easing.out(Easing.ease) });
      savedTranslateX.value = -cellCenterX * 0.15;
    }
  }, [focusCell]);

  React.useEffect(() => {
    if (hoveredCell) {
      if (scale.value !== 1 || translateX.value !== 0) {
        scale.value = withTiming(1, { duration: 150 });
        translateX.value = withTiming(0, { duration: 150 });
        savedScale.value = 1;
        savedTranslateX.value = 0;
      }
      setTimeout(() => handleLayout(), 200);
    }
  }, [hoveredCell, handleLayout]);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = Math.max(1, Math.min(savedScale.value * event.scale, 3));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const panGesture = Gesture.Pan()
    .minPointers(2)
    .onUpdate((event) => {
      if (scale.value > 1) {
        const maxTranslate = ((scale.value - 1) * MAX_SIZE) / 2;
        translateX.value = Math.max(-maxTranslate, Math.min(maxTranslate, savedTranslateX.value + event.translationX));
      }
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
    });

  const composedGesture = Gesture.Race(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));

  const boardRef = React.useRef<any>(null);
  const containerRef = React.useRef<any>(null);

  const handleLayout = useCallback(() => {
    if (onMeasureBoard && containerRef.current) {
      setTimeout(() => {
        containerRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
          onMeasureBoard({ x, y, width, height });
        });
      }, 150);
    }
  }, [onMeasureBoard]);

  React.useEffect(() => {
    handleLayout();
  }, [handleLayout]);

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View
        ref={boardRef}
        style={[styles.boardWrapper, animatedStyle]}
        onLayout={handleLayout}
      >
        <View ref={containerRef} style={styles.container}>
          {board.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((cell, colIndex) => {
                const placedTile = placedTiles.find(t => t.row === rowIndex && t.col === colIndex);
                const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
                const isHovered = hoveredCell?.row === rowIndex && hoveredCell?.col === colIndex;
                const canPlace = hasSelectedTiles && !cell.locked && !placedTile;

                const wordsAtCell = formedWords.filter(word =>
                  word.cells.some(c => c.row === rowIndex && c.col === colIndex)
                );
                const wordColor = wordsAtCell.length > 0 ? wordsAtCell[0].color : undefined;

                return (
                  <BoardCell
                    key={`${rowIndex}-${colIndex}`}
                    cell={cell}
                    rowIndex={rowIndex}
                    colIndex={colIndex}
                    onPress={onCellPress}
                    placedTile={placedTile}
                    isSelected={isSelected}
                    isHovered={isHovered}
                    canPlace={canPlace}
                    wordColor={wordColor}
                    onTileDragFromBoard={onTileDragFromBoard}
                    onTileDragEndFromBoard={onTileDragEndFromBoard}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

interface BoardCellProps {
  cell: BoardCellType;
  rowIndex: number;
  colIndex: number;
  onPress?: (row: number, col: number) => void;
  placedTile?: { letter: string; points: number };
  isSelected?: boolean;
  isHovered?: boolean;
  canPlace?: boolean;
  wordColor?: string;
  onTileDragFromBoard?: (tile: { row: number; col: number; letter: string; points: number }, x: number, y: number) => void;
  onTileDragEndFromBoard?: (tile: { row: number; col: number; letter: string; points: number }, x: number, y: number) => void;
}

function BoardCell({ cell, rowIndex, colIndex, onPress, placedTile, isSelected, isHovered, canPlace, wordColor, onTileDragFromBoard, onTileDragEndFromBoard }: BoardCellProps) {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const tileTranslateX = useSharedValue(0);
  const tileTranslateY = useSharedValue(0);
  const tileScale = useSharedValue(1);
  const tileOpacity = useSharedValue(1);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const [prevPlacedTile, setPrevPlacedTile] = React.useState(placedTile);

  React.useEffect(() => {
    if (!isDragging.value) {
      tileTranslateX.value = 0;
      tileTranslateY.value = 0;
      tileScale.value = 1;
      tileOpacity.value = 1;
    }
    setPrevPlacedTile(placedTile);
  }, [placedTile]);

  React.useEffect(() => {
    if (isHovered && canPlace) {
      glowOpacity.value = withTiming(1, { duration: 150 });
    } else {
      glowOpacity.value = withTiming(0, { duration: 150 });
    }
  }, [isHovered, canPlace]);

  const cellStyle = [
    styles.cell,
    wordColor && (cell.locked || placedTile) ? { backgroundColor: wordColor } : getCellBackgroundStyle(cell),
    isSelected && styles.selectedCell,
    placedTile && styles.cellWithNewTile,
    canPlace && styles.cellCanPlace,
  ];

  const handlePress = () => {
    if (onPress && !cell.locked && !placedTile) {
      onPress(rowIndex, colIndex);
    }
  };

  const tilePanGesture = Gesture.Pan()
    .enabled(!!placedTile && !!onTileDragFromBoard && !!onTileDragEndFromBoard)
    .onStart((event) => {
      isDragging.value = true;
      startX.value = event.absoluteX;
      startY.value = event.absoluteY;
      tileScale.value = 1.1;
    })
    .onUpdate((event) => {
      tileTranslateX.value = event.translationX;
      tileTranslateY.value = event.translationY;

      if (placedTile && onTileDragFromBoard) {
        const currentX = startX.value + event.translationX;
        const currentY = startY.value + event.translationY;
        const tileData = { row: rowIndex, col: colIndex, letter: placedTile.letter, points: placedTile.points };
        runOnJS(onTileDragFromBoard)(tileData, currentX, currentY);
      }
    })
    .onEnd((event) => {
      isDragging.value = false;

      if (placedTile && onTileDragEndFromBoard) {
        const finalX = startX.value + event.translationX;
        const finalY = startY.value + event.translationY;
        const tileData = { row: rowIndex, col: colIndex, letter: placedTile.letter, points: placedTile.points };
        runOnJS(onTileDragEndFromBoard)(tileData, finalX, finalY);
      }

      tileTranslateX.value = 0;
      tileTranslateY.value = 0;
      tileScale.value = 1;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const tileAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tileTranslateX.value },
      { translateY: tileTranslateY.value },
      { scale: tileScale.value }
    ],
    opacity: tileOpacity.value,
  }));

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={!onPress || cell.locked}
      activeOpacity={0.7}
    >
      <Animated.View style={[cellStyle, animatedStyle]}>
        {canPlace && isHovered && (
          <Animated.View style={[styles.dropGlow, glowStyle]} />
        )}
        {placedTile ? (
          <GestureDetector gesture={tilePanGesture}>
            <Animated.View style={[styles.tileContainer, tileAnimatedStyle]}>
              <Text style={styles.letter}>{placedTile.letter === '' ? '★' : placedTile.letter}</Text>
              <Text style={styles.points}>{placedTile.points}</Text>
            </Animated.View>
          </GestureDetector>
        ) : cell.letter ? (
          <View style={styles.tileContainer}>
            <Text style={styles.letter}>{cell.letter === '' ? '★' : cell.letter}</Text>
          </View>
        ) : (
          <Text style={styles.label}>{getCellLabel(cell.type)}</Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

function getCellBackgroundStyle(cell: BoardCellType) {
  if (cell.locked) {
    return {
      backgroundColor: '#F9B851',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 4,
      borderRadius: 6,
    };
  }

  switch (cell.type) {
    case 'DL':
      return { backgroundColor: '#87CEEB', borderRadius: 6 };
    case 'TL':
      return { backgroundColor: '#5CB85C', borderRadius: 6 };
    case 'DW':
      return { backgroundColor: '#FFB6C1', borderRadius: 6 };
    case 'TW':
      return { backgroundColor: '#FF1493', borderRadius: 6 };
    case 'CENTER':
      return { backgroundColor: '#FFB6C1', borderRadius: 6 };
    default:
      return { backgroundColor: '#F5F5F5', borderRadius: 6 };
  }
}

function getCellLabel(type: string): string {
  switch (type) {
    case 'DL': return 'DL';
    case 'TL': return 'TL';
    case 'DW': return 'DW';
    case 'TW': return 'TW';
    case 'CENTER': return '★';
    default: return '';
  }
}

const styles = StyleSheet.create({
  boardWrapper: {
    alignSelf: 'center',
  },
  container: {
    backgroundColor: '#fff',
    padding: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 2,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    margin: 1,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  selectedCell: {
    borderWidth: 3,
    borderColor: '#FFD700',
    backgroundColor: '#FFFACD',
    transform: [{ scale: 1.05 }],
  },
  cellWithNewTile: {
    backgroundColor: '#F9B851',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 5,
    borderRadius: 8,
  },
  cellCanPlace: {
    borderWidth: 2,
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  dropGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    backgroundColor: '#10B981',
    borderRadius: 8,
    opacity: 0.5,
  },
  tileContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
    backgroundColor: '#FAE5C8',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E8D4B0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  letter: {
    fontSize: Math.max(14, CELL_SIZE * 0.55),
    fontWeight: '800',
    color: '#2C3E50',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  points: {
    fontSize: Math.max(7, CELL_SIZE * 0.22),
    fontWeight: '700',
    color: '#2C3E50',
    position: 'absolute',
    bottom: 2,
    right: 3,
  },
  label: {
    fontSize: Math.max(7, CELL_SIZE * 0.26),
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    zIndex: 1,
  },
});
