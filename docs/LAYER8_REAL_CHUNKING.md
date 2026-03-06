# Layer 8: Real chunking + parent–child hierarchy — test steps

## 1. Dependencies

```bash
npm install
```

Adds: `jszip`, `pdf-lib`, `pdfjs-dist`, `@ffmpeg/ffmpeg`. No SQL changes (courses/blocks stay flat: course = parent, blocks = children with `course_id`).

## 2. pdfjs-dist worker (optional)

If PDF chunking fails in browser (e.g. worker errors), set the worker in your app entry or in `chunk.ts` before `getDocument`:

```ts
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();
```

Or use a CDN worker URL. If omitted, some environments still work without a worker.

## 3. Chunking behavior

- **ZIP:** JSZip unzips; first PDF or audio/video file is processed; parent title = ZIP filename.
- **PDF:** pdfjs-dist loads document, reads `numPages`, splits into chunks of 5–8 pages; children titled "Section 1", "Section 2", … with `pageStart`/`pageEnd` in assets.
- **Audio:** `AudioContext.decodeAudioData` gives duration; segments of 5 min (300 s); children "Part 1", "Part 2", …
- **Video:** FFmpeg WASM load + write file (optional); segment count is mock (fallback). For production, wire real duration/trim later.
- **Fallback:** On any error (e.g. PDF load fail, no worker), result falls back to mock (random section titles, 4–8 blocks).

## 4. Upload UI

- **Drop zone:** Same as before; while processing, a **spinner** and "Processing…" show.
- **Preview:** **Parent card** (collapsible): title + "N blocks". Click to expand/collapse.
- **Children list:** Icon (by type), title, duration, asset labels (e.g. pdf, audio). Shown when expanded.
- **Approve & Save:** Only **org** can save (button disabled for teacher; message: "Only org can save."). On success: "Course and blocks saved." On failure: error toast/message.

## 5. Save to Supabase

- **Org** clicks "Approve & Save" → `saveCourseToSupabase(result, user.id)`.
- Inserts **course** row: `org_id` = current user, `title` = `result.parent.title`; gets `course_id`.
- Inserts **blocks** for each `result.children`: `id` = child id (uuid from chunk), `course_id`, `title`, `type`, `duration_sec`, `assets`.
- No assignment changes (optional later).

## 6. Test: PDF → hierarchy → save

1. Log in as **org** (or as teacher to test chunking only; switch to org to test save).
2. Go to **/upload**.
3. Upload a **PDF** (e.g. 20+ pages). Wait for spinner → preview with parent card and expandable "Section 1", "Section 2", … (and duration/asset type).
4. Collapse/expand the parent card; confirm children list and icons.
5. As **org**, click **Approve & Save** → "Course and blocks saved."
6. In Supabase **Table Editor**: `courses` has new row; `blocks` has N rows with that `course_id`, titles "Section 1", …
7. As **learner** (assigned to that course), dashboard or chat can show these blocks (existing flows).

## 7. WASM note

`@ffmpeg/ffmpeg` is used for video; loading and running FFmpeg in the browser can be slow. Video chunking currently falls back to mock segments if WASM is heavy or fails. For production, consider server-side trimming or a lighter client path.
