export type GameStatus = 'waiting' | 'playing' | 'paused' | 'finished';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'none';
export type TileType = 'DL' | 'TL' | 'DW' | 'TW' | 'CENTER' | 'NORMAL';
export type Direction = 'horizontal' | 'vertical';
export type TimerDuration = 180 | 300;
export type PauseRequestStatus = 'none' | 'requested' | 'accepted';

export interface Profile {
  id: string;
  display_name: string;
  avatar_url?: string;
  subscription_status: SubscriptionStatus;
  subscription_provider?: string;
  trial_starts_at?: string;
  trial_ends_at?: string;
  current_period_end?: string;
  games_played: number;
  games_won: number;
  total_score: number;
  highest_word_score: number;
  created_at: string;
  updated_at: string;
}

export interface Tile {
  letter: string;
  points: number;
}

export interface BoardCell {
  letter?: string;
  type: TileType;
  locked: boolean;
}

export interface Placement {
  row: number;
  col: number;
  direction: Direction;
}

export interface Submission {
  word: string;
  points: number;
  submitted_at: string;
  placement?: Placement;
}

export interface Round {
  id: string;
  game_id: string;
  round_number: number;
  rack: Tile[];
  player1_word?: string;
  player1_points?: number;
  player1_submitted_at?: string;
  player1_placement?: Placement;
  player2_word?: string;
  player2_points?: number;
  player2_submitted_at?: string;
  player2_placement?: Placement;
  winner_id?: string;
  winning_word?: string;
  winning_points?: number;
  created_at: string;
}

export interface Game {
  id: string;
  player1_id: string;
  player2_id?: string;
  status: GameStatus;
  board: BoardCell[][];
  current_turn_player_id?: string;
  tile_bag: Tile[];
  timer_ends_at?: string;
  turn_duration_seconds: number;
  player1_rack: Tile[];
  player2_rack: Tile[];
  player1_score: number;
  player2_score: number;
  player1_moves_count: number;
  player2_moves_count: number;
  player1_consecutive_passes: number;
  player2_consecutive_passes: number;
  player1_highest_word?: string;
  player1_highest_score?: number;
  player2_highest_word?: string;
  player2_highest_score?: number;
  player1_remaining_tiles?: Tile[];
  player2_remaining_tiles?: Tile[];
  winner_id?: string;
  resigned_player_id?: string;
  pause_requested_by?: string;
  pause_status: PauseRequestStatus;
  is_private: boolean;
  join_code?: string;
  dictionary: string;
  created_at: string;
  updated_at: string;
  game_started_at?: string;
  game_ended_at?: string;
}

export interface GameMove {
  id: string;
  game_id: string;
  round_number: number;
  player_id: string;
  word: string;
  points: number;
  placement: Placement;
  created_at: string;
}

export interface GameSummary {
  game_id: string;
  winner_id: string;
  player1_id: string;
  player2_id: string;
  player1_score: number;
  player2_score: number;
  player1_final_score: number;
  player2_final_score: number;
  player1_remaining_tiles_penalty: number;
  player2_remaining_tiles_penalty: number;
  player1_highest_word: string;
  player1_highest_score: number;
  player2_highest_word: string;
  player2_highest_score: number;
  player1_moves_count: number;
  player2_moves_count: number;
  total_moves: number;
  duration_minutes: number;
  resigned: boolean;
}
