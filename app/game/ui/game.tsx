'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Grid from './grid';
import { Coord, GameConfig, MinesweeperEvent, MinesweeperGame, State } from '../lib/minesweeper-game';
import supabaseClient from '../lib/supabase-client';
import { RealtimePostgresInsertPayload } from '@supabase/supabase-js';
import { GAME_MODES, GameMode, createNewGame } from '../lib/game-modes';
import { BestTime, getBestTimes, saveBestTime } from '../lib/best-times';

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
    const [nRows, setNRows] = useState(0);
    const [nCols, setNCols] = useState(0);
    const [nMines, setNMines] = useState(0);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [elapsed, setElapsed] = useState(0);
    const [bestTimes, setBestTimes] = useState<BestTime[]>([]);

    const flatBoard = state?.board.flat() ?? [];
    const flaggedCount = flatBoard.filter(c => c.isFlagged).length;
    const minesRemaining = nMines - flaggedCount;
    const isGameLost = flatBoard.some(c => c.isMine && c.isRevealed);
    const nonMineCells = flatBoard.filter(c => !c.isMine);
    const isGameWon = !isGameLost && nonMineCells.length > 0 && nonMineCells.every(c => c.isRevealed);
    const isGameOver = isGameLost || isGameWon;

    // Reset timer and board state when game changes
    useEffect(() => {
        setState(null);
        setStartTime(null);
        setElapsed(0);
    }, [gameId]);

    // Start timer on first reveal
    useEffect(() => {
        if (startTime !== null) return;
        if (state?.board.flat().some(c => c.isRevealed)) {
            setStartTime(Date.now());
        }
    }, [state, startTime]);

    // Tick
    useEffect(() => {
        if (startTime === null || isGameOver) return;
        const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 500);
        return () => clearInterval(id);
    }, [startTime, isGameOver]);

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

    // Save best time when game is won (fires once: isGameWon/startTime/config are stable per gameId)
    useEffect(() => {
        if (!isGameWon || startTime === null || nRows === 0 || nCols === 0 || nMines === 0) return;
        saveBestTime(nRows, nCols, nMines, (Date.now() - startTime) / 1000);
        setBestTimes(getBestTimes(nRows, nCols, nMines));
    }, [isGameWon, startTime, nRows, nCols, nMines]);

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
            setNMines(config.nMines);
            setNRows(config.nRows);
            setNCols(config.nCols);
            setBestTimes(getBestTimes(config.nRows, config.nCols, config.nMines));

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
            {isGameOver && (
                <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
                    style={{ background: isGameWon ? 'rgba(0,60,0,0.55)' : 'rgba(60,0,0,0.65)' }}>
                    <div className="pointer-events-auto flex flex-col items-center gap-4 rounded-2xl px-10 py-8 shadow-2xl"
                        style={{ background: isGameWon ? 'rgba(0,40,0,0.92)' : 'rgba(30,0,0,0.92)', border: `2px solid ${isGameWon ? '#22c55e' : '#ef4444'}` }}>
                        <div className="text-7xl select-none">{isGameWon ? '🎉' : '💀'}</div>
                        <div className={`text-3xl font-extrabold tracking-wide ${isGameWon ? 'text-green-400' : 'text-red-400'}`}>
                            {isGameWon ? 'You won!' : 'Game over!'}
                        </div>
                        {isGameWon && startTime !== null && (
                            <div className="text-green-300 font-mono text-lg">⏱ {formatTime(elapsed)}</div>
                        )}
                        <div className="mt-2 flex flex-wrap justify-center gap-2">
                            {GAME_MODES.map((mode) => (
                                <button
                                    key={mode.key}
                                    onClick={() => { setShowCustomForm(false); handleSelectMode(mode); }}
                                    className={`font-bold py-2 px-4 rounded text-white ${isGameWon ? 'bg-green-600 hover:bg-green-500' : 'bg-red-700 hover:bg-red-500'}`}
                                >
                                    {mode.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
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
            <div className={['mb-2 flex gap-6 font-mono text-sm items-center', isGameWon ? 'text-green-500' : isGameLost ? 'text-red-500' : ''].join(' ').trim()}>
                <span>💣 {minesRemaining}</span>
                <span>⏱ {formatTime(elapsed)}</span>
                {isGameWon && <span className="font-bold">🎉 You won!</span>}
                {isGameLost && <span className="font-bold">💥 Game over!</span>}
            </div>
            <Grid
                board={state?.board ?? []}
                onRevealClick={minesweeperGame?.revealCell || (() => { })}
                onToggleFlagClick={minesweeperGame?.toggleFlagCell || (() => { })}
            />
            {nRows > 0 && (
                <div className="mt-4 font-mono text-sm">
                    <div className="font-bold mb-1">🏆 Best Times ({nRows}×{nCols}, {nMines} mines)</div>
                    {bestTimes.length === 0 ? (
                        <div className="text-gray-400">No times yet</div>
                    ) : (
                        <ol className="list-decimal list-inside space-y-0.5">
                            {bestTimes.map((t, i) => (
                                <li key={`${t.timeSeconds}-${t.date}-${i}`}>{formatTime(t.timeSeconds)} <span className="text-gray-400 text-xs">({t.date})</span></li>
                            ))}
                        </ol>
                    )}
                </div>
            )}
        </div>
    )
}

export default Game;
