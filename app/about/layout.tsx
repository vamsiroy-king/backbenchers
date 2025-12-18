import { Metadata } from "next";

export const metadata: Metadata = {
    title: "About Backbenchers - India's First Student Discount Platform",
    description: "Learn about Backbenchers, India's first student discount platform with QR-verified in-store redemption. Our mission is to make student life more affordable.",
    openGraph: {
        title: "About Backbenchers - India's First Student Discount Platform",
        description: "Learn about Backbenchers, India's first student discount platform with QR-verified in-store redemption.",
        url: "https://backbenchers.app/about",
        type: "website"
    },
    twitter: {
        title: "About Backbenchers",
        description: "India's first student discount platform. Learn our story."
    }
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
    return children;
}
