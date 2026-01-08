"use client";

import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Instagram, Twitter, Linkedin, Heart } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/services/auth.service";

const WORDS = ["Discounts", "Deals", "Savings"];

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPageWrapper() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function check() {
      if (typeof window === 'undefined') return;

      try {
        const { supabase } = await import('@/lib/supabase');

        const urlParams = new URLSearchParams(window.location.search);
        const hasCode = urlParams.has('code');
        const hasAccessToken = window.location.hash?.includes('access_token');

        if (hasCode || hasAccessToken) {
          if (hasCode) {
            try { await supabase.auth.exchangeCodeForSession(urlParams.get('code')!); }
            catch (e) { console.error(e); }
          }

          const { data: sessionData } = await supabase.auth.getSession();
          const session = sessionData?.session;
          window.history.replaceState({}, '', '/');

          if (session) {
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

            window.location.href = foundStudent
              ? (foundStudent.status === 'suspended' ? '/suspended' : '/dashboard')
              : '/verify';
            return;
          }
          setChecking(false);
          return;
        }

        const user = await authService.getCurrentUser();
        if (user?.role === 'student' && !user.isSuspended) { router.replace('/dashboard'); return; }
        if (user?.role === 'pending') { window.location.href = '/verify'; return; }
      } catch (e) { console.error(e); }
      setChecking(false);
    }
    check();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="h-10 w-10 rounded-xl bg-green-500 flex items-center justify-center"
        >
          <span className="text-black font-bold">B</span>
        </motion.div>
      </div>
    );
  }

  return <LandingPage />;
}

function LandingPage() {
  const [wordIdx, setWordIdx] = useState(0);

  useEffect(() => {
    const i = setInterval(() => setWordIdx(p => (p + 1) % WORDS.length), 2500);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="min-h-screen bg-black flex justify-center">
      <div className="w-full max-w-[430px] min-h-screen bg-black flex flex-col">

        {/* Header */}
        <header className="px-5 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-green-500 flex items-center justify-center">
                <span className="text-black font-bold text-sm">B</span>
              </div>
              <span className="text-white font-semibold">Backbenchers</span>
            </div>
            <Link href="/login" className="text-sm text-white/50">Sign in</Link>
          </div>
        </header>

        {/* Hero - Compact & Clean */}
        <section className="flex-1 flex flex-col justify-center px-5 py-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-white text-[13px] font-medium mb-1">India's 1st</p>
            <h1 className="text-[44px] leading-[0.95] font-extrabold text-white tracking-tight">
              Student
            </h1>
            <div className="h-[48px] overflow-hidden">
              <motion.div
                key={wordIdx}
                initial={{ y: 48 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="text-[44px] leading-[0.95] font-extrabold text-green-500 tracking-tight"
              >
                {WORDS[wordIdx]}
              </motion.div>
            </div>
            <p className="text-white text-[13px] font-medium mt-1 mb-6">Platform</p>

            <div className="space-y-2.5">
              <Link href="/signup">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  className="w-full h-[50px] bg-green-500 text-black font-semibold rounded-2xl flex items-center justify-center gap-2"
                >
                  Get Started <ArrowRight className="h-4 w-4" />
                </motion.button>
              </Link>
              <Link href="/dashboard">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  className="w-full h-[50px] text-white/60 font-medium rounded-2xl border border-white/10"
                >
                  Explore
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Simple Value Prop - Centered */}
        <section className="px-5 py-10">
          <Reveal>
            <div className="text-center">
              <h2 className="text-[24px] leading-[1.1] font-bold text-white">Verify once.</h2>
              <h2 className="text-[24px] leading-[1.1] font-bold text-white/20">Save forever.</h2>
            </div>
          </Reveal>
        </section>

        {/* BACKBENCHERS + Footer - Same Section */}
        <footer className="mt-auto">
          {/* BACKBENCHERS - Centered */}
          <div className="py-8 flex items-center justify-center">
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-[38px] leading-[1] font-extrabold tracking-tight italic text-center"
            >
              <span className="text-white">BACK</span>
              <span className="text-green-500">BENCHERS</span>
            </motion.h2>
          </div>

          {/* Footer Links */}
          <div className="px-5 pt-4 pb-6 border-t border-white/[0.04]">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <p className="text-[10px] text-green-500/60 font-semibold uppercase tracking-widest mb-2">Platform</p>
                <div className="space-y-1.5">
                  <Link href="/signup" className="block text-[12px] text-white/40 hover:text-white transition-colors">Sign Up</Link>
                  <Link href="/login" className="block text-[12px] text-white/40 hover:text-white transition-colors">Login</Link>
                  <Link href="/dashboard" className="block text-[12px] text-white/40 hover:text-white transition-colors">Explore</Link>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-green-500/60 font-semibold uppercase tracking-widest mb-2">Merchants</p>
                <div className="space-y-1.5">
                  <Link href="/merchant" className="block text-[12px] text-white/40 hover:text-white transition-colors">Partner</Link>
                  <Link href="/merchant/auth/login" className="block text-[12px] text-white/40 hover:text-white transition-colors">Login</Link>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-green-500/60 font-semibold uppercase tracking-widest mb-2">Legal</p>
                <div className="space-y-1.5">
                  <Link href="/privacy" className="block text-[12px] text-white/40 hover:text-white transition-colors">Privacy</Link>
                  <Link href="/terms" className="block text-[12px] text-white/40 hover:text-white transition-colors">Terms</Link>
                </div>
              </div>
            </div>

            {/* Socials */}
            <div className="flex items-center gap-2 mb-4">
              <Link href="https://instagram.com" target="_blank" className="h-9 w-9 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center hover:bg-green-500/10 transition-colors">
                <Instagram className="h-3.5 w-3.5 text-white/40" />
              </Link>
              <Link href="https://twitter.com" target="_blank" className="h-9 w-9 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center hover:bg-green-500/10 transition-colors">
                <Twitter className="h-3.5 w-3.5 text-white/40" />
              </Link>
              <Link href="https://linkedin.com" target="_blank" className="h-9 w-9 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center hover:bg-green-500/10 transition-colors">
                <Linkedin className="h-3.5 w-3.5 text-white/40" />
              </Link>
            </div>

            {/* Copyright */}
            <div className="pt-4 border-t border-white/[0.04] flex flex-col items-center gap-1 text-center">
              <p className="text-[10px] text-white/20">© 2024 Backbenchers. All rights reserved.</p>
              <p className="text-[10px] text-white/25 flex items-center gap-1">
                Made with <Heart className="h-2 w-2 text-red-400 fill-red-400" /> from Andhra
              </p>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
