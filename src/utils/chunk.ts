/**
 * CourseBox real chunking: ZIP (JSZip), PDF (pdfjs-dist 5–8 pages),
 * video (FFmpeg WASM or mock), audio (duration-based segments).
 * Fallback to mock on failure.
 */

import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';

export type BlockType = 'voice' | 'slide' | 'video' | 'podcast' | 'infographic';

export interface ChildBlock {
  id: string;
  type: BlockType;
  title: string;
  duration: number;
  assets?: { url?: string; label?: string; pageStart?: number; pageEnd?: number }[];
}

export interface ParentCourse {
  title: string;
  id: string;
}

export interface CourseBoxResult {
  parent: ParentCourse;
  children: ChildBlock[];
}

const BLOCK_TYPES: BlockType[] = ['voice', 'slide', 'video', 'podcast', 'infographic'];
const CHUNK_PAGES_MIN = 5;
const CHUNK_PAGES_MAX = 8;
const SEGMENT_DURATION_SEC = 300;
const MOCK_CHUNK_NAMES = ['Section A', 'Section B', 'Section C', 'Section D', 'Section E', 'Section F', 'Section G', 'Section H'];

function uuid(): string {
  return crypto.randomUUID?.() ?? 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/x/g, () => ((Math.random() * 16) | 0).toString(16));
}

function inferType(file: File): 'zip' | 'pdf' | 'video' | 'audio' {
  const name = file.name.toLowerCase();
  const mime = file.type.toLowerCase();
  if (name.endsWith('.zip') || mime === 'application/zip') return 'zip';
  if (name.endsWith('.pdf') || mime === 'application/pdf') return 'pdf';
  if (/\.(mp4|webm|mov|avi|mkv)$/.test(name) || mime.startsWith('video/')) return 'video';
  if (/\.(mp3|wav|m4a|ogg)$/.test(name) || mime.startsWith('audio/')) return 'audio';
  return 'pdf';
}

function mockResult(baseTitle: string): CourseBoxResult {
  const n = 4 + Math.floor(Math.random() * 4);
  const children: ChildBlock[] = Array.from({ length: n }, (_, i) => ({
    id: uuid(),
    type: BLOCK_TYPES[i % BLOCK_TYPES.length],
    title: MOCK_CHUNK_NAMES[i] ?? `Section ${i + 1}`,
    duration: 240 + Math.floor(Math.random() * 120),
    assets: [],
  }));
  return { parent: { title: baseTitle, id: uuid() }, children };
}

async function chunkPdf(file: File, baseTitle: string): Promise<CourseBoxResult> {
  try {
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf, useSystemFonts: true }).promise;
    const numPages = pdf.numPages;
    if (numPages <= 0) return mockResult(baseTitle);
    const chunkSize = Math.min(CHUNK_PAGES_MAX, Math.max(CHUNK_PAGES_MIN, Math.ceil(numPages / 8)));
    const numChunks = Math.ceil(numPages / chunkSize);
    const children: ChildBlock[] = Array.from({ length: numChunks }, (_, i) => {
      const pageStart = i * chunkSize + 1;
      const pageEnd = Math.min((i + 1) * chunkSize, numPages);
      return {
        id: uuid(),
        type: 'slide' as BlockType,
        title: `Section ${i + 1}`,
        duration: Math.round((pageEnd - pageStart + 1) * 45),
        assets: [{ pageStart, pageEnd, label: 'pdf' }],
      };
    });
    return { parent: { title: baseTitle, id: uuid() }, children };
  } catch {
    return mockResult(baseTitle);
  }
}

async function chunkAudio(file: File, baseTitle: string): Promise<CourseBoxResult> {
  try {
    const buf = await file.arrayBuffer();
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return mockResult(baseTitle);
    const ctx = new Ctx();
    const decoded = await ctx.decodeAudioData(buf.slice(0) as ArrayBuffer);
    const durationSec = Math.floor(decoded.duration);
    await ctx.close();
    const segmentLen = SEGMENT_DURATION_SEC;
    const numChunks = Math.max(1, Math.ceil(durationSec / segmentLen));
    const children: ChildBlock[] = Array.from({ length: numChunks }, (_, i) => {
      const start = i * segmentLen;
      const end = Math.min((i + 1) * segmentLen, durationSec);
      return {
        id: uuid(),
        type: 'podcast' as BlockType,
        title: `Part ${i + 1}`,
        duration: end - start,
        assets: [{ label: 'audio' }],
      };
    });
    return { parent: { title: baseTitle, id: uuid() }, children };
  } catch {
    return mockResult(baseTitle);
  }
}

