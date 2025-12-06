import { BoardCell, Tile, TileType, Placement } from '../types/game';

const LETTER_SCORES: Record<string, number> = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8,
  K: 5, L: 1, M: 3, N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1,
  U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10
};

const LETTER_DISTRIBUTION: Record<string, number> = {
  A: 9, B: 2, C: 2, D: 4, E: 12, F: 2, G: 3, H: 2, I: 9, J: 1,
  K: 1, L: 4, M: 2, N: 6, O: 8, P: 2, Q: 1, R: 6, S: 4, T: 6,
  U: 4, V: 2, W: 2, X: 1, Y: 2, Z: 1
};

export function initializeBoard(): BoardCell[][] {
  const board: BoardCell[][] = [];

  for (let row = 0; row < 15; row++) {
    board[row] = [];
    for (let col = 0; col < 15; col++) {
      board[row][col] = {
        type: getBoardCellType(row, col),
        locked: false,
      };
    }
  }

  return board;
}

function getBoardCellType(row: number, col: number): TileType {
  if (row === 7 && col === 7) return 'CENTER';

  const tripleWord = [
    [0, 0], [0, 7], [0, 14],
    [7, 0], [7, 14],
    [14, 0], [14, 7], [14, 14]
  ];

  const doubleWord = [
    [1, 1], [2, 2], [3, 3], [4, 4],
    [1, 13], [2, 12], [3, 11], [4, 10],
    [13, 1], [12, 2], [11, 3], [10, 4],
    [13, 13], [12, 12], [11, 11], [10, 10]
  ];

  const tripleLetter = [
    [1, 5], [1, 9],
    [5, 1], [5, 5], [5, 9], [5, 13],
    [9, 1], [9, 5], [9, 9], [9, 13],
    [13, 5], [13, 9]
  ];

  const doubleLetter = [
    [0, 3], [0, 11],
    [2, 6], [2, 8],
    [3, 0], [3, 7], [3, 14],
    [6, 2], [6, 6], [6, 8], [6, 12],
    [7, 3], [7, 11],
    [8, 2], [8, 6], [8, 8], [8, 12],
    [11, 0], [11, 7], [11, 14],
    [12, 6], [12, 8],
    [14, 3], [14, 11]
  ];

  for (const [r, c] of tripleWord) {
    if (r === row && c === col) return 'TW';
  }

  for (const [r, c] of doubleWord) {
    if (r === row && c === col) return 'DW';
  }

  for (const [r, c] of tripleLetter) {
    if (r === row && c === col) return 'TL';
  }

  for (const [r, c] of doubleLetter) {
    if (r === row && c === col) return 'DL';
  }

  return 'NORMAL';
}

export function generateTileBag(): Tile[] {
  const bag: Tile[] = [];

  for (const [letter, count] of Object.entries(LETTER_DISTRIBUTION)) {
    for (let i = 0; i < count; i++) {
      bag.push({
        letter,
        points: LETTER_SCORES[letter],
      });
    }
  }

  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }

  return bag;
}

export function drawTiles(bag: Tile[], count: number): { tiles: Tile[]; remainingBag: Tile[] } {
  if (!bag || !Array.isArray(bag)) {
    return { tiles: [], remainingBag: [] };
  }
  const drawn = bag.slice(0, count);
  const remaining = bag.slice(count);
  return { tiles: drawn, remainingBag: remaining };
}

export function generateRack(): Tile[] {
  const letters = Object.keys(LETTER_DISTRIBUTION);
  const rack: Tile[] = [];

  for (let i = 0; i < 7; i++) {
    const randomLetter = letters[Math.floor(Math.random() * letters.length)];
    rack.push({
      letter: randomLetter,
      points: LETTER_SCORES[randomLetter],
    });
  }

  return rack;
}

export function calculateWordScore(
  word: string,
  board: BoardCell[][],
  placement: Placement
): number {
  let score = 0;
  let wordMultiplier = 1;

  for (let i = 0; i < word.length; i++) {
    const letter = word[i];
    let letterScore = LETTER_SCORES[letter] || 0;

    const row = placement.direction === 'horizontal' ? placement.row : placement.row + i;
    const col = placement.direction === 'horizontal' ? placement.col + i : placement.col;

    if (row >= 0 && row < 15 && col >= 0 && col < 15) {
      const cell = board[row][col];

      if (!cell.locked) {
        switch (cell.type) {
          case 'DL':
            letterScore *= 2;
            break;
          case 'TL':
            letterScore *= 3;
            break;
          case 'DW':
          case 'CENTER':
            wordMultiplier *= 2;
            break;
          case 'TW':
            wordMultiplier *= 3;
            break;
        }
      }
    }

    score += letterScore;
  }

  return score * wordMultiplier;
}

export function canPlaceWord(
  word: string,
  board: BoardCell[][],
  placement: Placement
): boolean {
  if (word.length === 0) return false;

  for (let i = 0; i < word.length; i++) {
    const row = placement.direction === 'horizontal' ? placement.row : placement.row + i;
    const col = placement.direction === 'horizontal' ? placement.col + i : placement.col;

    if (row < 0 || row >= 15 || col < 0 || col >= 15) {
      return false;
    }

    if (board[row][col].locked && board[row][col].letter !== word[i]) {
      return false;
    }
  }

  return true;
}

export function placeWordOnBoard(
  word: string,
  board: BoardCell[][],
  placement: Placement
): BoardCell[][] {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));

  for (let i = 0; i < word.length; i++) {
    const row = placement.direction === 'horizontal' ? placement.row : placement.row + i;
    const col = placement.direction === 'horizontal' ? placement.col + i : placement.col;

    if (row >= 0 && row < 15 && col >= 0 && col < 15) {
      newBoard[row][col] = {
        ...newBoard[row][col],
        letter: word[i],
        locked: true,
      };
    }
  }

  return newBoard;
}

export function isValidWord(word: string): boolean {
  return word.length >= 2 && /^[A-Z]+$/.test(word);
}

export function isBoardEmpty(board: BoardCell[][]): boolean {
  for (let row = 0; row < 15; row++) {
    for (let col = 0; col < 15; col++) {
      if (board[row][col].locked) {
        return false;
      }
    }
  }
  return true;
}

export function wordCoversCenter(placements: { row: number; col: number }[]): boolean {
  return placements.some(p => p.row === 7 && p.col === 7);
}

export function wordConnectsToBoard(
  placements: { row: number; col: number }[],
  board: BoardCell[][]
): boolean {
  for (const { row, col } of placements) {
    const adjacent = [
      [row - 1, col],
      [row + 1, col],
      [row, col - 1],
      [row, col + 1],
    ];

    for (const [adjRow, adjCol] of adjacent) {
      if (
        adjRow >= 0 &&
        adjRow < 15 &&
        adjCol >= 0 &&
        adjCol < 15 &&
        board[adjRow][adjCol].locked
      ) {
        return true;
      }
    }
  }

  return false;
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function flattenBoard(board: BoardCell[][]): any[] {
  return board.flat();
}

export function unflattenBoard(flatBoard: any[]): BoardCell[][] {
  const board: BoardCell[][] = [];
  for (let i = 0; i < 15; i++) {
    board[i] = flatBoard.slice(i * 15, (i + 1) * 15);
  }
  return board;
}
