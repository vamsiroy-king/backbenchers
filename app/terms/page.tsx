import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
    title: "Terms of Service",
    description: "Backbenchers Terms of Service - Rules and guidelines for using our platform."
};

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-950">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </Link>
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white">Terms of Service</h1>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-3xl mx-auto px-4 py-8">
                <div className="prose prose-gray dark:prose-invert max-w-none">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                        Last updated: December 25, 2024
                    </p>

                    <h2>1. Acceptance of Terms</h2>
                    <p>
                        By accessing or using Backbenchers ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the App.
                    </p>

                    <h2>2. Eligibility</h2>
                    <p>To use Backbenchers, you must:</p>
                    <ul>
                        <li>Be at least 18 years of age</li>
                        <li>Be a currently enrolled college/university student in India</li>
                        <li>Have a valid institutional email address for verification</li>
                        <li>Provide accurate and complete registration information</li>
                    </ul>

                    <h2>3. Account Registration</h2>
                    <p>
                        You must register for an account to access most features of the App. You agree to:
                    </p>
                    <ul>
                        <li>Provide accurate, current, and complete information</li>
                        <li>Maintain and promptly update your account information</li>
                        <li>Keep your login credentials secure and confidential</li>
                        <li>Notify us immediately of any unauthorized use of your account</li>
                        <li>Accept responsibility for all activities under your account</li>
                    </ul>

                    <h2>4. Student Verification</h2>
                    <p>
                        We verify your student status through your college email address. You agree that:
                    </p>
                    <ul>
                        <li>You will only use your own legitimate college email for verification</li>
                        <li>You will not attempt to verify using someone else's credentials</li>
                        <li>Your student status may be re-verified periodically</li>
                        <li>False claims of student status may result in account termination</li>
                    </ul>

                    <h2>5. Use of Discounts and Offers</h2>
                    <p>When redeeming offers through Backbenchers:</p>
                    <ul>
                        <li>Each offer can only be used according to its stated terms</li>
                        <li>Offers are non-transferable to non-students</li>
                        <li>You must show your QR code at participating merchants</li>
                        <li>Merchants have the right to verify your student status</li>
                        <li>Offers may have usage limits, expiry dates, and exclusions</li>
                        <li>We are not responsible for merchant service quality</li>
                    </ul>

                    <h2>6. Prohibited Conduct</h2>
                    <p>You agree NOT to:</p>
                    <ul>
                        <li>Share your account credentials with others</li>
                        <li>Use offers on behalf of non-students</li>
                        <li>Create multiple accounts to abuse offers</li>
                        <li>Attempt to bypass verification or security measures</li>
                        <li>Sell, trade, or transfer your account or offers</li>
                        <li>Use automated systems to access the App</li>
                        <li>Interfere with the App's proper functioning</li>
                        <li>Engage in fraudulent or deceptive practices</li>
                    </ul>

                    <h2>7. Intellectual Property</h2>
                    <p>
                        All content, features, and functionality of the App are owned by Backbenchers and are protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or create derivative works without our express permission.
                    </p>

                    <h2>8. Disclaimer of Warranties</h2>
                    <p>
                        THE APP IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE:
                    </p>
                    <ul>
                        <li>Uninterrupted or error-free service</li>
                        <li>Accuracy of offer information</li>
                        <li>Quality of merchant products or services</li>
                        <li>That offers will always be available</li>
                    </ul>

                    <h2>9. Limitation of Liability</h2>
                    <p>
                        To the maximum extent permitted by law, Backbenchers shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the App.
                    </p>

                    <h2>10. Account Termination</h2>
                    <p>
                        We may suspend or terminate your account if you:
                    </p>
                    <ul>
                        <li>Violate these Terms of Service</li>
                        <li>Engage in fraudulent activity</li>
                        <li>Are no longer a verified student</li>
                        <li>Remain inactive for an extended period</li>
                    </ul>

                    <h2>11. Modifications</h2>
                    <p>
                        We reserve the right to modify these terms at any time. We will notify you of significant changes through the App. Continued use after changes constitutes acceptance.
                    </p>

                    <h2>12. Governing Law</h2>
                    <p>
                        These terms are governed by the laws of India. Any disputes shall be resolved in the courts of Bengaluru, Karnataka.
                    </p>

                    <h2>13. Contact</h2>
                    <p>
                        For questions about these terms, contact us at:
                    </p>
                    <ul>
                        <li>Email: <a href="mailto:legal@backbenchers.app">legal@backbenchers.app</a></li>
                        <li>Website: <a href="https://backbenchers.app">backbenchers.app</a></li>
                    </ul>

                    <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                            By using Backbenchers, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
