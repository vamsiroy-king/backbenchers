"use client";

import { Linkedin, Twitter, Mail, ExternalLink, Building, Rocket, Heart, ChevronRight, ArrowLeft, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function FounderPage() {
    const milestones = [
        { year: "2024", title: "Founded Backbenchers", description: "Started building India's first student discount platform" },
        { year: "2024", title: "Launched MVP", description: "Rolled out to first set of merchants and students in Bengaluru" },
        { year: "2024", title: "Growing Fast", description: "Expanding to multiple cities with 50+ partner stores" }
    ];

    const socialLinks = [
        { icon: Linkedin, label: "LinkedIn", url: "https://linkedin.com/in/vamsiram", color: "bg-blue-600" },
        { icon: Twitter, label: "Twitter", url: "https://twitter.com/vamsiram", color: "bg-sky-500" },
        { icon: Mail, label: "Email", url: "mailto:vamsiram@backbenchers.app", color: "bg-green-600" }
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/about" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="h-5 w-5" />
                        <span className="font-medium">Back to About</span>
                    </Link>
                    <Link href="/" className="font-bold text-xl text-green-600">Backbenchers</Link>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-16 pb-20">
                <div className="max-w-4xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center"
                    >
                        {/* Profile Image Placeholder */}
                        <div className="h-32 w-32 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mx-auto mb-6 flex items-center justify-center text-white text-4xl font-black shadow-lg">
                            VG
                        </div>

                        <span className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                            <Sparkles className="h-4 w-4" />
                            Founder & CEO
                        </span>

                        <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
                            Vamsiram G
                        </h1>

                        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
                            Building Backbenchers — Born to Save. India's first student discount platform.
                            Passionate about making student life more affordable.
                        </p>

                        {/* Social Links */}
                        <div className="flex justify-center gap-4 mb-12">
                            {socialLinks.map((link) => (
                                <a
                                    key={link.label}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`h-12 w-12 ${link.color} text-white rounded-xl flex items-center justify-center hover:scale-110 transition-transform shadow-lg`}
                                >
                                    <link.icon className="h-5 w-5" />
                                </a>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Story Section */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-4xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl font-black text-gray-900 mb-8 text-center">
                            The Story Behind Backbenchers
                        </h2>

                        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm">
                            <div className="prose prose-lg max-w-none text-gray-600">
                                <p className="text-lg leading-relaxed mb-6">
                                    As a student, I always wished there was an easier way to find discounts
                                    at local stores. International students have apps like UNiDAYS and
                                    Student Beans, but there was nothing like that for Indian students.
                                </p>
                                <p className="text-lg leading-relaxed mb-6">
                                    That's when the idea for <strong className="text-gray-900">Backbenchers</strong> was born.
                                    I wanted to create a platform where verified students could access
                                    exclusive discounts at local businesses – not just big chains, but the
                                    cafes, restaurants, and stores right around their campus.
                                </p>
                                <p className="text-lg leading-relaxed mb-6">
                                    What makes Backbenchers unique is our <strong className="text-gray-900">QR-verified in-store redemption</strong>.
                                    Unlike coupon codes that can be shared, our system ensures that only
                                    verified students get the discounts, which builds trust with merchants.
                                </p>
                                <p className="text-lg leading-relaxed">
                                    Today, we're rapidly growing across cities, partnering with amazing
                                    local businesses, and helping thousands of students save money.
                                    This is just the beginning.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Timeline Section */}
            <section className="py-20">
                <div className="max-w-4xl mx-auto px-6">
                    <h2 className="text-3xl font-black text-gray-900 mb-12 text-center">
                        Journey So Far
                    </h2>

                    <div className="space-y-8">
                        {milestones.map((milestone, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="flex gap-6"
                            >
                                <div className="flex flex-col items-center">
                                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                                        <Star className="h-6 w-6 text-green-600" />
                                    </div>
                                    {i < milestones.length - 1 && (
                                        <div className="w-0.5 h-full bg-green-200 mt-2" />
                                    )}
                                </div>
                                <div className="pb-8">
                                    <span className="text-sm font-bold text-green-600">{milestone.year}</span>
                                    <h3 className="text-xl font-bold text-gray-900 mt-1">{milestone.title}</h3>
                                    <p className="text-gray-600 mt-1">{milestone.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Vision Section */}
            <section className="py-20 bg-gradient-to-br from-green-600 via-green-500 to-emerald-400 text-white">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <Rocket className="h-16 w-16 mx-auto mb-6 opacity-80" />
                    <h2 className="text-3xl md:text-4xl font-black mb-6">
                        The Vision
                    </h2>
                    <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8">
                        To make Backbenchers the go-to platform for every student in India.
                        A world where showing your student ID unlocks a universe of savings.
                    </p>
                    <p className="text-lg font-bold text-white/90">
                        "Every student deserves to save more."
                    </p>
                </div>
            </section>

            {/* Contact CTA */}
            <section className="py-20">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-3xl font-black text-gray-900 mb-6">
                        Let's Connect
                    </h2>
                    <p className="text-lg text-gray-600 mb-8">
                        Have ideas, feedback, or want to partner? I'd love to hear from you.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <a href="mailto:vamsiram@backbenchers.app">
                            <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl px-8">
                                <Mail className="h-5 w-5 mr-2" /> Email Me
                            </Button>
                        </a>
                        <a href="https://linkedin.com/in/vamsiram" target="_blank" rel="noopener noreferrer">
                            <Button size="lg" variant="outline" className="border-gray-300 font-bold rounded-xl px-8">
                                <Linkedin className="h-5 w-5 mr-2" /> Connect on LinkedIn
                            </Button>
                        </a>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-6xl mx-auto px-6 text-center">
                    <p className="text-2xl font-bold mb-2">Backbenchers</p>
                    <p className="text-gray-400 mb-6">Born to Save.</p>
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
