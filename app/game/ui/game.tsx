'use client';
import { useEffect, useState } from 'react';
import Grid from './grid';
import { Coord, GameConfig, MinesweeperGame, State } from '../lib/minesweeper-game';
import { createClient } from "@supabase/supabase-js";

interface GameProps {
    gameId: string;
}

const Game: React.FC<GameProps> = ({ gameId }) => {
    const [minesweeperGame, setMinesweeperGame] = useState<MinesweeperGame | null>(null);
    const [state, setState] = useState<State | null>(null);

    useEffect(() => {
        const fetchGameConfigFromSupabase = async (gameId: string): Promise<GameConfig> => {

            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );

            // TODO: Use React query for types

            const configData = await supabase
                .from('games')
                .select()
                .eq('game_id', gameId);

            const configTyped = (configData.data![0] as unknown as {
                game_id: string,
                n_rows: number,
                n_cols: number,
                n_mines: number
                mine_placements: Coord[],
            });

            return {
                nRows: configTyped.n_rows,
                nCols: configTyped.n_cols,
                nMines: configTyped.n_mines,
                minePlacements: configTyped.mine_placements
            };
        }

        const fetchGameConfig = async () => {
            const config = await fetchGameConfigFromSupabase(gameId);

            const game = new MinesweeperGame(config, (state) => setState({ ...state }))

            setMinesweeperGame(game);
        };

        fetchGameConfig();
    }, [gameId]);

    return (
        <div>
            <p>Game ID: {gameId}</p>
            <Grid
                board={state?.board ?? []}
                onCellClick={minesweeperGame?.revealCell || (() => { })}
                onCellRightClick={minesweeperGame?.flagCell || (() => { })}
            />
            <div className="mt-4">
                <a
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    href="/game/new">
                    New Game
                </a>
            </div>
        </div >
    )
}

export default Game;