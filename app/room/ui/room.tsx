'use client';
import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Game from '../../game/ui/game';
import supabaseClient from '../../game/lib/supabase-client';
import { createNewGame } from '../../game/lib/game-modes';

const Room: React.FC<{ roomId: string; initialGameId: string }> = ({ roomId, initialGameId }) => {
    const [currentGameId, setCurrentGameId] = useState(initialGameId);
    const [pendingGameId, setPendingGameId] = useState<string | null>(null);
    const locallyStartedRef = useRef<string | null>(null);

    useEffect(() => {
        supabaseClient
            .channel(`room:${roomId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'rooms',
                filter: `room_id=eq.${roomId}`,
            }, (payload) => {
                const newGameId = (payload.new as { current_game_id: string }).current_game_id;
                if (newGameId === locallyStartedRef.current) return;
                setPendingGameId(newGameId);
            })
            .subscribe();
    }, [roomId]);

    const handleStartGame = async (nRows: number, nCols: number, nMines: number) => {
        const newGameId = await createNewGame(nRows, nCols, nMines);
        locallyStartedRef.current = newGameId;
        await supabaseClient
            .from('rooms')
            .update({ current_game_id: newGameId })
            .eq('room_id', roomId)
            .throwOnError();
        setCurrentGameId(newGameId);
        setPendingGameId(null);
    };

    const roomUrl = typeof window !== 'undefined' ? window.location.href : '';

    return (
        <div>
            {roomUrl && (
                <div className="mb-4">
                    <QRCodeSVG value={roomUrl} size={96} />
                </div>
            )}
            {pendingGameId && (
                <div className="mt-2 flex items-center gap-3 rounded bg-yellow-100 px-4 py-2 text-yellow-800">
                    <span>A new game has started</span>
                    <button
                        onClick={() => { setCurrentGameId(pendingGameId); setPendingGameId(null); }}
                        className="font-bold underline hover:no-underline"
                    >
                        Follow →
                    </button>
                </div>
            )}
            <Game gameId={currentGameId} onStartGame={handleStartGame} />
        </div>
    );
};

export default Room;
