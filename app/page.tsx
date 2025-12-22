"use client";

import { ArrowRight, Sparkles, Shield, Zap, Store } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Animated rotating words for hook
const HOOK_WORDS = ["Food", "Fashion", "Fitness"];

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
      <div className="flex-1 flex flex-col justify-center px-8 pt-20 pb-8">

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

        {/* #India's 1st Badge - STUNNING */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mb-6"
        >
          <div className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-full">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            >
              <Sparkles className="h-4 w-4 text-yellow-400" />
            </motion.div>
            <span className="text-sm font-bold tracking-wide">#India's 1st</span>
          </div>
        </motion.div>

        {/* Main Headline - Animated Word */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mb-6"
        >
          <h1 className="text-[42px] font-black tracking-tight leading-[1.05] text-gray-900">
            Unlock Exclusive
            <br />
            <span className="relative">
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentWordIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="text-primary inline-block"
                >
                  {HOOK_WORDS[currentWordIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
            {" "}Deals.
          </h1>
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-lg text-gray-500 mb-10 leading-relaxed"
        >
          The only app verified students trust.
          <br />
          <span className="text-gray-400">Save on everything. Everywhere.</span>
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
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
        transition={{ delay: 0.7 }}
        className="px-6 pb-6"
      >
        <div className="bg-gray-50 rounded-2xl p-5">
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Store, label: "100+ Brands", color: "text-blue-600", bg: "bg-blue-100" },
              { icon: Zap, label: "Instant Access", color: "text-orange-600", bg: "bg-orange-100" },
              { icon: Shield, label: "Verified Only", color: "text-green-600", bg: "bg-green-100" },
              { icon: Sparkles, label: "Flash Deals", color: "text-purple-600", bg: "bg-purple-100" },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + i * 0.1 }}
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

      {/* Footer Links */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="px-8 py-6 flex justify-center gap-8 text-sm border-t border-gray-100"
      >
        <Link href="/login" className="text-gray-400 font-medium hover:text-gray-600 transition-colors">
          Already verified? Log in
        </Link>
      </motion.div>
    </div>
  );
}
