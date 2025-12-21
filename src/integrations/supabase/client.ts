import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://lqwkjskhhposmlbrenca.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxxd2tqc2toaHBvc21sYnJlbmNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNjA1NjMsImV4cCI6MjA4MTYzNjU2M30.aQBpWfOzjFo9Ps5H1aGD8799xU3c79nt5Yfq_BSGjeA";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);