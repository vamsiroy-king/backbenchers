"use client";
import React from "react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";

export function HeroScrollDemo() {
    return (
        <div className="flex flex-col overflow-hidden bg-gradient-to-b from-white to-gray-100">
            <ContainerScroll
                titleComponent={
                    <>
                        <h1 className="text-4xl font-semibold text-black">
                            Student Discounts, <br />
                            <span className="text-4xl md:text-[6rem] font-bold mt-1 leading-none bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
                                Reimagined
                            </span>
                        </h1>
                        <p className="text-lg md:text-xl text-gray-600 mt-4 max-w-2xl mx-auto">
                            Exclusive deals from local stores. Just flash your digital ID and save instantly.
                        </p>
                    </>
                }
            >
                {/* App Preview Mockup */}
                <div className="w-full h-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-xl flex items-center justify-center relative overflow-hidden">
                    {/* Phone Frame */}
                    <div className="w-[280px] h-[560px] bg-black rounded-[45px] shadow-2xl relative overflow-hidden border-[8px] border-gray-800">
                        {/* Notch */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-10" />

                        {/* Screen Content */}
                        <div className="w-full h-full bg-white rounded-[35px] overflow-hidden pt-8">
                            {/* Header */}
                            <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
                                <div>
                                    <p className="text-xs text-gray-500">Good morning!</p>
                                    <p className="font-bold text-sm">Hey, Student 👋</p>
                                </div>
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                                    BB
                                </div>
                            </div>

                            {/* Hero Banner */}
                            <div className="px-4 py-3">
                                <div className="h-28 bg-gradient-to-r from-purple-600 to-pink-500 rounded-2xl flex items-center justify-between px-4">
                                    <div>
                                        <p className="text-white/80 text-xs">Your savings</p>
                                        <p className="text-white text-2xl font-bold">₹2,450</p>
                                        <p className="text-white/80 text-[10px]">this month</p>
                                    </div>
                                    <div className="text-4xl">💰</div>
                                </div>
                            </div>

                            {/* Categories */}
                            <div className="px-4 py-2">
                                <p className="font-bold text-xs mb-2">Categories</p>
                                <div className="flex gap-2">
                                    {["🍕", "👗", "☕", "🏋️"].map((emoji, i) => (
                                        <div key={i} className="h-10 w-10 bg-gray-100 rounded-xl flex items-center justify-center text-lg">
                                            {emoji}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Trending */}
                            <div className="px-4 py-2">
                                <p className="font-bold text-xs mb-2">Trending Offers</p>
                                <div className="flex gap-2 overflow-hidden">
                                    <div className="w-28 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl p-2 flex-shrink-0">
                                        <p className="text-white text-[8px] font-bold">20% OFF</p>
                                        <p className="text-white text-[10px] mt-1">Cafe Coffee</p>
                                    </div>
                                    <div className="w-28 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl p-2 flex-shrink-0">
                                        <p className="text-white text-[8px] font-bold">₹100 OFF</p>
                                        <p className="text-white text-[10px] mt-1">Style Hub</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Floating Elements */}
                    <div className="absolute top-10 left-10 bg-white rounded-2xl px-4 py-2 shadow-lg transform -rotate-12 animate-bounce">
                        <span className="text-2xl">🎓</span>
                        <span className="ml-2 font-bold text-sm">Students Only!</span>
                    </div>
                    <div className="absolute bottom-20 right-10 bg-white rounded-2xl px-4 py-2 shadow-lg transform rotate-12">
                        <span className="font-bold text-green-500">Save up to 50%</span>
                    </div>
                </div>
            </ContainerScroll>
        </div>
    );
}
