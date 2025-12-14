"use client";

import { HeroScrollDemo } from "@/components/hero-scroll-demo";

export default function HeroTestPage() {
    return (
        <main className="bg-white min-h-screen">
            <HeroScrollDemo />

            {/* Additional content to scroll through */}
            <section className="py-20 px-4 bg-gray-50">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">
                        Why Students Love Us
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8 mt-12">
                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                            <div className="text-4xl mb-4">💳</div>
                            <h3 className="font-bold text-lg mb-2">Digital ID Card</h3>
                            <p className="text-gray-600 text-sm">Flash your verified student ID anywhere</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                            <div className="text-4xl mb-4">📍</div>
                            <h3 className="font-bold text-lg mb-2">Nearby Deals</h3>
                            <p className="text-gray-600 text-sm">Discover discounts around your campus</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                            <div className="text-4xl mb-4">💰</div>
                            <h3 className="font-bold text-lg mb-2">Track Savings</h3>
                            <p className="text-gray-600 text-sm">See how much you've saved over time</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-20 px-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-center">
                <h2 className="text-3xl md:text-5xl font-bold mb-4">Ready to Save?</h2>
                <p className="text-lg opacity-90 mb-8">Join thousands of students already saving money</p>
                <button className="bg-white text-purple-600 px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform">
                    Get Started - It's Free
                </button>
            </section>
        </main>
    );
}
