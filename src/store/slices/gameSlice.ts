import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Game, Round, Tile } from '../../types/game';

interface GameState {
  currentGame: Game | null;
  currentRound: Round | null;
  myRack: Tile[];
  selectedTiles: Tile[];
  loading: boolean;
  error: string | null;
  timeRemaining: number;
}

const initialState: GameState = {
  currentGame: null,
  currentRound: null,
  myRack: [],
  selectedTiles: [],
  loading: false,
  error: null,
  timeRemaining: 0,
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setCurrentGame: (state, action: PayloadAction<Game | null>) => {
      state.currentGame = action.payload;
    },
    setCurrentRound: (state, action: PayloadAction<Round | null>) => {
      state.currentRound = action.payload;
    },
    setMyRack: (state, action: PayloadAction<Tile[]>) => {
      state.myRack = action.payload;
    },
    setSelectedTiles: (state, action: PayloadAction<Tile[]>) => {
      state.selectedTiles = action.payload;
    },
    addSelectedTile: (state, action: PayloadAction<Tile>) => {
      state.selectedTiles.push(action.payload);
    },
    removeSelectedTile: (state, action: PayloadAction<number>) => {
      state.selectedTiles.splice(action.payload, 1);
    },
    clearSelectedTiles: (state) => {
      state.selectedTiles = [];
    },
    shuffleRack: (state) => {
      state.myRack = [...state.myRack].sort(() => Math.random() - 0.5);
    },
    setTimeRemaining: (state, action: PayloadAction<number>) => {
      state.timeRemaining = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    resetGame: () => initialState,
  },
});

export const {
  setCurrentGame,
  setCurrentRound,
  setMyRack,
  setSelectedTiles,
  addSelectedTile,
  removeSelectedTile,
  clearSelectedTiles,
  shuffleRack,
  setTimeRemaining,
  setLoading,
  setError,
  resetGame,
} = gameSlice.actions;

export default gameSlice.reducer;
