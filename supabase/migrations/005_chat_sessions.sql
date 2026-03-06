-- Chat session pause/resume: one row per user+block
-- Run after 003.

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  block_id text not null,
  messages jsonb not null default '[]'::jsonb,
  last_turn_at timestamptz default now(),
  mastery boolean not null default false,
  unique (user_id, block_id)
);

alter table public.chat_sessions enable row level security;

create policy "chat_sessions_learner_all"
  on public.chat_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on table public.chat_sessions is 'Saved chat state per learner per block for pause/resume';
