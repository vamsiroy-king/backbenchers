"use client";

import Link from "next/link";
import { Instagram, Twitter, Linkedin, Mail, Phone, MapPin } from "lucide-react";

// Professional footer for student authentication screens
// TODO: Make social links admin-configurable via database in future

const SOCIAL_LINKS = [
    { name: "Instagram", icon: Instagram, href: "https://instagram.com/backbenchers_official", enabled: true },
    { name: "Twitter", icon: Twitter, href: "https://twitter.com/backbenchers_in", enabled: true },
    { name: "LinkedIn", icon: Linkedin, href: "https://linkedin.com/company/backbenchers", enabled: true },
];

const QUICK_LINKS = [
    { name: "About Us", href: "/about" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Contact", href: "/contact" },
];

export default function AuthFooter() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-auto">
            <div className="max-w-lg mx-auto px-6 py-8">
                {/* Brand */}
                <div className="flex items-center justify-center gap-2 mb-6">
                    <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold text-lg">B</span>
                    </div>
                    <span className="font-bold text-lg text-gray-900 dark:text-white">Backbenchers</span>
                </div>

                {/* Tagline */}
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">
                    India's #1 Student Discount Platform
                </p>

                {/* Social Links */}
                <div className="flex justify-center gap-4 mb-6">
                    {SOCIAL_LINKS.filter(link => link.enabled).map((link) => (
                        <a
                            key={link.name}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-10 w-10 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:border-primary/50 transition-all hover:scale-105"
                            aria-label={link.name}
                        >
                            <link.icon className="h-5 w-5" />
                        </a>
                    ))}
                </div>

                {/* Quick Links */}
                <div className="flex flex-wrap justify-center gap-4 mb-6 text-xs">
                    {QUICK_LINKS.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>

                {/* Contact Info */}
                <div className="flex flex-col items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mb-6">
                    <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        <span>support@backbenchers.app</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span>Hyderabad, India</span>
                    </div>
                </div>

                {/* Copyright */}
                <div className="text-center text-[10px] text-gray-400 dark:text-gray-600">
                    <p>© {currentYear} Backbenchers. All rights reserved.</p>
                    <p className="mt-1">Made with ❤️ for students</p>
                </div>
            </div>
        </footer>
    );
}
