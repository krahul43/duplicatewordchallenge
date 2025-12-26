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

export type RoundStatus = 'waiting_for_submissions' | 'comparing' | 'completed';

export interface Round {
  id: string;
  game_id: string;
  round_number: number;
  shared_rack: Tile[];

  player1_word?: string;
  player1_score?: number;
  player1_placement?: Placement;
  player1_tiles_used?: Tile[];
  player1_submitted: boolean;
  player1_submitted_at?: string;

  player2_word?: string;
  player2_score?: number;
  player2_placement?: Placement;
  player2_tiles_used?: Tile[];
  player2_submitted: boolean;
  player2_submitted_at?: string;

  status: RoundStatus;
  winner_id?: string;
  winning_word?: string;
  winning_score?: number;
  winning_placement?: Placement;

  created_at: string;
  completed_at?: string;

  rack?: Tile[];
  player1_points?: number;
  player2_points?: number;
  winning_points?: number;
}

export interface Game {
  id: string;
  player1_id: string;
  player2_id?: string;
  status: GameStatus;

  player1_board: BoardCell[][];
  player2_board: BoardCell[][];

  shared_tile_bag: Tile[];

  player1_rack: Tile[];
  player2_rack: Tile[];

  player1_score: number;
  player2_score: number;

  player1_highest_word?: string;
  player1_highest_score?: number;
  player2_highest_word?: string;
  player2_highest_score?: number;

  player1_submitted: boolean;
  player2_submitted: boolean;
  player1_submitted_at?: string;
  player2_submitted_at?: string;

  timer_ends_at?: string;
  game_duration_seconds: number;

  winner_id?: string;
  resigned_player_id?: string;
  is_private: boolean;
  join_code?: string;
  join_code_expires_at?: string;
  dictionary: string;
  created_at: string;
  updated_at: string;
  game_started_at?: string;
  game_ended_at?: string;

  board?: BoardCell[][];
  tile_bag?: Tile[];
  shared_rack?: Tile[];
  current_round?: number;
  round_ends_at?: string;
  round_duration_seconds?: number;
  player1_rounds_won?: number;
  player2_rounds_won?: number;
  player1_consecutive_passes?: number;
  player2_consecutive_passes?: number;
  current_turn_player_id?: string;
  turn_duration_seconds?: number;
  player1_moves_count?: number;
  player2_moves_count?: number;
  player1_remaining_tiles?: Tile[];
  player2_remaining_tiles?: Tile[];
  pause_requested_by?: string;
  pause_status?: PauseRequestStatus;
  paused_at?: string;
  remaining_time_seconds?: number;
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
  resigned_player_id?: string;
}
