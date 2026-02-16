"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DebugRLSPage() {
    const [user, setUser] = useState<any>(null);
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [recruiters, setRecruiters] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [adminErrorDetails, setAdminErrorDetails] = useState<string | null>(null);

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

                    if (adminError) {
                        console.error("Admin Check Error:", adminError);
                        setAdminErrorDetails(adminError.message);
                    }
                    setIsAdmin(!!adminData);

                    // 3. Check Recruiters Access (With explicit status filter attempt first, then ALL)
                    const { data: recData, error: recError } = await supabase
                        .from('recruiters')
                        .select('*');

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

    if (!user) return <div className="p-8 text-white">Loading Auth... (If stuck, you are not logged in)</div>;

    return (
        <div className="p-8 bg-black text-white min-h-screen font-mono">
            <h1 className="text-2xl font-bold mb-8 border-b pb-4">RLS Debugger</h1>

            <div className="grid gap-8">
                {/* Auth Section */}
                <section className="border border-gray-800 p-6 rounded-xl bg-gray-900/50">
                    <h2 className="text-xl font-bold text-blue-400 mb-4">1. Authentication</h2>
                    <div className="space-y-2 text-sm text-gray-300">
                        <p>User ID: <span className="font-bold text-white">{user.id}</span></p>
                        <p>Email: <span className="font-bold text-white">{user.email}</span></p>
                    </div>
                </section>

                {/* Admin Status Section */}
                <section className="border border-gray-800 p-6 rounded-xl bg-gray-900/50">
                    <h2 className="text-xl font-bold text-yellow-400 mb-4">2. Admin Status</h2>
                    <div className="space-y-2">
                        <p className="text-lg">
                            Is Admin in DB? {' '}
                            {isAdmin === null ? (
                                <span className="text-gray-500">Checking...</span>
                            ) : isAdmin ? (
                                <span className="text-green-400 font-bold">YES ✅</span>
                            ) : (
                                <span className="text-red-500 font-bold">NO ❌</span>
                            )}
                        </p>
                        {adminErrorDetails && (
                            <div className="bg-red-500/10 border border-red-500/50 p-4 rounded text-red-400 text-xs mt-2">
                                Error checking admin status: {adminErrorDetails}
                            </div>
                        )}
                        {isAdmin === false && (
                            <div className="bg-red-500/10 border border-red-500/50 p-4 rounded text-red-200 text-sm mt-4">
                                <strong>Start Here:</strong> You are not in the 'admins' table.
                                <br />Row Level Security (RLS) policies block non-admins from viewing recruiter data.
                                <br /><br />
                                Please run the SQL migration I provided (`054_admin_fix_final.sql`) to insert yourself.
                            </div>
                        )}
                    </div>
                </section>

                {/* Data Fetch Section */}
                <section className="border border-gray-800 p-6 rounded-xl bg-gray-900/50">
                    <h2 className="text-xl font-bold text-green-400 mb-4">3. Recruiters Data (RLS Check)</h2>

                    {error ? (
                        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded text-red-400">
                            <strong>Fetch Error:</strong> {error}
                            <p className="text-xs mt-2 opacity-70">
                                This usually means RLS policies denied access.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-xl">
                                Total Records Found: <span className="font-bold text-white">{recruiters.length}</span>
                            </p>

                            {recruiters.length > 0 ? (
                                <div className="bg-black border border-gray-800 rounded-lg p-4 overflow-auto max-h-96">
                                    <pre className="text-xs text-green-300">
                                        {JSON.stringify(recruiters, null, 2)}
                                    </pre>
                                </div>
                            ) : (
                                <div className="text-gray-500 italic">
                                    No records found. Either the table is empty, or RLS is hiding them.
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
