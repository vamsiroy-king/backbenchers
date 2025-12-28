// Supabase Client for Backbenchers
// This is the single source of truth for Supabase connection

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
        'Missing Supabase environment variables. Please create .env.local with:\n' +
        'NEXT_PUBLIC_SUPABASE_URL=your_url\n' +
        'NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key'
    );
}

// Custom storage for PWA compatibility (uses localStorage explicitly)
const customStorage = typeof window !== 'undefined' ? {
    getItem: (key: string) => localStorage.getItem(key),
    setItem: (key: string, value: string) => localStorage.setItem(key, value),
    removeItem: (key: string) => localStorage.removeItem(key),
} : undefined;

// Create Supabase client with explicit localStorage for PWA session persistence
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: customStorage,
        storageKey: 'backbenchers-auth', // Custom key to avoid conflicts
        flowType: 'pkce', // Secure PKCE flow for auth
    },
});

// Helper to get current user
export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

// Helper to get current session
export async function getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

// Auth state change listener
export function onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
}

// Storage helpers
export const storage = {
    // Upload file to a bucket
    async uploadFile(bucket: string, path: string, file: File) {
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (error) throw error;
        return data;
    },

    // Get public URL for a file
    getPublicUrl(bucket: string, path: string) {
        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);
        return data.publicUrl;
    },

    // Get signed URL for private files
    async getSignedUrl(bucket: string, path: string, expiresIn = 3600) {
        const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(path, expiresIn);

        if (error) throw error;
        return data.signedUrl;
    },

    // Delete file
    async deleteFile(bucket: string, path: string) {
        const { error } = await supabase.storage
            .from(bucket)
            .remove([path]);

        if (error) throw error;
    }
};

// Realtime subscription helper
export function subscribeToTable(
    table: string,
    callback: (payload: any) => void,
    filter?: { column: string; value: string }
) {
    let channel = supabase
        .channel(`${table}-changes`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: table,
                ...(filter && { filter: `${filter.column}=eq.${filter.value}` })
            },
            callback
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}

export default supabase;
