"use client";

import { ArrowRight, Shield, Zap, Store, Star } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Curiosity-inducing words (not revealing F³)
const HOOK_WORDS = ["Student", "Exclusive", "Insider", "Premium"];

export default function Home() {
  const router = useRouter();

  // Handle OAuth redirect - in case Supabase redirects here with tokens
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash && window.location.hash.includes('access_token')) {
      console.log('OAuth tokens detected on landing page - redirecting to callback');

      const authFlow = localStorage.getItem('auth_flow') || sessionStorage.getItem('auth_flow');
      const wasMerchantFlow = authFlow === 'merchant' || document.referrer.includes('/merchant/');

      localStorage.removeItem('auth_flow');
      sessionStorage.removeItem('auth_flow');

      if (wasMerchantFlow) {
        router.replace('/merchant/auth/callback' + window.location.hash);
      } else {
        router.replace('/auth/callback' + window.location.hash);
      }
    }
  }, [router]);

  return (
    <>
      {/* MOBILE */}
      <div className="md:hidden min-h-screen bg-white">
        <LandingContent />
      </div>

      {/* DESKTOP */}
      <div className="hidden md:flex min-h-screen bg-[#f5f5f7] items-center justify-center py-8">
        <div className="w-full max-w-[430px] h-[932px] bg-white rounded-[50px] shadow-[0_0_0_12px_#1f1f1f,0_0_0_14px_#3f3f3f,0_25px_60px_rgba(0,0,0,0.4)] relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-8 w-32 bg-black rounded-b-3xl z-[9999]" />
          <div className="h-full w-full overflow-y-auto scrollbar-hide">
            <LandingContent />
          </div>
        </div>
      </div>
    </>
  );
}

function LandingContent() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  // Rotate hook words
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % HOOK_WORDS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col justify-center px-8 pt-6 pb-8">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <span className="font-black text-white text-2xl">B</span>
            </div>
            <span className="text-2xl font-bold tracking-tight text-gray-900">Backbenchers</span>
          </div>
        </motion.div>

        {/* #India's 1st - Premium Highlight */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-4"
        >
          <span className="text-sm font-semibold text-primary relative">
            #India's 1st
            <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary/40 rounded-full" />
          </span>
        </motion.div>

        {/* Main Headline - Animated Words */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <h1 className="text-5xl font-black tracking-tight leading-[1.1] text-gray-900">
            <AnimatePresence mode="wait">
              <motion.span
                key={currentWordIndex}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="text-primary inline-block"
              >
                {HOOK_WORDS[currentWordIndex]}
              </motion.span>
            </AnimatePresence>
            {" "}Perks
            <br />
            for Students.
          </h1>
        </motion.div>

        {/* Tagline - Original */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-lg text-gray-500 mb-10"
        >
          Backbenchers. Born to Save.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <Link href="/signup" className="block">
            <motion.button
              whileTap={{ scale: 0.98 }}
              className="w-full h-14 bg-primary text-white text-base font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/30"
            >
              Get Verified Free
              <ArrowRight className="h-5 w-5" />
            </motion.button>
          </Link>
          <Link href="/dashboard" className="block">
            <motion.button
              whileTap={{ scale: 0.98 }}
              className="w-full h-14 bg-gray-100 text-gray-900 text-base font-semibold rounded-2xl"
            >
              Explore as Guest →
            </motion.button>
          </Link>
        </motion.div>
      </div>

      {/* Features - Premium Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="px-6 pb-6"
      >
        <div className="bg-gray-50 rounded-2xl p-5">
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Store, label: "100+ Brands", color: "text-blue-600", bg: "bg-blue-100" },
              { icon: Zap, label: "Instant Access", color: "text-orange-600", bg: "bg-orange-100" },
              { icon: Shield, label: "Verified Only", color: "text-green-600", bg: "bg-green-100" },
              { icon: Star, label: "Flash Deals", color: "text-purple-600", bg: "bg-purple-100" },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="flex items-center gap-3"
              >
                <div className={`h-10 w-10 ${feature.bg} rounded-xl flex items-center justify-center`}>
                  <feature.icon className={`h-5 w-5 ${feature.color}`} />
                </div>
                <span className="text-sm font-semibold text-gray-700">{feature.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Clean Minimal Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="border-t border-gray-100 bg-white"
      >
        <div className="px-8 py-6">
          {/* Login Link - Primary Action */}
          <Link href="/login" className="block text-center mb-6">
            <span className="text-gray-900 font-medium">Already verified?</span>{" "}
            <span className="text-primary font-semibold">Sign in →</span>
          </Link>

          {/* Social Icons - Minimal Row */}
          <div className="flex justify-center gap-6 mb-6">
            <a href="https://instagram.com/backbenchers_official" target="_blank" rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-900 transition-colors">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
            <a href="https://twitter.com/backbenchers_in" target="_blank" rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-900 transition-colors">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a href="https://linkedin.com/company/backbenchers" target="_blank" rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-900 transition-colors">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          </div>

          {/* Quick Links - Inline */}
          <div className="flex justify-center gap-4 text-xs text-gray-400 mb-4">
            <Link href="/privacy" className="hover:text-gray-600">Privacy</Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-gray-600">Terms</Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-gray-600">Help</Link>
          </div>

          {/* Copyright - Super Minimal */}
          <p className="text-center text-[11px] text-gray-300">
            © {new Date().getFullYear()} Backbenchers
          </p>
        </div>
      </motion.footer>
    </div>
  );
}
