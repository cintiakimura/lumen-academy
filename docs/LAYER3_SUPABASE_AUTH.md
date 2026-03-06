# Layer 3: Supabase auth + RLS — how to test

## 1. Create Supabase project

- Go to [supabase.com](https://supabase.com) → New project.
- Pick org, name (e.g. `lumen-academy`), password, region.
- Wait for the project to be ready.

## 2. Run the SQL

- In the Supabase Dashboard: **SQL Editor** → **New query**.
- Copy the contents of `supabase/migrations/001_initial_tables_rls.sql` and run it.
- This creates: `users`, `courses`, `blocks`, `assignments` and RLS policies.
- The trigger `on_auth_user_created` creates a row in `public.users` on signup; the **first** user gets role `org`, later users get `learner`. Change roles in Table Editor if needed (e.g. set one user to `teacher`).

## 3. Env vars

- In project root, copy `.env.example` to `.env`:
  ```bash
  cp .env.example .env
  ```
- In Supabase: **Settings** → **API** — copy **Project URL** and **anon public** key.
- In `.env` set:
  ```
  VITE_SUPABASE_URL=https://xxxx.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJ...
  ```
- Do not commit `.env`.

## 4. Install deps and run dev

```bash
npm install
npm run dev
```

If you see `Cannot find module '@supabase/supabase-js'`, run `npm install` again. If npm fails with cache permission errors, fix with: `sudo chown -R $(whoami) ~/.npm` then `npm install`.

Open http://localhost:5173.

## 5. Test flow

1. **Landing** → click “Get started” or go to `/login`.
2. **Login** → enter your email → “Send magic link” → check inbox for Supabase magic link.
3. Click the link (opens app); you should be redirected by role:
   - First user → **Org dashboard** (`/dashboard/org`).
   - Later users → **Learner dashboard** (`/dashboard/learner`) unless you change their role.
4. In Supabase **Table Editor** → `users`: set one user’s `role` to `teacher`, then sign in as that user (or use magic link again) → you should land on **Teacher dashboard** and access `/upload`.
5. **Protected routes**: try `/dashboard/org` as learner → should redirect to `/dashboard/learner`. Try `/upload` as learner → redirect to learner dashboard.

## 6. Roles summary

| Route               | Allowed role(s) |
|---------------------|-----------------|
| `/`, `/login`, `/signup` | public        |
| `/dashboard/org`    | org             |
| `/dashboard/teacher`| teacher         |
| `/dashboard/learner`| learner         |
| `/upload`           | teacher         |
| `/chat/:blockId`    | learner         |
