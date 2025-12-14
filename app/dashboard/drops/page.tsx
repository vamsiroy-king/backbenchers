"use client";

import { Button } from "@/components/ui/button";
import { Timer, Zap, Flame, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const DROPS = [
    { id: 1, title: "Nike Air Jordan 1", discount: "40% OFF", time: "02:14:59", img: "https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg", color: "from-red-500 to-orange-600" },
    { id: 2, title: "Sony WH-1000XM5", discount: "Flash Sale", time: "00:45:20", img: "https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg", color: "from-blue-600 to-purple-600" },
];

export default function DropsPage() {
    return (
        <div className="min-h-screen pb-24 bg-black text-white selection:bg-yellow-500/30">
            {/* Header */}
            <header className="sticky top-0 z-40 w-full bg-black/80 backdrop-blur-md border-b border-white/10 px-4 h-14 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-orange-500 fill-orange-500 animate-pulse" />
                    <span className="font-bold text-lg tracking-tight">Daily Drops</span>
                </div>
                <div className="text-xs font-mono text-gray-400 border border-white/10 rounded-full px-2 py-1">
                    <span className="text-green-500">●</span> LIVE
                </div>
            </header>

            <main className="container px-4 py-6 space-y-8">
                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-black italic tracking-tighter bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                        DO NOT MISS OUT.
                    </h1>
                    <p className="text-gray-400 text-sm">Offers expire when the timer hits zero.</p>
                </div>

                {/* Hero Drop */}
                <div className="relative overflow-hidden rounded-3xl bg-gray-900 border border-white/10 shadow-2xl shadow-orange-500/10">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                    <div className="absolute -right-10 -top-10 h-40 w-40 bg-orange-500/20 rounded-full blur-[50px]" />

                    <div className="relative p-6 space-y-6">
                        <div className="flex justify-between items-start">
                            <span className="bg-yellow-400 text-black text-xs font-black px-2 py-1 rounded uppercase flex items-center gap-1">
                                <Zap className="h-3 w-3 fill-black" /> Highest Rated
                            </span>
                            <div className="font-mono text-xl font-bold text-white flex items-center gap-2">
                                <Timer className="h-4 w-4 text-gray-400" />
                                {DROPS[0].time}
                            </div>
                        </div>

                        <div className="py-8 flex justify-center">
                            <h2 className="text-5xl font-black text-white tracking-tighter drop-shadow-sm">
                                NIKE <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">40% OFF</span>
                            </h2>
                        </div>

                        <Button className="w-full h-14 text-lg font-bold bg-white text-black hover:bg-gray-200 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                            Claim Drop <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Upcoming Drops */}
                <div className="space-y-4">
                    <h3 className="font-bold text-lg">Coming Up</h3>
                    {DROPS.slice(1).map((drop) => (
                        <div key={drop.id} className="flex items-center gap-4 p-4 rounded-xl bg-gray-900/50 border border-white/5">
                            <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${drop.color} flex items-center justify-center opacity-80`}>
                                <Zap className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold">{drop.title}</h4>
                                <p className="text-sm text-gray-400">{drop.discount}</p>
                            </div>
                            <div className="font-mono text-sm text-yellow-500">
                                {drop.time}
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
