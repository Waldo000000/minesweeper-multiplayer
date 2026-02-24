import { redirect } from 'next/navigation';
import { createNewRoom, DEFAULT_GAME_MODE } from '../../game/lib/game-modes';

export default async function CreateRoomPage() {
    const roomId = await createNewRoom(DEFAULT_GAME_MODE.nRows, DEFAULT_GAME_MODE.nCols, DEFAULT_GAME_MODE.nMines);
    redirect(`/room/${roomId}`);
}
