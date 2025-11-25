
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zvtkkdjawdqrgpawghni.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2dGtrZGphd2RxcmdwYXdnaG5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNDY2NDAsImV4cCI6MjA3OTYyMjY0MH0.p4OqCcl_LrIey0EppJnEYNEzVCLf2kFZNwuqDqvoJlo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
