import supabaseClient from './supabase-client';
import { MinesweeperGame } from './minesweeper-game';

export type GameMode = {
  key: string;
  label: string;
  nRows: number;
  nCols: number;
  nMines: number;
};

export const GAME_MODES: GameMode[] = [
  { key: 'beginner', label: 'Beginner', nRows: 9,  nCols: 9,  nMines: 10 },
  { key: 'intermediate', label: 'Intermediate', nRows: 16, nCols: 16, nMines: 40  },
  { key: 'expert',       label: 'Expert',       nRows: 16, nCols: 30, nMines: 99  },
  { key: 'crash-out', label: 'Crash Out', nRows: 16, nCols: 30, nMines: 336 },
];

export const DEFAULT_GAME_MODE = GAME_MODES[0];

export async function createNewGame(nRows: number, nCols: number, nMines: number): Promise<string> {
  const minePlacements = MinesweeperGame.CreateMinePlacements(nRows, nCols, nMines);
  const { data, error } = await supabaseClient
    .from('games')
    .insert([{ n_rows: nRows, n_cols: nCols, n_mines: nMines, mine_placements: minePlacements }])
    .select();
  if (error) throw new Error(`Failed to create game: ${error.message}`);
  const gameId = (data?.[0] as { game_id: string })?.game_id;
  if (!gameId) throw new Error('Failed to get game ID');
  return gameId;
}
