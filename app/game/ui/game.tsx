'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Grid from './grid';
import { Coord, GameConfig, MinesweeperEvent, MinesweeperGame, State } from '../lib/minesweeper-game';
import supabaseClient from '../lib/supabase-client';
import { RealtimePostgresInsertPayload } from '@supabase/supabase-js';
import { GAME_MODES, GameMode, createNewGame } from '../lib/game-modes';

interface GameProps {
    gameId: string;
    onStartGame?: (nRows: number, nCols: number, nMines: number) => Promise<void>;
}

type GameEventInsertRecord = {
    event: MinesweeperEvent;
    game_id: string;
};

type GameEventRecord = GameEventInsertRecord & {
    id: number;
    created_at: string;
};

const Game: React.FC<GameProps> = ({ gameId, onStartGame }) => {
    const router = useRouter();
    const [minesweeperGame, setMinesweeperGame] = useState<MinesweeperGame | null>(null);
    const [state, setState] = useState<State | null>(null);
    const [showCustomForm, setShowCustomForm] = useState(false);
    const [customRows, setCustomRows] = useState('16');
    const [customCols, setCustomCols] = useState('30');
    const [customMines, setCustomMines] = useState('99');

    const handleSelectMode = async (mode: GameMode) => {
        if (onStartGame) {
            await onStartGame(mode.nRows, mode.nCols, mode.nMines);
        } else {
            const newGameId = await createNewGame(mode.nRows, mode.nCols, mode.nMines);
            router.push(`/game/${newGameId}`);
        }
    };

    const handleCustomSubmit = async () => {
        setShowCustomForm(false);
        if (onStartGame) {
            await onStartGame(Number(customRows), Number(customCols), Number(customMines));
        } else {
            const newGameId = await createNewGame(Number(customRows), Number(customCols), Number(customMines));
            router.push(`/game/${newGameId}`);
        }
    };

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
            <div className="mb-4 flex flex-wrap gap-2 items-center">
                {GAME_MODES.map((mode) => (
                    <button
                        key={mode.key}
                        onClick={() => { setShowCustomForm(false); handleSelectMode(mode); }}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        {mode.label}
                    </button>
                ))}
                <button
                    onClick={() => setShowCustomForm((v) => !v)}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    Custom
                </button>
                {showCustomForm && (
                    <>
                        <input type="number" value={customRows} onChange={(e) => setCustomRows(e.target.value)}
                            className="w-16 border rounded px-2 py-1 text-black bg-white" placeholder="Rows" />
                        <input type="number" value={customCols} onChange={(e) => setCustomCols(e.target.value)}
                            className="w-16 border rounded px-2 py-1 text-black bg-white" placeholder="Cols" />
                        <input type="number" value={customMines} onChange={(e) => setCustomMines(e.target.value)}
                            className="w-20 border rounded px-2 py-1 text-black bg-white" placeholder="Mines" />
                        <button onClick={handleCustomSubmit}
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                            Go
                        </button>
                    </>
                )}
            </div>
            <Grid
                board={state?.board ?? []}
                onRevealClick={minesweeperGame?.revealCell || (() => { })}
                onToggleFlagClick={minesweeperGame?.toggleFlagCell || (() => { })}
            />
        </div>
    )
}

export default Game;
