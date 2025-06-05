import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://yuclovlxeawtmwopovth.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1Y2xvdmx4ZWF3dG13b3BvdnRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1NTc5ODIsImV4cCI6MjA2MDEzMzk4Mn0.Bq0C60j7Sa9W_3Ony7lci88EqpelfX2MWSyF5s8D4_c";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);