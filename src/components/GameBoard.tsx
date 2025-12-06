import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BoardCell as BoardCellType } from '../types/game';
import { colors } from '../theme/colors';

interface Props {
  board: BoardCellType[][];
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const CELL_SIZE = Math.floor((SCREEN_WIDTH - 32) / 15);

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
    return { backgroundColor: colors.tile };
  }

  switch (cell.type) {
    case 'DL':
      return { backgroundColor: colors.premium.doubleLetter };
    case 'TL':
      return { backgroundColor: colors.premium.tripleLetter };
    case 'DW':
      return { backgroundColor: colors.premium.doubleWord };
    case 'TW':
      return { backgroundColor: colors.premium.tripleWord };
    case 'CENTER':
      return { backgroundColor: colors.premium.doubleWord };
    default:
      return { backgroundColor: colors.surface };
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
    backgroundColor: colors.background,
    padding: 2,
    borderRadius: 8,
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
    borderColor: colors.muted + '40',
  },
  letter: {
    fontSize: CELL_SIZE * 0.5,
    fontWeight: '700',
    color: colors.tileText,
  },
  label: {
    fontSize: CELL_SIZE * 0.2,
    fontWeight: '600',
    color: colors.text + '80',
  },
});
