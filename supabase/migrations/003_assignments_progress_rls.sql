-- Progress tracking on assignments (completed block_ids)
-- Run after 001 and 002.

alter table public.assignments
  add column if not exists progress jsonb default '[]'::jsonb;

comment on column public.assignments.progress is 'Array of completed block_ids (uuid strings)';

-- Learner can update own assignment row (e.g. progress only)
create policy "assignments_learner_update_own"
  on public.assignments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
