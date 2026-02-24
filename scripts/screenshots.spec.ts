import { test, Browser, Page } from '@playwright/test';
import fs from 'fs';

const OUT = 'docs/screenshots';
const DARK = { colorScheme: 'dark' as const, viewport: { width: 900, height: 700 } };

const waitForBoard = (page: Page) => page.waitForSelector('.cell');

// Crop to the union bounding-box of all meaningful content elements
const screenshotContent = async (page: Page, path: string) => {
    const clip = await page.evaluate(() => {
        let x1 = Infinity, y1 = Infinity, x2 = 0, y2 = 0;
        document.querySelectorAll('button, input, .cell, svg').forEach(el => {
            const r = el.getBoundingClientRect();
            if (!r.width || !r.height) return;
            x1 = Math.min(x1, r.left);
            y1 = Math.min(y1, r.top);
            x2 = Math.max(x2, r.right);
            y2 = Math.max(y2, r.bottom);
        });
        const pad = 14;
        return { x: Math.max(0, x1 - pad), y: Math.max(0, y1 - pad), width: x2 - x1 + pad * 2, height: y2 - y1 + pad * 2 };
    });
    await page.screenshot({ path, clip });
};

test.setTimeout(120_000);

test.beforeAll(() => {
    fs.mkdirSync(OUT, { recursive: true });
});

test('screenshots', async ({ browser }: { browser: Browser }) => {
    const ctx1 = await browser.newContext(DARK);
    const p1 = await ctx1.newPage();

    await p1.goto('/room/new');
    await p1.waitForURL(/\/room\//);
    const roomUrl = p1.url();
    await waitForBoard(p1);
    await p1.waitForTimeout(300);

    // 1. Fresh board with QR open
    await p1.getByText('Invite 📲').click();
    await p1.waitForTimeout(200);
    await screenshotContent(p1, `${OUT}/01-fresh-board.png`);

    // Hide QR before playing
    await p1.getByText('Hide QR').click();

    // Retry until we get a clearing (⬛ = empty revealed cell)
    let hasClear = false;
    for (let attempt = 0; attempt < 15 && !hasClear; attempt++) {
        if (attempt > 0) {
            await p1.getByText('Beginner').click();
            await p1.waitForTimeout(600);
            await waitForBoard(p1);
        }
        await p1.locator('.cell').nth(40).click();
        await p1.waitForTimeout(600);
        hasClear = await p1.locator('.cell.revealed').filter({ hasText: '⬛' }).count() > 0;
    }

    // Flag cells that are obviously mines
    const obviousMineIndices: number[] = await p1.evaluate(() => {
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
    await screenshotContent(p1, `${OUT}/02-mid-game.png`);

    // ── Page 2: join the same room ─────────────────────────────────────────
    const ctx2 = await browser.newContext(DARK);
    const p2 = await ctx2.newPage();
    await p2.goto(roomUrl);
    await waitForBoard(p2);

    // Page 1 starts a new game; page 2 should see the Follow banner
    await p1.getByText('Beginner').first().click();
    await p2.waitForSelector('text=Follow →', { timeout: 15_000 });

    // 3. Follow banner on page 2
    await screenshotContent(p2, `${OUT}/03-follow-banner.png`);

    await ctx1.close();
    await ctx2.close();
});
