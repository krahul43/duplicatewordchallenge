import React from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { BoardCell as BoardCellType } from '../types/game';
import { colors } from '../theme/colors';

interface Props {
  board: BoardCellType[][];
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const AVAILABLE_HEIGHT = Platform.OS === 'web' ? SCREEN_HEIGHT - 450 : SCREEN_HEIGHT - 500;
const AVAILABLE_WIDTH = SCREEN_WIDTH - 24;
const MAX_SIZE = Math.min(AVAILABLE_WIDTH, AVAILABLE_HEIGHT);
const CELL_SIZE = Math.floor(MAX_SIZE / 15);

export function GameBoard({ board }: Props) {
  return (
    <View style={styles.container}>
      {board.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((cell, colIndex) => (
            <BoardCell key={`${rowIndex}-${colIndex}`} cell={cell} />
          ))}
        </View>
      ))}
    </View>
  );
}

function BoardCell({ cell }: { cell: BoardCellType }) {
  const cellStyle = [
    styles.cell,
    getCellBackgroundStyle(cell),
  ];

  return (
    <View style={cellStyle}>
      {cell.letter ? (
        <>
          <Text style={styles.letter}>{cell.letter}</Text>
        </>
      ) : (
        <Text style={styles.label}>{getCellLabel(cell.type)}</Text>
      )}
    </View>
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
  letter: {
    fontSize: Math.max(12, CELL_SIZE * 0.5),
    fontWeight: '700',
    color: '#2C5F2D',
  },
  label: {
    fontSize: Math.max(7, CELL_SIZE * 0.25),
    fontWeight: '700',
    color: '#fff',
  },
});
