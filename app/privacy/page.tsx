import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
    title: "Privacy Policy",
    description: "Backbenchers Privacy Policy - How we collect, use, and protect your personal information."
};

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-950">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </Link>
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-3xl mx-auto px-4 py-8">
                <div className="prose prose-gray dark:prose-invert max-w-none">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                        Last updated: December 25, 2024
                    </p>

                    <h2>1. Information We Collect</h2>
                    <p>
                        When you use Backbenchers, we collect the following information:
                    </p>
                    <ul>
                        <li><strong>Account Information:</strong> Name, email address, phone number, date of birth, gender, and college details when you sign up.</li>
                        <li><strong>College Email:</strong> Your college email address for student verification purposes.</li>
                        <li><strong>Usage Data:</strong> Information about how you use our app, including offers viewed, redemptions made, and transaction history.</li>
                        <li><strong>Device Information:</strong> Device type, operating system, and browser information for app optimization.</li>
                        <li><strong>Location:</strong> City and state for showing relevant local offers (we do not track precise GPS location).</li>
                    </ul>

                    <h2>2. How We Use Your Information</h2>
                    <p>We use your information to:</p>
                    <ul>
                        <li>Verify your student status through college email verification</li>
                        <li>Show you relevant discounts and offers in your city</li>
                        <li>Process offer redemptions at partner merchants</li>
                        <li>Send you notifications about new offers and updates</li>
                        <li>Improve our services and user experience</li>
                        <li>Prevent fraud and ensure platform security</li>
                    </ul>

                    <h2>3. Information Sharing</h2>
                    <p>
                        We do <strong>not</strong> sell your personal information. We may share limited information with:
                    </p>
                    <ul>
                        <li><strong>Merchants:</strong> Your BB-ID and redemption details when you use an offer (merchants cannot see your personal details).</li>
                        <li><strong>Service Providers:</strong> Third-party services that help us operate (e.g., authentication, analytics).</li>
                        <li><strong>Legal Requirements:</strong> When required by law or to protect our rights.</li>
                    </ul>

                    <h2>4. Data Security</h2>
                    <p>
                        We implement industry-standard security measures to protect your data:
                    </p>
                    <ul>
                        <li>All data is encrypted in transit using HTTPS/TLS</li>
                        <li>Passwords are never stored in plain text</li>
                        <li>We use secure authentication via Google OAuth and OTP verification</li>
                        <li>Regular security audits and monitoring</li>
                    </ul>

                    <h2>5. Your Rights</h2>
                    <p>You have the right to:</p>
                    <ul>
                        <li>Access your personal data</li>
                        <li>Update or correct your information</li>
                        <li>Delete your account and associated data</li>
                        <li>Opt out of promotional communications</li>
                    </ul>

                    <h2>6. Data Retention</h2>
                    <p>
                        We retain your data for as long as your account is active. If you delete your account, we will delete your personal information within 30 days, except where required by law.
                    </p>

                    <h2>7. Cookies and Local Storage</h2>
                    <p>
                        We use cookies and local storage to:
                    </p>
                    <ul>
                        <li>Keep you logged in</li>
                        <li>Remember your preferences (city, theme)</li>
                        <li>Analyze app usage for improvements</li>
                    </ul>

                    <h2>8. Third-Party Services</h2>
                    <p>Our app uses the following third-party services:</p>
                    <ul>
                        <li><strong>Supabase:</strong> Database and authentication</li>
                        <li><strong>Google OAuth:</strong> Sign-in with Google</li>
                        <li><strong>Vercel:</strong> App hosting</li>
                    </ul>

                    <h2>9. Children's Privacy</h2>
                    <p>
                        Backbenchers is intended for college students aged 18 and above. We do not knowingly collect information from children under 18.
                    </p>

                    <h2>10. Changes to This Policy</h2>
                    <p>
                        We may update this privacy policy from time to time. We will notify you of significant changes through the app or email.
                    </p>

                    <h2>11. Contact Us</h2>
                    <p>
                        If you have questions about this privacy policy or your data, contact us at:
                    </p>
                    <ul>
                        <li>Email: <a href="mailto:privacy@backbenchers.app">privacy@backbenchers.app</a></li>
                        <li>Website: <a href="https://backbenchers.app">backbenchers.app</a></li>
                    </ul>

                    <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                            By using Backbenchers, you agree to this Privacy Policy.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
