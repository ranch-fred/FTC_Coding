import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'missing-key',
);
export const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
