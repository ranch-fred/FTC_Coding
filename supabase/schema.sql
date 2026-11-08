-- Run once in Supabase: SQL Editor > New query > paste > Run.
create table progress (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  email text default (auth.jwt() ->> 'email'),
  lesson_id text not null,
  code text not null default '',
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);
create table admins (email text primary key);

alter table progress enable row level security;
alter table admins enable row level security;

create function is_admin() returns boolean
  language sql security definer stable set search_path = public
  as $$ select exists (select 1 from admins where email = auth.jwt() ->> 'email') $$;

create policy own_rw on progress for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy admin_read on progress for select using (is_admin());
create policy admin_self on admins for select using (email = auth.jwt() ->> 'email');

-- Make yourself admin (use your login email):
-- insert into admins values ('you@example.com');
