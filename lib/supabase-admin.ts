import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// NOTE: This key should ONLY be used server-side
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Debug: Log key status on first load
console.log('[supabase-admin] Service Key Status:', supabaseServiceKey ? 'LOADED ✅' : 'MISSING ❌');
console.log('[supabase-admin] Supabase URL:', supabaseUrl);

if (!supabaseServiceKey && typeof window === 'undefined') {
    console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY is missing. Server-side operations requiring admin privileges will fail.');
}

// Create Supabase Admin client with Service Role Key
// This bypasses Row Level Security (RLS)
export const supabaseAdmin = createClient(supabaseUrl || '', supabaseServiceKey || '', {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
