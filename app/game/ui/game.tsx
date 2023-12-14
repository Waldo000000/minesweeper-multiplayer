'use client';
import { useEffect, useState } from 'react';
import Grid from './grid';
import { Coord, GameConfig, MinesweeperEvent, MinesweeperGame, State } from '../lib/minesweeper-game';
import supabaseClient from '../lib/supabase-client';
import { RealtimePostgresChangesPayload, RealtimePostgresInsertPayload } from '@supabase/supabase-js';

interface GameProps {
    gameId: string;
}

type GameEventInsertRecord = {
    event: MinesweeperEvent;
    game_id: string;
};

type GameEventRecord = GameEventInsertRecord & {
    id: number;
    created_at: string;
};

const Game: React.FC<GameProps> = ({ gameId }) => {
    const [minesweeperGame, setMinesweeperGame] = useState<MinesweeperGame | null>(null);
    const [state, setState] = useState<State | null>(null);

    useEffect(() => {
        const fetchGameConfigFromSupabase = async (gameId: string): Promise<GameConfig> => {

            // TODO: Use React query for types
            const configData = await supabaseClient
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

        const publishToDatabase = async (event: MinesweeperEvent) => {
            const record: GameEventInsertRecord = {
                game_id: gameId,
                event
            };

            await supabaseClient
                .from('game_events')
                .insert([record])
                .throwOnError();
        }

        const fetchGameConfig = async () => {
            const config = await fetchGameConfigFromSupabase(gameId);

            const game = new MinesweeperGame(config, (state) => setState({ ...state }), event => publishToDatabase(event))

            const handlePayload = (payload: RealtimePostgresInsertPayload<GameEventRecord>) => {
                game.processEvent(payload.new.event);
            };

            supabaseClient
                .channel('game_events')
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'game_events',
                    filter: `game_id=eq.${gameId}`,
                }, handlePayload)
                .subscribe();

            setMinesweeperGame(game);
        };

        fetchGameConfig();
    }, [gameId]);

    return (
        <div>
            <p>Game ID: {gameId}</p>
            <Grid
                board={state?.board ?? []}
                onRevealClick={minesweeperGame?.revealCell || (() => { })}
                onToggleFlagClick={minesweeperGame?.toggleFlagCell || (() => { })}
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