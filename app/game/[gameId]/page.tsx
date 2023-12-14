import { useRouter } from 'next/router';
import React from 'react';
import Game from '../ui/game';

export default function Page({ params }: { params: { gameId: string } }) {

  return (
    <div>
      <h1>Minesweeper Game</h1>
      <Game gameId={params.gameId as string}></Game>
    </div>
  );
};
