'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createNewGame, DEFAULT_GAME_MODE } from '../lib/game-modes';

export default function CreateGamePage() {
    const router = useRouter();
    const [gameId, setGameId] = useState<string | null>(null);

    useEffect(() => {
        const createNewGameAndNavigateToIt = async () => {
            const gameId = await createNewGame(DEFAULT_GAME_MODE.nRows, DEFAULT_GAME_MODE.nCols, DEFAULT_GAME_MODE.nMines);

            // Set the gameId in the component state
            setGameId(gameId);

            // Navigate to the newly created game
            router.push(`/game/${gameId}`);
        };

        createNewGameAndNavigateToIt();
    }, [router]);

    if (!gameId) {
        // Loading state or handle error
        return <div>Loading...</div>;
    }

    // You might display a loading state while creating the game
    return <div>Creating game...</div>;
};
