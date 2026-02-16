'use client';

import { useEffect, useState } from 'react';
import { authService } from '@/lib/services/auth.service';
import { AlertOctagon, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';

/**
 * SuspendedCheck - Wraps student pages to check if user is suspended
 * If suspended, shows a full-screen block message
 */
export function SuspendedCheck({ children }: { children: React.ReactNode }) {
    const [isSuspended, setIsSuspended] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const router = useRouter();

    useEffect(() => {
        let didTimeout = false;

        // Timeout fallback — show the page after 3s even if auth is slow
        const timer = setTimeout(() => {
            didTimeout = true;
            setIsChecking(false);
        }, 3000);

        async function checkStatus() {
            try {
                const user = await authService.getCurrentUser();
                if (!didTimeout && user?.isSuspended) {
                    setIsSuspended(true);
                }
            } catch (error) {
                console.error('Error checking suspension status:', error);
            } finally {
                clearTimeout(timer);
                setIsChecking(false);
            }
        }
        checkStatus();

        return () => clearTimeout(timer);
    }, []);

    const handleLogout = async () => {
        await authService.logout();
        router.push('/login');
    };

    // Show nothing while checking (prevents flash)
    if (isChecking) {
        return null;
    }

    // If suspended, show block screen
    if (isSuspended) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
                <div className="max-w-sm w-full bg-gray-900 rounded-3xl p-8 text-center shadow-2xl border border-red-500/30">
                    {/* Warning Icon */}
                    <div className="h-20 w-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertOctagon className="h-10 w-10 text-red-500" />
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-white mb-3">
                        Account Suspended
                    </h1>

                    {/* Message */}
                    <p className="text-gray-400 mb-6 leading-relaxed">
                        Your account has been suspended by the administrator.
                        Please contact support for assistance.
                    </p>

                    {/* Support Email */}
                    <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
                        <p className="text-sm text-gray-500 mb-1">Contact Support</p>
                        <a
                            href="mailto:support@backbenchers.com"
                            className="text-primary font-semibold hover:underline"
                        >
                            support@backbenchers.com
                        </a>
                    </div>

                    {/* Logout Button */}
                    <Button
                        onClick={handleLogout}
                        className="w-full h-12 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl"
                    >
                        <LogOut className="h-5 w-5 mr-2" />
                        Sign Out
                    </Button>
                </div>
            </div>
        );
    }

    // Not suspended, render children normally
    return <>{children}</>;
}
