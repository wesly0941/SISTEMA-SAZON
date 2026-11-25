import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://smmmynjbxuasfslgdwtk.supabase.co';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_dk4Ca_QZdpaB_WQk7xLr_A_UCFj0YXV';

export const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
