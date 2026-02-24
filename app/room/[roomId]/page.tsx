import { notFound } from 'next/navigation';
import supabaseClient from '../../game/lib/supabase-client';
import Room from '../ui/room';

export default async function RoomPage({ params }: { params: { roomId: string } }) {
    const { data } = await supabaseClient
        .from('rooms')
        .select('current_game_id')
        .eq('room_id', params.roomId)
        .single();

    if (!data) notFound();

    return <Room roomId={params.roomId} initialGameId={data.current_game_id} />;
}