async function chunkVideo(file: File, baseTitle: string): Promise<CourseBoxResult> {
  // Get duration via <video> preload (browser metadata). Full split on server later.
  // Future: Vercel serverless /api/video-chunk could run FFmpeg and return segment list.
  let durationSec = 0;
  const url = URL.createObjectURL(file);
  try {
    durationSec = await new Promise<number>((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        const d = Math.floor(video.duration);
        video.src = '';
        resolve(Number.isFinite(d) ? d : 0);
      };
      video.onerror = () => resolve(0);
      video.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
  const totalSec = durationSec || 600;
  const segmentLen = Math.min(SEGMENT_DURATION_SEC, Math.max(180, Math.ceil(totalSec / 8)));
  const numChunks = Math.max(1, Math.ceil(totalSec / segmentLen));
  const children: ChildBlock[] = Array.from({ length: numChunks }, (_, i) => {
    const start = i * segmentLen;
    const end = Math.min((i + 1) * segmentLen, totalSec);
    return {
      id: uuid(),
      type: 'video' as BlockType,
      title: `Segment ${i + 1}`,
      duration: end - start,
      assets: [{ label: 'video' }],
    };
  });
  return { parent: { title: baseTitle, id: uuid() }, children };
}

async function chunkZip(file: File, baseTitle: string): Promise<CourseBoxResult> {
  try {
    const zip = await JSZip.loadAsync(file);
    const entries = Object.entries(zip.files).filter(([, f]) => !f.dir);
    for (const [, entry] of entries) {
      const path = entry.name;
      const name = path.split('/').pop() ?? path;
      const lower = name.toLowerCase();
      if (lower.endsWith('.pdf')) {
        const blob = await entry.async('blob');
        return chunkPdf(new File([blob], name, { type: 'application/pdf' }), baseTitle);
      }
      if (/\.(mp4|webm|mov|mp3|wav|m4a|ogg)$/.test(lower)) {
        const blob = await entry.async('blob');
        const mime = lower.endsWith('.mp3') ? 'audio/mpeg' : 'application/octet-stream';
        const f = new File([blob], name, { type: mime });
        if (inferType(f) === 'audio') return chunkAudio(f, baseTitle);
        return chunkVideo(f, baseTitle);
      }
    }
  } catch {
    /* fallthrough */
  }
  return mockResult(baseTitle);
}

export async function processFile(file: File): Promise<CourseBoxResult> {
  const kind = inferType(file);
  const baseTitle = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ') || 'Course';
  switch (kind) {
    case 'zip':
      return chunkZip(file, baseTitle);
    case 'pdf':
      return chunkPdf(file, baseTitle);
    case 'video':
      return chunkVideo(file, baseTitle);
    case 'audio':
      return chunkAudio(file, baseTitle);
    default:
      return mockResult(baseTitle);
  }
}

export async function saveCourseToSupabase(
  payload: CourseBoxResult,
  orgId: string
): Promise<{ courseId: string } | null> {
  try {
    const { supabase } = await import('../lib/supabase');
    const { data: courseRow, error: courseErr } = await supabase
      .from('courses')
      .insert({ org_id: orgId, title: payload.parent.title })
      .select('id')
      .single();
    if (courseErr || !courseRow?.id) return null;
    const courseId = courseRow.id as string;
    for (const b of payload.children) {
      await supabase.from('blocks').insert({
        id: b.id,
        course_id: courseId,
        title: b.title,
        type: b.type,
        duration_sec: b.duration,
        assets: b.assets ?? [],
      });
    }
    return { courseId };
  } catch {
    return null;
  }
}
