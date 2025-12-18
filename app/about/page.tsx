"use client";

import { Store, Users, TrendingUp, Shield, Sparkles, ChevronRight, Heart, Target, Zap, Award, MapPin, Building } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
    const stats = [
        { label: "Students Saved", value: "₹50K+", icon: TrendingUp, color: "text-green-500" },
        { label: "Partner Stores", value: "50+", icon: Store, color: "text-purple-500" },
        { label: "Active Students", value: "500+", icon: Users, color: "text-blue-500" },
        { label: "Cities", value: "3+", icon: MapPin, color: "text-orange-500" }
    ];

    const features = [
        {
            icon: Shield,
            title: "Verified Students Only",
            description: "Every user is verified with their college email. No fake accounts, real benefits."
        },
        {
            icon: Zap,
            title: "QR-Verified Redemption",
            description: "Show your QR code at the store. Instant verification, instant discount."
        },
        {
            icon: Target,
            title: "Local Store Focus",
            description: "We partner with real local businesses near your campus, not just big chains."
        },
        {
            icon: Heart,
            title: "Win-Win Model",
            description: "Students save money, merchants get loyal customers. Everyone wins."
        }
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-green-600 via-green-500 to-emerald-400 text-white overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-32">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center"
                    >
                        <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6">
                            <Sparkles className="h-4 w-4" />
                            India's First Student Discount Platform
                        </span>
                        <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
                            Making Student Life<br />More Affordable
                        </h1>
                        <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-8">
                            Backbenchers is India's first student discount platform with QR-verified
                            in-store redemption. We connect verified college students with local
                            businesses offering exclusive discounts.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link href="/auth/signup">
                                <Button size="lg" className="bg-white text-green-600 hover:bg-white/90 font-bold rounded-xl px-8">
                                    Join as Student
                                </Button>
                            </Link>
                            <Link href="/merchant/auth/signup">
                                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 font-bold rounded-xl px-8">
                                    Partner with Us
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 bg-gray-50">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {stats.map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white rounded-2xl p-6 text-center shadow-sm"
                            >
                                <stat.icon className={`h-8 w-8 mx-auto mb-3 ${stat.color}`} />
                                <p className="text-3xl font-black text-gray-900">{stat.value}</p>
                                <p className="text-sm text-gray-500">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Mission Section */}
            <section className="py-20">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-6">
                        Our Mission
                    </h2>
                    <p className="text-lg text-gray-600 leading-relaxed mb-8">
                        We believe every student deserves access to quality products and services
                        without breaking the bank. Backbenchers bridges the gap between budget-conscious
                        students and local businesses, creating a community where everyone benefits.
                    </p>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl p-8 border border-green-100">
                        <Award className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <p className="text-xl font-bold text-gray-900 mb-2">
                            "Verify Once, Save Everywhere"
                        </p>
                        <p className="text-gray-600">
                            One-time student verification unlocks discounts at all partner stores.
                        </p>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-6xl mx-auto px-6">
                    <h2 className="text-3xl md:text-4xl font-black text-gray-900 text-center mb-12">
                        What Makes Us Different
                    </h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        {features.map((feature, i) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="bg-white rounded-2xl p-8 shadow-sm"
                            >
                                <div className="h-14 w-14 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                                    <feature.icon className="h-7 w-7 text-green-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                                <p className="text-gray-600">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Founder CTA */}
            <section className="py-20">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-6">
                        Built by a Student, for Students
                    </h2>
                    <p className="text-lg text-gray-600 mb-8">
                        Backbenchers was founded by Vamsiram G with a simple mission:
                        make student life more affordable.
                    </p>
                    <Link href="/founder">
                        <Button className="bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl px-8">
                            Meet the Founder <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-6xl mx-auto px-6 text-center">
                    <p className="text-2xl font-bold mb-2">Backbenchers</p>
                    <p className="text-gray-400 mb-6">India's First Student Discount Platform</p>
                    <div className="flex justify-center gap-6 text-sm text-gray-400">
                        <Link href="/about" className="hover:text-white">About</Link>
                        <Link href="/founder" className="hover:text-white">Founder</Link>
                        <Link href="/merchant/auth/signup" className="hover:text-white">Partner with Us</Link>
                        <a href="mailto:support@backbenchers.app" className="hover:text-white">Contact</a>
                    </div>
                    <p className="text-gray-500 text-sm mt-8">© 2024 Backbenchers. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
