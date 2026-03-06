import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn(
    '[Lumen] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Add them in .env (see .env.example).'
  );
}

export const supabase = createClient(url ?? '', anonKey ?? '');
