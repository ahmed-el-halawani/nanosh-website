import { createClient } from '@supabase/supabase-js';

// The URL + anon key are public by design (RLS protects the data). Defaults let
// the app run even when VITE_SUPABASE_* env vars aren't configured (e.g. a fresh
// Vercel deploy); set the env vars to override.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://wkxftfdwdxtzqgmgjdtn.supabase.co';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndreGZ0ZmR3ZHh0enFnbWdqZHRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNzY2MDEsImV4cCI6MjA5ODY1MjYwMX0.kEOul8jC4Hppcx3Rad34of8p291DhstKhQTrhKSh6q8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
