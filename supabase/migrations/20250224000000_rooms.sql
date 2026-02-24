create table if not exists rooms (
  room_id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  current_game_id uuid not null references games(game_id)
);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and tablename = 'rooms'
  ) then
    alter publication supabase_realtime add table rooms;
  end if;
end $$;
