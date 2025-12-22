"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  // Handle OAuth redirect - in case Supabase redirects here with tokens
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash && window.location.hash.includes('access_token')) {
      console.log('OAuth tokens detected on landing page - redirecting to callback');

      // Check multiple sources for auth flow marker
      const authFlow = localStorage.getItem('auth_flow') || sessionStorage.getItem('auth_flow');
      const wasMerchantFlow = authFlow === 'merchant' || document.referrer.includes('/merchant/');

      // Clean up markers
      localStorage.removeItem('auth_flow');
      sessionStorage.removeItem('auth_flow');

      if (wasMerchantFlow) {
        console.log('Merchant flow detected - redirecting to merchant callback');
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
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col justify-center px-8 pt-16">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center">
              <span className="font-black text-white text-2xl">B</span>
            </div>
            <span className="text-2xl font-bold tracking-tight">Backbenchers</span>
          </div>
        </motion.div>

        {/* India's 1st */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-sm font-medium text-primary tracking-wide mb-2"
        >
          India's 1st
        </motion.p>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-5xl font-black tracking-tight leading-[1.1] mb-8"
        >
          Online + Offline
          <br />
          Student Perks.
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-lg text-gray-500 mb-12"
        >
          Backbenchers. Born to Save.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <Link href="/signup" className="block">
            <Button size="lg" className="w-full h-14 text-base font-bold rounded-2xl">
              Get Verified
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/dashboard" className="block">
            <button className="w-full h-14 text-base font-semibold text-gray-500 hover:text-gray-900 transition-colors">
              Explore Offers →
            </button>
          </Link>
        </motion.div>
      </div>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="px-8 py-10 border-t border-gray-100"
      >
        <div className="grid grid-cols-2 gap-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏷️</span>
            <span className="text-sm font-medium text-gray-600">Online Brands</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏪</span>
            <span className="text-sm font-medium text-gray-600">Local Stores</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <span className="text-sm font-medium text-gray-600">Flash Deals</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">✓</span>
            <span className="text-sm font-medium text-gray-600">Verified Only</span>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <div className="px-8 py-6 flex justify-center gap-8 text-sm">
        <Link href="/login" className="text-gray-400 font-medium">Log in</Link>
        <Link href="/merchant/auth/signup" className="text-gray-400 font-medium">For Merchants</Link>
      </div>
    </div>
  );
}
