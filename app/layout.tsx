import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";

const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans", weight: ["400", "500", "600", "700", "800"] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover', // Critical for iPhone notch/home indicator
  themeColor: '#16a34a', // Primary green color for browser chrome
};

export const metadata: Metadata = {
  title: "Backbenchers - Student Perks",
  description: "Exclusive discounts and perks for students.",
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Backbenchers',
  },
  formatDetection: {
    telephone: false, // Prevent auto-linking phone numbers
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased overscroll-none", plusJakarta.variable)} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

