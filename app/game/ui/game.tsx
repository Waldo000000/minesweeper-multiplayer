'use client';
import dynamic from 'next/dynamic';
import { useState } from 'react';

const DynamicCell = dynamic(() => import('./cell'), { ssr: false });

export default function Game() {
    const [revealed, setRevealed] = useState(false);
    const [flagged, setFlagged] = useState(false);

    let cellProps = {
        value: 1,
        revealed: revealed,
        flagged: flagged,
        onClick: () => { setRevealed(!revealed) },
        onRightClick: () => { setFlagged(!flagged) }
    };
    
    return (
        <DynamicCell {...cellProps} />
    );
}
