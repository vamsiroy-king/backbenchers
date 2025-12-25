import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";
import { JsonLd } from "@/components/JsonLd";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans", weight: ["400", "500", "600", "700", "800"] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#16a34a',
};

export const metadata: Metadata = {
  title: {
    default: "Backbenchers — Born to Save | India's #1 Student Discount App",
    template: "%s | Backbenchers"
  },
  description: "Backbenchers. Born to Save. India's first student discount platform with QR-verified in-store redemption. Get exclusive deals at local restaurants, cafes & stores.",
  keywords: [
    "student discounts India",
    "college student offers",
    "student discount app",
    "Backbenchers app",
    "student perks",
    "QR discount verification",
    "student deals Bengaluru",
    "student offers India",
    "campus discounts",
    "student savings app"
  ],
  authors: [{ name: "Vamsiram G", url: "https://backbenchers.app/founder" }],
  creator: "Backbenchers",
  publisher: "Backbenchers",
  applicationName: "Backbenchers",
  category: "Lifestyle",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://backbenchers.app",
    siteName: "Backbenchers",
    title: "Backbenchers — Born to Save | India's #1 Student Discount App",
    description: "Backbenchers. Born to Save. India's first student discount platform with QR-verified in-store redemption.",
    images: [
      {
        url: "https://backbenchers.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "Backbenchers - Student Discounts Made Easy"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Backbenchers — Born to Save",
    description: "Backbenchers. Born to Save. Get exclusive student discounts at local stores!",
    creator: "@BackbenchersApp",
    images: ["https://backbenchers.app/twitter-image.png"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  verification: {
    google: 'YOUR_GOOGLE_VERIFICATION_CODE', // Add your Google Search Console verification
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Backbenchers',
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <JsonLd />
        <link rel="canonical" href="https://backbenchers.app" />
        {/* Theme initialization script - runs before page renders to prevent flash */}
        <script dangerouslySetInnerHTML={{
          __html: `
          (function() {
            try {
              var theme = localStorage.getItem('bb-theme');
              if (theme === 'dark') {
                document.documentElement.classList.add('dark');
              }
            } catch(e) {}
          })();
        `}} />
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased overscroll-none", plusJakarta.variable)} suppressHydrationWarning>
        <Providers>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}

