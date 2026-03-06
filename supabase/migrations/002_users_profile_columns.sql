-- Profile columns for chat adaptation (pace, vocab, mode, attention)
-- Run in Supabase SQL Editor after 001_initial_tables_rls.sql.

alter table public.users
  add column if not exists pace text default 'medium',
  add column if not exists vocab text default 'intermediate',
  add column if not exists preferred_mode text,
  add column if not exists attention_sec int default 600;

comment on column public.users.pace is 'slow | medium | fast — affects reply delay / simplicity';
comment on column public.users.vocab is 'beginner | intermediate | advanced';
comment on column public.users.preferred_mode is 'voice | sim | clip — last learner choice';
comment on column public.users.attention_sec is 'session attention window in seconds (default 600 = 10 min)';
