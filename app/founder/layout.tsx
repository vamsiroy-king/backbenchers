import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Vamsiram G - Founder & CEO of Backbenchers",
    description: "Meet Vamsiram G, the Founder & CEO of Backbenchers - India's first student discount platform. Learn about his journey building the future of student benefits.",
    openGraph: {
        title: "Vamsiram G - Founder & CEO of Backbenchers",
        description: "Meet the founder of India's first student discount platform.",
        url: "https://backbenchers.app/founder",
        type: "profile"
    },
    twitter: {
        title: "Vamsiram G - Founder of Backbenchers",
        description: "Building India's first student discount platform."
    }
};

export default function FounderLayout({ children }: { children: React.ReactNode }) {
    return children;
}
