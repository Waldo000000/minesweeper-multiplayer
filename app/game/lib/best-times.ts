export type BestTime = {
    timeSeconds: number;
    date: string;
};

const MAX_STORED_TIMES = 5;

const storageKey = (nRows: number, nCols: number, nMines: number) =>
    `minesweeper_best_times_${nRows}x${nCols}x${nMines}`;

export function getBestTimes(nRows: number, nCols: number, nMines: number): BestTime[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(storageKey(nRows, nCols, nMines));
    if (!stored) return [];
    try {
        return JSON.parse(stored) as BestTime[];
    } catch {
        return [];
    }
}

export function saveBestTime(nRows: number, nCols: number, nMines: number, timeSeconds: number): void {
    if (typeof window === 'undefined') return;
    const times = getBestTimes(nRows, nCols, nMines);
    times.push({ timeSeconds, date: new Date().toLocaleDateString() });
    times.sort((a, b) => a.timeSeconds - b.timeSeconds);
    localStorage.setItem(storageKey(nRows, nCols, nMines), JSON.stringify(times.slice(0, MAX_STORED_TIMES)));
}
