create extension if not exists "pgcrypto";

create table if not exists games (
  game_id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  n_rows integer not null,
  n_cols integer not null,
  n_mines integer not null,
  mine_placements jsonb not null
);

create table if not exists game_events (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  game_id uuid not null references games(game_id),
  event jsonb not null
);

-- Enable Realtime for game_events (required for multiplayer sync).
-- Guard against re-running on a db where the table is already published.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and tablename = 'game_events'
  ) then
    alter publication supabase_realtime add table game_events;
  end if;
end $$;
