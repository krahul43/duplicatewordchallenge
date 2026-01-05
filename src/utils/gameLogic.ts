import { BoardCell, Placement, Tile, TileType } from '../types/game';

const LETTER_SCORES: Record<string, number> = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8,
  K: 5, L: 1, M: 3, N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1,
  U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10
};

const LETTER_DISTRIBUTION: Record<string, number> = {
  A: 9, B: 2, C: 2, D: 4, E: 12, F: 2, G: 3, H: 2, I: 9, J: 1,
  K: 1, L: 4, M: 2, N: 6, O: 8, P: 2, Q: 1, R: 6, S: 4, T: 6,
  U: 4, V: 2, W: 2, X: 1, Y: 2, Z: 1, BLANK: 2
};

export function getLetterDistribution(): Record<string, number> {
  return { ...LETTER_DISTRIBUTION };
}

export function checkTileAvailability(
  letter: string,
  playerRack: Tile[],
  placedTiles: Placement[],
  lockedBoard: BoardCell[][]
): boolean {
  const maxCount = LETTER_DISTRIBUTION[letter] || 0;
  if (maxCount === 0) return false;

  const rackCount = playerRack.filter(t => t.letter === letter).length;
  const placedCount = placedTiles.filter(t => t.letter === letter).length;

  let lockedCount = 0;
  for (const row of lockedBoard) {
    for (const cell of row) {
      if (cell.letter === letter && cell.locked) {
        lockedCount++;
      }
    }
  }

  const totalUsed = rackCount + placedCount + lockedCount;
  return totalUsed <= maxCount;
}

export function canPlaceTile(
  tile: Tile,
  placedTiles: Placement[],
  lockedBoard: BoardCell[][]
): boolean {
  const maxCount = LETTER_DISTRIBUTION[tile.letter] || 0;
  if (maxCount === 0) return false;

  const alreadyPlaced = placedTiles.filter(t => t.letter === tile.letter).length;

  let lockedCount = 0;
  for (const row of lockedBoard) {
    for (const cell of row) {
      if (cell.letter === tile.letter && cell.locked) {
        lockedCount++;
      }
    }
  }

  const totalUsedOnBoard = alreadyPlaced + lockedCount;
  return totalUsedOnBoard < maxCount;
}

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
        letter: letter === 'BLANK' ? '' : letter,
        points: letter === 'BLANK' ? 0 : LETTER_SCORES[letter],
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

export interface FormedWord {
  word: string;
  startRow: number;
  startCol: number;
  direction: 'horizontal' | 'vertical';
  cells: { row: number; col: number }[];
  color: string;
}

