"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DebugRLSPage() {
    const [user, setUser] = useState<any>(null);
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [recruiters, setRecruiters] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function check() {
            try {
                // 1. Check Auth
                const { data: { user } } = await supabase.auth.getUser();
                setUser(user);

                if (user) {
                    // 2. Check Admin Status
                    const { data: adminData, error: adminError } = await supabase
                        .from('admins')
                        .select('*')
                        .eq('user_id', user.id)
                        .maybeSingle();

                    if (adminError) console.error("Admin Check Error:", adminError);
                    setIsAdmin(!!adminData);

                    // 3. Check Recruiters Access
                    const { data: recData, error: recError } = await supabase
                        .from('recruiters')
                        .select('*'); // Try to fetch ALL

                    if (recError) {
                        console.error("Recruiter Fetch Error:", recError);
                        setError(recError.message);
                    } else {
                        setRecruiters(recData || []);
                    }
                }
            } catch (err: any) {
                setError(err.message);
            }
        }
        check();
    }, []);

    return (
        <div className="p-8 bg-black text-white min-h-screen font-mono">
            <h1 className="text-2xl font-bold mb-4">RLS Debugger</h1>

            <div className="space-y-4">
                <section className="border p-4 rounded">
                    <h2 className="text-xl font-bold text-blue-400">1. Authentication</h2>
                    <p>User ID: {user?.id || 'Not Types'}</p>
                    <p>Email: {user?.email}</p>
                </section>

                <section className="border p-4 rounded">
                    <h2 className="text-xl font-bold text-yellow-400">2. Admin Status</h2>
                    <p>Is Admin in DB: {isAdmin === null ? 'Checking...' : isAdmin ? 'YES ✅' : 'NO ❌'}</p>
                    {isAdmin === false && <p className="text-red-500">You are NOT in the admins table. RLS will block you.</p>}
                </section>

                <section className="border p-4 rounded">
                    <h2 className="text-xl font-bold text-green-400">3. Recruiters Data (RLS Check)</h2>
                    {error ? (
                        <p className="text-red-500">Error: {error}</p>
                    ) : (
                        <>
                            <p>Count: {recruiters.length}</p>
                            <pre className="text-xs mt-2 bg-gray-900 p-2 overflow-auto max-h-60">
                                {JSON.stringify(recruiters, null, 2)}
                            </pre>
                        </>
                    )}
                </section>
            </div>
        </div>
    );
}
