import React from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, TouchableOpacity } from 'react-native';
import { BoardCell as BoardCellType } from '../types/game';
import { colors } from '../theme/colors';

interface Props {
  board: BoardCellType[][];
  onCellPress?: (row: number, col: number) => void;
  placedTiles?: { row: number; col: number; letter: string; points: number }[];
  selectedCell?: { row: number; col: number } | null;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const AVAILABLE_HEIGHT = Platform.OS === 'web' ? SCREEN_HEIGHT - 450 : SCREEN_HEIGHT - 500;
const AVAILABLE_WIDTH = SCREEN_WIDTH - 24;
const MAX_SIZE = Math.min(AVAILABLE_WIDTH, AVAILABLE_HEIGHT);
const CELL_SIZE = Math.floor(MAX_SIZE / 15);

export function GameBoard({ board, onCellPress, placedTiles = [], selectedCell }: Props) {
  return (
    <View style={styles.container}>
      {board.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((cell, colIndex) => {
            const placedTile = placedTiles.find(t => t.row === rowIndex && t.col === colIndex);
            const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
            return (
              <BoardCell
                key={`${rowIndex}-${colIndex}`}
                cell={cell}
                rowIndex={rowIndex}
                colIndex={colIndex}
                onPress={onCellPress}
                placedTile={placedTile}
                isSelected={isSelected}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

interface BoardCellProps {
  cell: BoardCellType;
  rowIndex: number;
  colIndex: number;
  onPress?: (row: number, col: number) => void;
  placedTile?: { letter: string; points: number };
  isSelected?: boolean;
}

function BoardCell({ cell, rowIndex, colIndex, onPress, placedTile, isSelected }: BoardCellProps) {
  const cellStyle = [
    styles.cell,
    getCellBackgroundStyle(cell),
    isSelected && styles.selectedCell,
    placedTile && styles.cellWithNewTile,
  ];

  const handlePress = () => {
    if (onPress && !cell.locked) {
      onPress(rowIndex, colIndex);
    }
  };

  return (
    <TouchableOpacity
      style={cellStyle}
      onPress={handlePress}
      disabled={!onPress || cell.locked}
      activeOpacity={0.7}
    >
      {placedTile ? (
        <>
          <Text style={styles.letter}>{placedTile.letter}</Text>
          <Text style={styles.points}>{placedTile.points}</Text>
        </>
      ) : cell.letter ? (
        <>
          <Text style={styles.letter}>{cell.letter}</Text>
        </>
      ) : (
        <Text style={styles.label}>{getCellLabel(cell.type)}</Text>
      )}
    </TouchableOpacity>
  );
}

function getCellBackgroundStyle(cell: BoardCellType) {
  if (cell.locked) {
    return { backgroundColor: '#90EE90' };
  }

  switch (cell.type) {
    case 'DL':
      return { backgroundColor: '#87CEEB' };
    case 'TL':
      return { backgroundColor: '#008B8B' };
    case 'DW':
      return { backgroundColor: '#FFB6C1' };
    case 'TW':
      return { backgroundColor: '#FF1493' };
    case 'CENTER':
      return { backgroundColor: '#FFB6C1' };
    default:
      return { backgroundColor: '#E8E8E8' };
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
  container: {
    backgroundColor: '#fff',
    padding: 2,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#ccc',
  },
  selectedCell: {
    borderWidth: 2,
    borderColor: '#FFD700',
    backgroundColor: '#FFFACD',
  },
  cellWithNewTile: {
    backgroundColor: '#F5E6D3',
  },
  letter: {
    fontSize: Math.max(12, CELL_SIZE * 0.5),
    fontWeight: '700',
    color: '#2C5F2D',
  },
  points: {
    fontSize: Math.max(6, CELL_SIZE * 0.2),
    fontWeight: '700',
    color: '#2C5F2D',
    position: 'absolute',
    bottom: 1,
    right: 2,
  },
  label: {
    fontSize: Math.max(7, CELL_SIZE * 0.25),
    fontWeight: '700',
    color: '#fff',
  },
});
