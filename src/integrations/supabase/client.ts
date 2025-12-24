import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://wjokjfaffcboifkxkhlz.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indqb2tqZmFmZmNib2lma3hraGx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MTc2MzAsImV4cCI6MjA4MjA5MzYzMH0._4KgZMyw1H7yc4iWV6sZoYHsEfvQL-FL_U415HTfPGg";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);