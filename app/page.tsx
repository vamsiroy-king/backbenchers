"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    async function handleEntry() {
      if (typeof window === 'undefined') return;

      try {
        const { supabase } = await import('@/lib/supabase');

        // Check for OAuth callback parameters
        const urlParams = new URLSearchParams(window.location.search);
        const hasCode = urlParams.has('code');
        const hasAccessToken = window.location.hash?.includes('access_token');

        if (hasCode || hasAccessToken) {
          // Handle OAuth callback
          if (hasCode) {
            try { await supabase.auth.exchangeCodeForSession(urlParams.get('code')!); }
            catch (e) { console.error(e); }
          }

          const { data: sessionData } = await supabase.auth.getSession();
          const session = sessionData?.session;

          // Clear OAuth params from URL
          window.history.replaceState({}, '', '/');

          if (session) {
            // Check if user has a student profile
            const { data: student } = await supabase
              .from('students').select('id, status').eq('user_id', session.user.id).maybeSingle();

            let foundStudent = student;
            if (!foundStudent && session.user.email) {
              const { data: studentByEmail } = await supabase
                .from('students').select('id, status, user_id').eq('email', session.user.email.toLowerCase()).maybeSingle();
              if (studentByEmail) {
                if (studentByEmail.user_id !== session.user.id) {
                  await supabase.from('students').update({ user_id: session.user.id }).eq('id', studentByEmail.id);
                }
                foundStudent = studentByEmail;
              }
            }

            // Redirect based on student status
            if (foundStudent) {
              router.replace(foundStudent.status === 'suspended' ? '/suspended' : '/dashboard');
            } else {
              router.replace('/verify');
            }
            return;
          }
        }

        // No OAuth callback - redirect directly to dashboard
        router.replace('/dashboard');

      } catch (e) {
        console.error(e);
        router.replace('/dashboard');
      }
    }

    handleEntry();
  }, [router]);

  // No loader - just blank screen for instant redirect feel
  return <div className="min-h-screen bg-black" />;
}
