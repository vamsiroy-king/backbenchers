"use client";

import { ArrowRight, Shield, Zap, Store, GraduationCap, ChevronRight } from "lucide-react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/services/auth.service";

// Animated words for hero
const WORDS = ["Savings", "Discounts", "Deals", "Perks"];

// Simple reveal animation
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function check() {
      if (typeof window === 'undefined') return;

      // CRITICAL: Handle OAuth redirect - both hash token and PKCE code
      // Supabase may redirect here with ?code=... - we MUST redirect to callback
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (code) {
        console.log('[Landing] OAuth code detected, redirecting to /auth/callback');
        const flow = localStorage.getItem('auth_flow');
        localStorage.removeItem('auth_flow');
        // Redirect with full query string to preserve code and other params
        window.location.href = (flow === 'merchant' ? '/merchant/auth/callback' : '/auth/callback') + window.location.search;
        return;
      }

      // Handle access_token in hash (implicit flow fallback)
      if (window.location.hash?.includes('access_token')) {
        const flow = localStorage.getItem('auth_flow');
        localStorage.removeItem('auth_flow');
        window.location.href = (flow === 'merchant' ? '/merchant/auth/callback' : '/auth/callback') + window.location.hash;
        return;
      }

      try {
        const user = await authService.getCurrentUser();
        if (user?.role === 'student' && !user.isSuspended) {
          router.replace('/dashboard');
          return;
        }
        if (user?.role === 'pending') {
          // User has session but no student record - go to onboarding
          window.location.href = '/verify';
          return;
        }
      } catch { }
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
          className="h-12 w-12 rounded-xl bg-green-500 flex items-center justify-center"
        >
          <span className="text-black font-bold text-xl">B</span>
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
      <div className="w-full max-w-[430px] bg-black">

        {/* Header - Sticky */}
        <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-[#111] px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-green-500 flex items-center justify-center">
                <span className="text-black font-bold text-xs">B</span>
              </div>
              <span className="text-white font-semibold text-sm">Backbenchers</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/signup">
                <motion.button whileTap={{ scale: 0.95 }} className="text-xs bg-green-500 text-black font-semibold px-4 py-2 rounded-full">
                  Get Started
                </motion.button>
              </Link>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="min-h-[80vh] flex flex-col justify-center px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Live badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#111] border border-[#1a1a1a] mb-8">
              <motion.div
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="h-1.5 w-1.5 rounded-full bg-green-500"
              />
              <span className="text-[10px] text-[#666] uppercase tracking-wider">India's Student Discount Platform</span>
            </div>

            {/* Headline */}
            <h1 className="text-[36px] leading-[1.1] font-bold text-white tracking-tight mb-2">
              Unlock Student
            </h1>
            <div className="h-[44px] overflow-hidden mb-6">
              <motion.div
                key={wordIdx}
                initial={{ y: 44, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -44, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="text-[36px] leading-[1.1] font-bold text-green-400 tracking-tight"
              >
                {WORDS[wordIdx]}
              </motion.div>
            </div>

            {/* Subtitle */}
            <p className="text-[15px] text-[#666] leading-relaxed mb-10 max-w-[320px]">
              Exclusive discounts for verified students at local stores and top brands.
            </p>

            {/* CTA Buttons */}
            <div className="space-y-3">
              <Link href="/signup" className="block">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  className="w-full h-[52px] bg-green-500 hover:bg-green-400 text-black font-semibold rounded-xl flex items-center justify-center gap-2 text-[15px] transition-colors"
                >
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
              </Link>
              <Link href="/dashboard" className="block">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  className="w-full h-[52px] bg-[#111] hover:bg-[#1a1a1a] text-white font-medium rounded-xl border border-[#222] text-[15px] transition-colors"
                >
                  Explore Deals
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-6 border-t border-[#111]">
          <Reveal>
            <p className="text-[10px] font-medium text-green-400 tracking-[0.2em] uppercase mb-2">Why Backbenchers</p>
            <h2 className="text-xl font-bold text-white mb-8">Built for Students</h2>
          </Reveal>

          <div className="space-y-3">
            {[
              { icon: Shield, title: "Verify Once", desc: "Quick verification with college email", color: "green" },
              { icon: Zap, title: "Instant Access", desc: "Unlock discounts immediately", color: "blue" },
              { icon: Store, title: "Local + Online", desc: "Save at stores and online brands", color: "purple" }
            ].map((f, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="p-4 rounded-xl bg-[#0a0a0a] border border-[#151515]">
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${f.color === 'green' ? 'bg-green-500/10' : f.color === 'blue' ? 'bg-blue-500/10' : 'bg-purple-500/10'
                      }`}>
                      <f.icon className={`h-5 w-5 ${f.color === 'green' ? 'text-green-400' : f.color === 'blue' ? 'text-blue-400' : 'text-purple-400'
                        }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-0.5">{f.title}</h3>
                      <p className="text-sm text-[#555]">{f.desc}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* How it Works */}
        <section className="py-16 px-6 bg-[#050505]">
          <Reveal>
            <p className="text-[10px] font-medium text-green-400 tracking-[0.2em] uppercase mb-2">Getting Started</p>
            <h2 className="text-xl font-bold text-white mb-8">How it Works</h2>
          </Reveal>

          <div className="space-y-6">
            {[
              { num: "01", title: "Sign Up", desc: "Create account with Google" },
              { num: "02", title: "Verify", desc: "Confirm your college email" },
              { num: "03", title: "Save", desc: "Access exclusive discounts" }
            ].map((s, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="flex items-start gap-4">
                  <span className="text-2xl font-bold text-[#1a1a1a]">{s.num}</span>
                  <div>
                    <h3 className="font-semibold text-white">{s.title}</h3>
                    <p className="text-sm text-[#555]">{s.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.3}>
            <Link href="/signup" className="block mt-10">
              <motion.button
                whileTap={{ scale: 0.98 }}
                className="w-full h-[52px] bg-white text-black font-semibold rounded-xl text-[15px]"
              >
                Start Saving Now
              </motion.button>
            </Link>
          </Reveal>
        </section>

        {/* For Students / Merchants */}
        <section className="py-16 px-6">
          <div className="space-y-4">
            <Reveal>
              <div className="p-5 rounded-xl bg-gradient-to-br from-green-500/5 to-transparent border border-[#151515]">
                <GraduationCap className="h-7 w-7 text-green-400 mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">For Students</h3>
                <p className="text-sm text-[#555] mb-4">Verify once and unlock exclusive discounts at hundreds of stores.</p>
                <Link href="/signup" className="inline-flex items-center gap-1 text-green-400 text-sm font-medium">
                  Get Verified Free <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="p-5 rounded-xl bg-gradient-to-br from-purple-500/5 to-transparent border border-[#151515]">
                <Store className="h-7 w-7 text-purple-400 mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">For Merchants</h3>
                <p className="text-sm text-[#555] mb-4">Reach thousands of verified students. Zero upfront costs.</p>
                <Link href="/merchant" className="inline-flex items-center gap-1 text-purple-400 text-sm font-medium">
                  Partner with us <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 px-6 bg-[#050505]">
          <Reveal>
            <div className="text-center">
              <h2 className="text-xl font-bold text-white mb-2">Ready to Save?</h2>
              <p className="text-sm text-[#555] mb-6">Join students already saving with Backbenchers.</p>
              <Link href="/signup">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-3 bg-green-500 text-black font-semibold rounded-full text-sm"
                >
                  Get Started Free
                </motion.button>
              </Link>
            </div>
          </Reveal>
        </section>

        {/* Footer */}
        <footer className="py-10 px-6 border-t border-[#111]">
          {/* Brand */}
          <div className="flex items-center gap-2 mb-6">
            <div className="h-7 w-7 rounded-lg bg-green-500 flex items-center justify-center">
              <span className="text-black font-bold text-xs">B</span>
            </div>
            <span className="text-white font-semibold text-sm">Backbenchers</span>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <h4 className="text-[10px] font-semibold text-[#444] uppercase tracking-wider mb-3">For Students</h4>
              <ul className="space-y-2">
                <li><Link href="/signup" className="text-sm text-[#555] hover:text-white transition-colors">Sign Up</Link></li>
                <li><Link href="/dashboard" className="text-sm text-[#555] hover:text-white transition-colors">Browse Deals</Link></li>
                <li><Link href="/login" className="text-sm text-[#555] hover:text-white transition-colors">Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-semibold text-[#444] uppercase tracking-wider mb-3">For Merchants</h4>
              <ul className="space-y-2">
                <li><Link href="/merchant" className="text-sm text-[#555] hover:text-white transition-colors">Partner</Link></li>
                <li><Link href="/merchant/auth/login" className="text-sm text-[#555] hover:text-white transition-colors">Merchant Login</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-6 border-t border-[#111]">
            <div className="flex gap-4 mb-3">
              <Link href="#" className="text-xs text-[#333]">Privacy</Link>
              <Link href="#" className="text-xs text-[#333]">Terms</Link>
            </div>
            <p className="text-[10px] text-[#222]">© 2024 Backbenchers. All rights reserved.</p>
          </div>
        </footer>

      </div>
    </div>
  );
}
