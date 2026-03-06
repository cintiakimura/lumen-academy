-- Lumen Academy: initial tables + RLS
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New query).

-- 1. Users (profile keyed by auth.users)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('org', 'teacher', 'learner')),
  email text,
  created_at timestamptz default now()
);

alter table public.users enable row level security;

-- Users: read own row; org can read all
create policy "users_select_own"
  on public.users for select
  using (auth.uid() = id);

create policy "users_select_org"
  on public.users for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'org'
    )
  );

-- Allow insert from backend/trigger (service role) or first user
create policy "users_insert_own"
  on public.users for insert
  with check (auth.uid() = id);

-- Allow update own row (e.g. email)
create policy "users_update_own"
  on public.users for update
  using (auth.uid() = id);

-- 3. Trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  first_count int;
begin
  select count(*) into first_count from public.users;
  insert into public.users (id, role, email)
  values (
    new.id,
    case when first_count = 0 then 'org' else 'learner' end,
    new.email
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Courses
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  created_at timestamptz default now()
);

alter table public.courses enable row level security;

create policy "courses_org_all"
  on public.courses for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'org' and u.id = courses.org_id
    )
  )
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'org' and u.id = courses.org_id
    )
  );

create policy "courses_teacher_select"
  on public.courses for select
  using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'teacher')
  );

-- 5. Blocks
create table public.blocks (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text,
  type text,
  duration_sec int,
  assets jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

alter table public.blocks enable row level security;

create policy "blocks_org_all"
  on public.blocks for all
  using (
    exists (
      select 1 from public.courses c
      join public.users u on u.id = c.org_id and u.id = auth.uid() and u.role = 'org'
      where c.id = blocks.course_id
    )
  )
  with check (
    exists (
      select 1 from public.courses c
      join public.users u on u.id = c.org_id and u.id = auth.uid() and u.role = 'org'
      where c.id = blocks.course_id
    )
  );

create policy "blocks_teacher_select"
  on public.blocks for select
  using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'teacher')
  );

-- 6. Assignments
create table public.assignments (
  user_id uuid not null references public.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  assigned_at timestamptz default now(),
  primary key (user_id, course_id)
);

alter table public.assignments enable row level security;

create policy "assignments_learner_select_own"
  on public.assignments for select
  using (auth.uid() = user_id);

create policy "assignments_org_all"
  on public.assignments for all
  using (
    exists (
      select 1 from public.courses c
      join public.users u on u.id = c.org_id and u.id = auth.uid() and u.role = 'org'
      where c.id = assignments.course_id
    )
  )
  with check (
    exists (
      select 1 from public.courses c
      join public.users u on u.id = c.org_id and u.id = auth.uid() and u.role = 'org'
      where c.id = assignments.course_id
    )
  );

create policy "assignments_teacher_select_insert"
  on public.assignments for select
  using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'teacher')
  );

create policy "assignments_teacher_insert"
  on public.assignments for insert
  with check (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'teacher')
  );
