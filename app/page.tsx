"use client";

import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Instagram, Twitter, Linkedin, Heart, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

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

export default function RootPage() {
  const router = useRouter();
  const [wordIdx, setWordIdx] = useState(0);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check auth and handle OAuth callback
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

        // Check if user is already authenticated
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Check if they have a student profile
          const { data: student } = await supabase
            .from('students').select('id, status').eq('user_id', session.user.id).maybeSingle();

          if (student) {
            // Authenticated student - redirect to dashboard
            router.replace(student.status === 'suspended' ? '/suspended' : '/dashboard');
            setIsAuthenticated(true);
            return;
          }
        }

        // Not authenticated or no student profile - show landing page
        setCheckingAuth(false);

      } catch (e) {
        console.error(e);
        setCheckingAuth(false);
      }
    }

    handleEntry();
  }, [router]);

  // Word rotation for hero
  useEffect(() => {
    const i = setInterval(() => setWordIdx(p => (p + 1) % WORDS.length), 2500);
    return () => clearInterval(i);
  }, []);

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center"
        >
          <span className="text-black font-bold text-lg">B</span>
        </motion.div>
      </div>
    );
  }

  // If authenticated, show nothing (redirecting)
  if (isAuthenticated) {
    return <div className="min-h-screen bg-black" />;
  }

  // Show landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-background text-foreground flex justify-center">
      <div className="w-full max-w-[430px] lg:max-w-6xl min-h-screen flex flex-col lg:px-8">

        {/* Header */}
        <header className="px-5 pt-4 pb-2 lg:pt-8 lg:pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center" style={{ transform: 'skewX(-6deg)' }}>
                <span className="text-primary-foreground font-extrabold text-sm" style={{ fontStyle: 'italic', transform: 'skewX(6deg)' }}>B</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold italic text-foreground">BACKBENCHERS</span>
                <span className="text-[10px] font-semibold text-primary tracking-wide">BORN TO SAVE</span>
              </div>
            </div>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign in</Link>
          </div>
        </header>

        {/* Hero - Centered in Screen */}
        <section className="flex-1 flex flex-col justify-center px-5 min-h-[60vh] lg:min-h-[50vh] lg:items-center lg:text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:max-w-2xl"
          >
            <p className="text-[13px] lg:text-base font-medium text-foreground mb-1">India's 1st</p>

            <h1 className="text-[44px] lg:text-7xl leading-[0.95] font-extrabold tracking-tight text-foreground">
              Student
            </h1>
            <div className="h-[48px] lg:h-[72px] overflow-hidden">
              <motion.div
                key={wordIdx}
                initial={{ y: 48 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="text-[44px] lg:text-7xl leading-[0.95] font-extrabold text-primary tracking-tight"
              >
                {WORDS[wordIdx]}
              </motion.div>
            </div>
            <p className="text-[13px] lg:text-base font-medium text-foreground mt-1 mb-6">Platform</p>

            <div className="space-y-2.5 lg:flex lg:gap-4 lg:space-y-0 lg:justify-center">
              <Link href="/signup">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  className="w-full lg:w-auto lg:px-10 h-[50px] lg:h-14 bg-primary text-primary-foreground font-semibold rounded-2xl flex items-center justify-center gap-2"
                >
                  Get Started <ArrowRight className="h-4 w-4" />
                </motion.button>
              </Link>
              <Link href="/dashboard">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  className="w-full lg:w-auto lg:px-10 h-[50px] lg:h-14 font-medium rounded-2xl border border-border text-muted-foreground mt-2.5 lg:mt-0"
                >
                  Explore
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* How It Works */}
        <section className="px-5 py-10 lg:py-20">
          <Reveal>
            <h3 className="text-[11px] lg:text-sm font-semibold uppercase tracking-widest text-primary mb-4 lg:mb-10 text-center">How it works</h3>
          </Reveal>
          <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-12 lg:max-w-4xl lg:mx-auto">
            <Reveal delay={0.1}>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-primary font-bold text-sm">1</span>
                </div>
                <div>
                  <p className="font-semibold text-[14px] text-foreground">Sign up with Google</p>
                  <p className="text-[12px] text-muted-foreground">Takes less than 10 seconds</p>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-primary font-bold text-sm">2</span>
                </div>
                <div>
                  <p className="font-semibold text-[14px] text-foreground">Verify your college</p>
                  <p className="text-[12px] text-muted-foreground">One-time verification via email</p>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.3}>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-primary font-bold text-sm">3</span>
                </div>
                <div>
                  <p className="font-semibold text-[14px] text-foreground">Unlock all deals</p>
                  <p className="text-[12px] text-muted-foreground">Access exclusive student discounts</p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* BACKBENCHERS + Tagline */}
        <section className="py-10">
          <Reveal>
            <div className="text-center">
              <motion.h2
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="text-[38px] leading-[1] font-extrabold tracking-tight italic px-2"
              >
                <span className="text-foreground">BACK</span>
                <span className="text-primary">BENCHERS</span>
              </motion.h2>
              <p className="text-sm lg:text-base font-semibold text-primary mt-2 tracking-wide">BORN TO SAVE</p>
              <p className="text-[12px] lg:text-sm text-muted-foreground mt-1">Verify once. Save forever.</p>
            </div>
          </Reveal>
        </section>

        {/* Footer */}
        <footer className="mt-auto border-t border-border">
          <div className="px-5 pt-6 pb-6 lg:py-12 lg:max-w-5xl lg:mx-auto">
            <div className="grid grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-8 mb-6 lg:mb-8">
              <div>
                <p className="text-[10px] text-primary/60 font-semibold uppercase tracking-widest mb-2">Platform</p>
                <div className="space-y-1.5">
                  <Link href="/signup" className="block text-[12px] text-muted-foreground hover:text-foreground transition-colors">Sign Up</Link>
                  <Link href="/login" className="block text-[12px] text-muted-foreground hover:text-foreground transition-colors">Login</Link>
                  <Link href="/dashboard" className="block text-[12px] text-muted-foreground hover:text-foreground transition-colors">Explore</Link>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-primary/60 font-semibold uppercase tracking-widest mb-2">Merchants</p>
                <div className="space-y-1.5">
                  <Link href="/merchant" className="block text-[12px] text-muted-foreground hover:text-foreground transition-colors">Partner</Link>
                  <Link href="/merchant/auth/login" className="block text-[12px] text-muted-foreground hover:text-foreground transition-colors">Login</Link>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-primary/60 font-semibold uppercase tracking-widest mb-2">Legal</p>
                <div className="space-y-1.5">
                  <Link href="/privacy" className="block text-[12px] text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
                  <Link href="/terms" className="block text-[12px] text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
                </div>
              </div>
            </div>

            {/* Socials */}
            <div className="flex items-center gap-2 mb-4">
              <Link href="https://instagram.com" target="_blank" className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors">
                <Instagram className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
              <Link href="https://twitter.com" target="_blank" className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors">
                <Twitter className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
              <Link href="https://linkedin.com" target="_blank" className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors">
                <Linkedin className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            </div>

            {/* Copyright */}
            <div className="pt-4 border-t border-border flex flex-col items-center gap-1 text-center">
              <p className="text-[10px] text-muted-foreground">© 2024 Backbenchers. All rights reserved.</p>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                Made with <Heart className="h-2 w-2 text-red-500 fill-red-500" /> from Andhra
              </p>
            </div>
          </div>
        </footer>

      </div>
    </div >
  );
}