export function getAllFormedWords(
  board: BoardCell[][],
  placedTiles: Placement[]
): FormedWord[] {
  const words: FormedWord[] = [];
  const wordColors = ['#FFB84D', '#FF9D4D', '#FFA84D', '#FFD64D', '#FFAA4D'];
  let colorIndex = 0;

  const fullBoard = board.map(row => row.map(cell => ({ ...cell })));
  for (const placement of placedTiles) {
    if (placement.row >= 0 && placement.row < 15 && placement.col >= 0 && placement.col < 15) {
      fullBoard[placement.row][placement.col] = {
        ...fullBoard[placement.row][placement.col],
        letter: placement.letter,
      };
    }
  }

  for (let row = 0; row < 15; row++) {
    let currentWord = '';
    let startCol = -1;
    const cells: { row: number; col: number }[] = [];

    for (let col = 0; col < 15; col++) {
      const cell = fullBoard[row][col];
      if (cell.letter) {
        if (currentWord === '') {
          startCol = col;
        }
        currentWord += cell.letter;
        cells.push({ row, col });
      } else {
        if (currentWord.length >= 2) {
          words.push({
            word: currentWord,
            startRow: row,
            startCol,
            direction: 'horizontal',
            cells: [...cells],
            color: wordColors[colorIndex % wordColors.length],
          });
          colorIndex++;
        }
        currentWord = '';
        cells.length = 0;
      }
    }
    if (currentWord.length >= 2) {
      words.push({
        word: currentWord,
        startRow: row,
        startCol,
        direction: 'horizontal',
        cells: [...cells],
        color: wordColors[colorIndex % wordColors.length],
      });
      colorIndex++;
    }
  }

  for (let col = 0; col < 15; col++) {
    let currentWord = '';
    let startRow = -1;
    const cells: { row: number; col: number }[] = [];

    for (let row = 0; row < 15; row++) {
      const cell = fullBoard[row][col];
      if (cell.letter) {
        if (currentWord === '') {
          startRow = row;
        }
        currentWord += cell.letter;
        cells.push({ row, col });
      } else {
        if (currentWord.length >= 2) {
          words.push({
            word: currentWord,
            startRow,
            startCol: col,
            direction: 'vertical',
            cells: [...cells],
            color: wordColors[colorIndex % wordColors.length],
          });
          colorIndex++;
        }
        currentWord = '';
        cells.length = 0;
      }
    }
    if (currentWord.length >= 2) {
      words.push({
        word: currentWord,
        startRow,
        startCol: col,
        direction: 'vertical',
        cells: [...cells],
        color: wordColors[colorIndex % wordColors.length],
      });
      colorIndex++;
    }
  }

  return words;
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

export function getNewTilesFromPlacement(
  placements: { row: number; col: number; letter: string }[],
  board: BoardCell[][]
): { row: number; col: number; letter: string }[] {
  return placements.filter(p => !board[p.row][p.col].locked);
}

export function extractMainWord(
  placements: { row: number; col: number; letter: string }[],
  board: BoardCell[][],
  direction: 'horizontal' | 'vertical'
): { word: string; start: { row: number; col: number }; positions: { row: number; col: number; letter: string }[] } {
  if (placements.length === 0) {
    return { word: '', start: { row: 0, col: 0 }, positions: [] };
  }

  const sorted = [...placements].sort((a, b) =>
    direction === 'horizontal' ? a.col - b.col : a.row - b.row
  );

  let start = { ...sorted[0] };
  let positions: { row: number; col: number; letter: string }[] = [];

  if (direction === 'horizontal') {
    while (start.col > 0 && board[start.row][start.col - 1].locked) {
      start.col--;
    }

    let col = start.col;
    while (col < 15 && (board[start.row][col].locked || placements.some(p => p.row === start.row && p.col === col))) {
      const placement = placements.find(p => p.row === start.row && p.col === col);
      const letter = placement?.letter || board[start.row][col].letter || '';
      positions.push({ row: start.row, col, letter });
      col++;
    }
  } else {
    while (start.row > 0 && board[start.row - 1][start.col].locked) {
      start.row--;
    }

    let row = start.row;
    while (row < 15 && (board[row][start.col].locked || placements.some(p => p.row === row && p.col === start.col))) {
      const placement = placements.find(p => p.row === row && p.col === start.col);
      const letter = placement?.letter || board[row][start.col].letter || '';
      positions.push({ row, col: start.col, letter });
      row++;
    }
  }

  return {
    word: positions.map(p => p.letter).join(''),
    start,
    positions
  };
}

export function findSideWords(
  placements: { row: number; col: number; letter: string }[],
  board: BoardCell[][]
): { word: string; positions: { row: number; col: number; letter: string }[] }[] {
  const sideWords: { word: string; positions: { row: number; col: number; letter: string }[] }[] = [];
  const newTiles = getNewTilesFromPlacement(placements, board);

  const isHorizontal = placements.every(p => p.row === placements[0].row);
  const perpDirection = isHorizontal ? 'vertical' : 'horizontal';

  for (const tile of newTiles) {
    let positions: { row: number; col: number; letter: string }[] = [];

    if (perpDirection === 'vertical') {
      let startRow = tile.row;
      while (startRow > 0 && board[startRow - 1][tile.col].locked) {
        startRow--;
      }

      let row = startRow;
      while (row < 15 && (board[row][tile.col].locked || (row === tile.row && tile.col === tile.col))) {
        const letter = row === tile.row ? tile.letter : board[row][tile.col].letter || '';
        positions.push({ row, col: tile.col, letter });
        row++;
      }
    } else {
      let startCol = tile.col;
      while (startCol > 0 && board[tile.row][startCol - 1].locked) {
        startCol--;
      }

      let col = startCol;
      while (col < 15 && (board[tile.row][col].locked || (col === tile.col && tile.row === tile.row))) {
        const letter = col === tile.col ? tile.letter : board[tile.row][col].letter || '';
        positions.push({ row: tile.row, col, letter });
        col++;
      }
    }

    if (positions.length > 1) {
      sideWords.push({
        word: positions.map(p => p.letter).join(''),
        positions
      });
    }
  }

  return sideWords;
}

export function calculateTotalScore(
  placements: { row: number; col: number; letter: string; points: number }[],
  board: BoardCell[][]
): number {
  if (placements.length === 0) return 0;

  let totalScore = 0;

  const isHorizontal = placements.every(p => p.row === placements[0].row);
  const direction = isHorizontal ? 'horizontal' : 'vertical';

  const mainWord = extractMainWord(placements, board, direction);
  let mainWordScore = 0;
  let mainWordMultiplier = 1;

  for (const pos of mainWord.positions) {
    const placement = placements.find(p => p.row === pos.row && p.col === pos.col);
    const cell = board[pos.row][pos.col];

    let letterScore = placement?.points || LETTER_SCORES[pos.letter] || 0;

    if (placement && !cell.locked) {
      switch (cell.type) {
        case 'DL':
          letterScore *= 2;
          break;
        case 'TL':
          letterScore *= 3;
          break;
        case 'DW':
        case 'CENTER':
          mainWordMultiplier *= 2;
          break;
        case 'TW':
          mainWordMultiplier *= 3;
          break;
      }
    }

    mainWordScore += letterScore;
  }

  mainWordScore *= mainWordMultiplier;
  totalScore += mainWordScore;

  const sideWords = findSideWords(placements, board);
  for (const sideWord of sideWords) {
    let sideScore = 0;
    let sideMultiplier = 1;

    for (const pos of sideWord.positions) {
      const placement = placements.find(p => p.row === pos.row && p.col === pos.col);
      const cell = board[pos.row][pos.col];

      let letterScore = placement?.points || LETTER_SCORES[pos.letter] || 0;

      if (placement && !cell.locked) {
        switch (cell.type) {
          case 'DL':
            letterScore *= 2;
            break;
          case 'TL':
            letterScore *= 3;
            break;
          case 'DW':
          case 'CENTER':
            sideMultiplier *= 2;
            break;
          case 'TW':
            sideMultiplier *= 3;
            break;
        }
      }

      sideScore += letterScore;
    }

    sideScore *= sideMultiplier;
    totalScore += sideScore;
  }

  const usedAllTiles = placements.length === 7;
  if (usedAllTiles) {
    totalScore += 50;
  }

  return totalScore;
}

export function calculateRemainingTilesValue(tiles: Tile[]): number {
  return tiles.reduce((sum, tile) => sum + tile.points, 0);
}

export function calculateFinalScores(
  player1Score: number,
  player2Score: number,
  player1RemainingTiles: Tile[],
  player2RemainingTiles: Tile[],
  playerWhoFinishedId?: string,
  player1Id?: string
): {
  player1Final: number;
  player2Final: number;
  player1Penalty: number;
  player2Penalty: number;
} {
  const player1RemainingValue = calculateRemainingTilesValue(player1RemainingTiles);
  const player2RemainingValue = calculateRemainingTilesValue(player2RemainingTiles);

  let player1Final = player1Score - player1RemainingValue;
  let player2Final = player2Score - player2RemainingValue;

  if (playerWhoFinishedId && player1Id) {
    if (playerWhoFinishedId === player1Id) {
      player1Final += player2RemainingValue;
    } else {
      player2Final += player1RemainingValue;
    }
  }

  return {
    player1Final,
    player2Final,
    player1Penalty: player1RemainingValue,
    player2Penalty: player2RemainingValue
  };
}
