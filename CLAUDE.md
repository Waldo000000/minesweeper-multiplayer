# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npx supabase start   # Start local Supabase stack (Postgres + PostgREST + Realtime) via Docker
npx supabase stop    # Stop local Supabase stack
npx supabase db reset  # Wipe and reapply all migrations
npm run dev          # Start Next.js dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint with Next.js core-web-vitals config
```

There are no tests configured.

## Local Environment

`.env.local` is committed with the fixed credentials that `npx supabase start` always uses locally — no setup required. Schema is in `supabase/migrations/`.

## Architecture

**Tech stack**: Next.js 14, TypeScript, Tailwind CSS, Supabase (PostgreSQL + Realtime)

**Multiplayer model**: Co-op only — players share the same game URL (`/game/{gameId}`). All players see the same board and work together. No accounts or sessions.

### Event-driven game logic

`app/game/lib/minesweeper-game.tsx` is the core. It uses an event-sourcing pattern:

- Player actions (`revealCell`, `toggleFlagCell`) produce `MinesweeperEvent` objects
- Events are applied locally (optimistic update) and published to Supabase `game_events` table
- Remote events from other players arrive via Supabase Realtime and are applied via `processEvent(event)`
- The `onPublish` callback (injected at construction) handles the Supabase write; the game logic itself is decoupled from the transport

### Supabase tables

- `games` — stores `game_id`, `n_rows`, `n_cols`, `n_mines`, `mine_placements` (JSON array of `{row, col}`)
- `game_events` — stores `game_id`, `event` (JSON `MinesweeperEvent`), `created_at`

### Key components

- `app/game/ui/game.tsx` — Orchestrator: fetches config from Supabase, instantiates `MinesweeperGame`, subscribes to Realtime, publishes events, owns React state
- `app/game/ui/grid.tsx` — Renders the 2D board
- `app/game/ui/cell.tsx` — Individual cell: click to reveal, right-click or swipe (right/up) to flag. Swipe right is preferred on mobile (swipe up causes iOS scroll; swipe right causes Android back navigation — both are handled)
- `app/game/new/page.tsx` — Creates a new 8×8 / 10-mine game in Supabase, then redirects to `/game/{gameId}`
- `app/game/[gameId]/page.tsx` — Dynamic route that renders `<Game gameId={gameId} />`
