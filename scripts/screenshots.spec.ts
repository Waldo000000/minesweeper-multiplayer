import { test, Browser, Page } from '@playwright/test';
import fs from 'fs';

const OUT = 'docs/screenshots';
const DARK = { colorScheme: 'dark' as const, viewport: { width: 900, height: 700 } };

const waitForBoard = (page: Page) => page.waitForSelector('.cell');

test.setTimeout(120_000);

test.beforeAll(() => {
    fs.mkdirSync(OUT, { recursive: true });
});

test('screenshots', async ({ browser }: { browser: Browser }) => {
    // ── Page 1: create a room ──────────────────────────────────────────────
    const ctx1 = await browser.newContext(DARK);
    const p1 = await ctx1.newPage();

    await p1.goto('/room/new');
    await p1.waitForURL(/\/room\//);
    const roomUrl = p1.url();

    await waitForBoard(p1);
    await p1.waitForTimeout(300);

    // 1. Fresh board
    await p1.screenshot({ path: `${OUT}/01-fresh-board.png` });

    // Retry until we get a clearing (⬛ = empty cell with 0 neighbours)
    let hasClear = false;
    for (let attempt = 0; attempt < 15 && !hasClear; attempt++) {
        if (attempt > 0) {
            // Start a new beginner game and wait for fresh board
            await p1.getByText('Beginner').click();
            await p1.waitForTimeout(600);
            await waitForBoard(p1);
        }

        // Click the centre cell of the 9×9 grid (index 40)
        const cells = p1.locator('.cell');
        await cells.nth(40).click();
        await p1.waitForTimeout(600);

        hasClear = await p1.locator('.cell.revealed').filter({ hasText: '⬛' }).count() > 0;
    }

    // Flag cells that are obviously mines: unrevealed neighbours of a number cell
    // where the remaining unrevealed neighbour count equals the cell's number.
    const obviousMineIndices = await p1.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('.row'));
        const nRows = rows.length;
        const nCols = rows[0]?.querySelectorAll('.cell').length ?? 0;
        const board = rows.map(row =>
            Array.from(row.querySelectorAll('.cell')).map(cell => ({
                isRevealed: cell.classList.contains('revealed'),
                isFlagged: cell.classList.contains('flagged'),
                num: parseInt(cell.textContent?.trim() ?? '', 10),
            }))
        );
        const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
        const mineSet = new Set<number>();
        for (let r = 0; r < nRows; r++) {
            for (let c = 0; c < nCols; c++) {
                const cell = board[r][c];
                if (!cell.isRevealed || isNaN(cell.num) || cell.num <= 0) continue;
                const unrevNeighbours: number[] = [];
                for (const [dr, dc] of dirs) {
                    const nr = r + dr, nc = c + dc;
                    if (nr < 0 || nr >= nRows || nc < 0 || nc >= nCols) continue;
                    if (!board[nr][nc].isRevealed && !board[nr][nc].isFlagged)
                        unrevNeighbours.push(nr * nCols + nc);
                }
                if (cell.num === unrevNeighbours.length)
                    unrevNeighbours.forEach(idx => mineSet.add(idx));
            }
        }
        return Array.from(mineSet).slice(0, 3);
    });
    for (const idx of obviousMineIndices) {
        await p1.locator('.cell').nth(idx).click({ button: 'right' });
        await p1.waitForTimeout(150);
    }

    // 2. Mid-game with clearing + flags
    await p1.screenshot({ path: `${OUT}/02-mid-game.png` });

    // ── Page 2: join the same room ─────────────────────────────────────────
    const ctx2 = await browser.newContext(DARK);
    const p2 = await ctx2.newPage();
    await p2.goto(roomUrl);
    await waitForBoard(p2);

    // Page 1 starts a new game — page 2 should see the Follow banner
    await p1.getByText('Beginner').first().click();
    await p2.waitForSelector('text=Follow →', { timeout: 15_000 });

    // 3. Follow banner visible on page 2
    await p2.screenshot({ path: `${OUT}/03-follow-banner.png` });

    // Click Follow on page 2
    await p2.getByText('Follow →').click();
    await p2.waitForTimeout(600);

    // 4. Both players on same new game (page 2 after following)
    await p2.screenshot({ path: `${OUT}/04-after-follow.png` });

    // ── Game over: Crash Out has ~70% mine density ─────────────────────────
    await p1.getByText('Crash Out').click();
    await p1.waitForTimeout(800);
    await waitForBoard(p1);

    for (let i = 0; i < 5; i++) {
        const safe = p1.locator('.cell:not(.revealed):not(.flagged)');
        if (await safe.count() === 0) break;
        await safe.first().click();
        await p1.waitForTimeout(400);
        if (await p1.locator('.cell').filter({ hasText: '💥' }).count() > 0) break;
    }

    // 5. Game over state
    await p1.screenshot({ path: `${OUT}/05-game-over.png` });

    await ctx1.close();
    await ctx2.close();
});
