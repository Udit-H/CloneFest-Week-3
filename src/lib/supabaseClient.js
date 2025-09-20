import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ptgvzghuvmgblekaazhh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0Z3Z6Z2h1dm1nYmxla2FhemhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMDA1MTAsImV4cCI6MjA3Mzg3NjUxMH0.oDejvWr3hLqYTB7KVSYT_kYdDRi1rn_3zEqknbALVhI';

export const supabase = createClient(supabaseUrl, supabaseKey);