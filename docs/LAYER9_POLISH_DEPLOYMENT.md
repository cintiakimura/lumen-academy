# Layer 9: Polish + deployment prep

## 1. Video chunking (chunk.ts)

- **Duration:** Uses a `<video>` element with `preload="metadata"` and an object URL to read `video.duration` (no FFmpeg WASM in browser).
- **Segments:** Same pattern as audio: segment length 5 min (or ~total/8), segments titled "Segment 1", "Segment 2", …
- **Fallback:** If metadata fails or duration is NaN, uses 600 s total.
- **Comment in code:** Notes that a future Vercel serverless (e.g. `/api/video-chunk`) can do full FFmpeg-based split and return segment list.

## 2. Learner Dashboard (nested display)

- Fetches **assignments** for the current user, then **courses** and **blocks** for those assignments.
- **Nested UI:** One collapsible card per course (title + progress %). Expand to see child blocks.
- Each block is a link to `/chat/:blockId`; blocks in `assignment.progress` are shown with a checkmark and green background.
- First course starts expanded.

## 3. Vercel config

- **vercel.json:** `buildCommand`, `outputDirectory: "dist"`, `framework: "vite"`, and a single rewrite `(.*) → /index.html` for SPA routing.
- **.env.example:** Updated with a short note to use Vercel Dashboard for env vars and to copy to `.env.local` for local dev.

## 4. Mobile tweaks (no Tailwind)

- **index.css:** Buttons use `min-height: 48px` and `min-width: 48px`. `.page` padding steps: 1rem → 1.25rem at 640px → 1.5rem at 768px.
- **Touch:** `@media (pointer: coarse)` adds 48px min size for `button`, `a[role="button"]`, and `.tap-target` so tap targets are large on touch devices.
- Voice and other action buttons already use 48px in Chat/Upload; no extra classes required.

## 5. Error boundary

- **components/ErrorBoundary.tsx:** Class component with `getDerivedStateFromError` and `componentDidCatch`. Renders a simple “Something went wrong” message and a “Try again” button that clears error state.
- **App.tsx:** Root content is wrapped in `<ErrorBoundary>` so any uncaught error in the tree shows the fallback instead of a blank screen.

## 6. Vercel deployment steps

1. Push the repo to GitHub (or connect another Git provider in Vercel).
2. In Vercel: **New Project** → import the repo.
3. **Framework Preset:** Vite (or leave auto).
4. **Build Command:** `npm run build` (or leave default).
5. **Output Directory:** `dist`.
6. **Environment Variables:** Add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and optionally `VITE_API_URL`. For the Grok proxy, add `XAI_API_KEY` (server-side).
7. Deploy. The rewrite in `vercel.json` sends all routes to `index.html` for client-side routing.
8. **API routes:** Ensure `api/grok-proxy.ts` lives in the repo; Vercel will deploy it as a serverless function.

## 7. Test checklist

- **Mobile view:** Resize to 375px or use DevTools device mode; confirm cards and buttons are readable and tap targets feel large.
- **Nested courses:** As a learner with assignments, open **Learner Dashboard**; expand/collapse courses and open blocks; confirm progress % and completed state.
- **Video upload:** Upload a short video in **CourseBox**; confirm duration-based segments in the preview (and optional save as org).
- **Error boundary:** Temporarily throw in a page (e.g. `throw new Error('test')`) and confirm the fallback UI and “Try again” appear.
