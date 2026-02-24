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

    const [showQR, setShowQR] = useState(false);
    const roomUrl = typeof window !== 'undefined' ? window.location.href : '';

    return (
        <div className="flex items-start gap-6">
            <div className="min-w-0 flex-1">
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
            {roomUrl && (
                <div className="flex-shrink-0">
                    <button
                        onClick={() => setShowQR(v => !v)}
                        className="rounded bg-blue-500 px-3 py-1.5 text-sm font-bold text-white hover:bg-blue-700"
                    >
                        {showQR ? 'Hide QR' : 'Invite 📲'}
                    </button>
                    {showQR && (
                        <div className="mt-2 rounded-lg bg-white p-3 shadow-lg">
                            <QRCodeSVG value={roomUrl} size={160} bgColor="#ffffff" fgColor="#000000" includeMargin />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Room;
