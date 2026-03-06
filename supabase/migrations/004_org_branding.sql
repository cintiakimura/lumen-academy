-- Org branding: primary color + logo URL (org = user with role 'org', updates own row)
-- Run after 002 and 003.

alter table public.users
  add column if not exists primary_color text default '#4A90E2',
  add column if not exists logo_url text;

comment on column public.users.primary_color is 'Org branding: primary accent (hex)';
comment on column public.users.logo_url is 'Org branding: logo URL (e.g. Supabase storage public URL)';

-- RLS: org already has users_update_own (auth.uid() = id), so they can update primary_color and logo_url.
-- No new policy needed.

-- Storage: create bucket 'branding' in Supabase Dashboard (Storage → New bucket → name: branding, Public).
-- Then add policy for uploads (e.g. "Allow authenticated upload to branding/{user_id}/*"):
--   storage.objects: insert with check (bucket_id = 'branding' and (storage.foldername(name))[1] = auth.uid()::text);
--   storage.objects: select for public read if bucket is public.
