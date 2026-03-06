# Layer 6: Org dashboard + branding — test steps

## 1. Run migration

In Supabase SQL Editor, run `supabase/migrations/004_org_branding.sql` so `users` has `primary_color` and `logo_url`.

## 2. Storage bucket (for logo upload)

In Supabase Dashboard → **Storage** → **New bucket**:

- Name: `branding`
- Public: **Yes** (so logo URLs are publicly readable)

Then add a policy so the org user can upload:

- **Storage** → **Policies** → **New policy** (or use SQL in Editor):

```sql
-- Allow authenticated users to upload to their own folder in 'branding'
create policy "Branding upload"
on storage.objects for insert
with check (
  bucket_id = 'branding'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read if bucket is public (often default)
create policy "Branding public read"
on storage.objects for select
using (bucket_id = 'branding');
```

## 3. Sign in as org

- Use an account with role **org** (e.g. the first user, or set `role = 'org'` in `users` for your account).
- Open **/dashboard/org**.

## 4. Branding

- **Primary color:** Change the hex (e.g. `#2E7D32`), click **Save branding**.
- **Logo:** Choose an image file, click **Save branding**.
- Confirm the header shows your logo and that buttons/accents use the new color (e.g. green). Navigate to another page and back to confirm CSS vars apply globally.

## 5. Overview cards

- **Total courses:** Count of courses.
- **Active learners:** Distinct learners with at least one assignment.
- **Avg completion %:** Average of (progress.length / block_count) across all assignments.

Use seed data (courses, blocks, assignments with `progress`) if needed to see non-zero values.

## 6. Filters

- **All courses:** Shows all courses in the table.
- **Course:** Pick one → table shows only that course.
- **Learner:** Pick one → table shows only courses that learner is assigned to.
- **Teacher:** Dropdown is present; filtering by teacher is for future use (when courses are linked to teachers).

## 7. Courses table

- **Course:** Title.
- **Completion %:** Per-course average of assignment completion (progress length / block count).
- **Learners:** Number of assignments for that course.
- **Trouble blocks:** Up to 3 block titles with the lowest completion count in that course (least often completed).

## 8. CSS var application

`BrandingProvider` (in `main.tsx`) runs when the user is **org**. It loads `primary_color` and `logo_url` from `users` and sets:

- `document.documentElement.style.setProperty('--accent', primaryColor)`
- `document.documentElement.style.setProperty('--accent-hover', darkenHex(primaryColor, 0.1))`

So any component using `var(--accent)` or `var(--accent-hover)` (e.g. buttons, links in `index.css`) will follow org branding. When the user is not org, the provider resets these to the default `#4A90E2` / `#3a7bc8`.
