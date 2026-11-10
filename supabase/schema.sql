-- Safe to run again at any time: Supabase > SQL Editor > New query > paste this whole file > Run.
-- Existing data is kept.

-- Mentors. Add yourself after signing up:  insert into admins values ('you@example.com');
create table if not exists admins (email text primary key);

-- One row per teammate. `state` holds XP, XP per day (streak and weekly XP), finished lessons,
-- every quiz answer tally (right / wrong per question), saved code, battery and display name.
-- Its shape is defined in lib/game.js (newState).
create table if not exists player_state (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  email text,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint state_is_small_object check (jsonb_typeof(state) = 'object' and octet_length(state::text) < 300000)
);

-- The client cannot choose its own email or timestamp: the database fills them in.
create or replace function stamp_player_state() returns trigger
  language plpgsql as $$
begin
  new.email := auth.jwt() ->> 'email';
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists stamp_player_state on player_state;
create trigger stamp_player_state before insert or update on player_state
  for each row execute function stamp_player_state();

alter table player_state enable row level security;
alter table admins enable row level security;

create or replace function is_admin() returns boolean
  language sql security definer stable set search_path = public
  as $$ select exists (select 1 from admins where email = auth.jwt() ->> 'email') $$;

-- Teammates read and write only their own row. Mentors can read every row but not change them.
drop policy if exists own_rw on player_state;
create policy own_rw on player_state for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists admin_read on player_state;
create policy admin_read on player_state for select using (is_admin());
drop policy if exists admin_self on admins;
create policy admin_self on admins for select using (email = auth.jwt() ->> 'email');

-- Leaderboard: display name and XP for the last 7 days, only for teammates who set a display name.
-- Runs with definer rights so it can read every row, and returns nothing else from them.
-- Written to survive bad data: a broken row counts as 0 XP instead of breaking the list.
create or replace function leaderboard() returns table (name text, xp int, you boolean)
  language sql security definer stable set search_path = public
  as $$
    select
      left(btrim(p.state ->> 'name'), 24),
      coalesce((
        select sum(case when d.value ~ '^[0-9]{1,4}$' then least(d.value::int, 2000) else 0 end)
        from jsonb_each_text(
          case when jsonb_typeof(p.state -> 'xpByDay') = 'object' then p.state -> 'xpByDay' else '{}'::jsonb end
        ) d
        where d.key >= to_char(current_date - 6, 'YYYY-MM-DD') and d.key <= to_char(current_date + 1, 'YYYY-MM-DD')
      ), 0)::int,
      p.user_id = auth.uid()
    from player_state p
    where auth.uid() is not null and btrim(coalesce(p.state ->> 'name', '')) <> ''
    order by 2 desc
    limit 100
  $$;
revoke execute on function leaderboard() from public, anon;
grant execute on function leaderboard() to authenticated;

-- The first version of this site used a `progress` table. It is no longer read. It is left in place
-- so nothing is lost; remove it when you are sure:  drop table if exists progress;
