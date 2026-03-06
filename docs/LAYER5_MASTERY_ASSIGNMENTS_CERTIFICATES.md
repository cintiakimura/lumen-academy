# Layer 5: Real blocks, mastery gate, assignments, certificates — test steps

## 1. Run migrations

In Supabase SQL Editor, run `supabase/migrations/003_assignments_progress_rls.sql` so `assignments` has `progress` (jsonb array of block_ids) and learners can update their own row.

## 2. Install deps

```bash
npm install
```

(jspdf, jspdf-autotable were added for certificates.)

## 3. Teacher: create course + blocks (via Upload or SQL)

- Option A: Log in as **teacher**, go to **Upload**, drop a file, get a course (mock save doesn’t persist to Supabase yet — see CourseBox save in Layer 2).
- Option B: In Supabase Table Editor, insert a **course** (set `org_id` to an org user’s id), then insert **blocks** with `course_id` = that course’s id. Copy a block `id` (UUID) for the next step.

## 4. Teacher: assign learner to course

- Go to **Teacher Dashboard** (`/dashboard/teacher`).
- Click a **course** (or create one via SQL as above).
- Click **Load learners** to fetch users with role `learner`.
- Enter a learner’s **email** (or pick from the list) and click **Assign**.
- Confirm the learner appears in the list with **progress %** (e.g. 0%).

## 5. Learner: open block and chat until mastery

- Log in as that **learner**.
- Open **`/chat/:blockId`** with a real block UUID from step 3 (e.g. `/chat/550e8400-e29b-41d4-a716-446655440000`).
- Send **5+ clear messages** (e.g. > 20 chars, no “um”/“uh”). Avoid repeating the same question; keep hesitation count &lt; 2.
- After ~5–10 turns with high clarity and low hesitation, the **mastery gate** should show: “Looks like you’ve got this! Ready for next?” with **Next** and **Get Certificate**.

## 6. Get certificate

- With mastery visible, click **Get Certificate**.
- A PDF should download (e.g. `block-title-certificate.pdf`) with “Certificate of Completion”, block title, learner email, date, “Strong Mastery”, and a signature line.

## 7. Next → progress

- Click **Next**.
- The app appends the block id to that learner’s **assignment progress** for the course and redirects to **Learner Dashboard**.
- As **teacher**, reopen the course: the learner’s **progress %** should increase (e.g. 1 block of 5 = 20%).

## Mastery rules (simplified)

- **Turns** ≥ 5.
- **Hesitation** &lt; 2 (messages with “um”/“uh” or very long).
- **Clarity** ≥ 80% of user messages (length &gt; 20, no hesitation).
- **Repeats** &lt; 2 (similar/duplicate questions).
- When all are satisfied, **mastery** is true and **Next** is enabled.
