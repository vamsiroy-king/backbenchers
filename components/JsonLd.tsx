"use client";

// JSON-LD Structured Data for SEO
// This helps Google understand your website and show rich results

export function JsonLd() {
    const organizationSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Backbenchers",
        "alternateName": "Backbenchers App",
        "url": "https://backbenchers.app",
        "logo": "https://backbenchers.app/logo.png",
        "description": "India's first student discount platform with QR-verified in-store redemption. Exclusive deals for verified college students.",
        "foundingDate": "2024",
        "foundingLocation": {
            "@type": "Place",
            "address": {
                "@type": "PostalAddress",
                "addressCountry": "IN",
                "addressRegion": "Karnataka",
                "addressLocality": "Bengaluru"
            }
        },
        "founder": {
            "@type": "Person",
            "name": "Vamsiram G",
            "jobTitle": "Founder & CEO",
            "url": "https://backbenchers.app/founder"
        },
        "sameAs": [
            "https://www.linkedin.com/company/backbenchers-app",
            "https://twitter.com/BackbenchersApp",
            "https://www.instagram.com/backbenchers.app"
        ],
        "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "customer service",
            "email": "support@backbenchers.app"
        }
    };

    const founderSchema = {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": "Vamsiram G",
        "jobTitle": "Founder & CEO",
        "worksFor": {
            "@type": "Organization",
            "name": "Backbenchers"
        },
        "description": "Founder & CEO of Backbenchers - India's first student discount platform. Building the future of student benefits with QR-verified in-store redemption.",
        "url": "https://backbenchers.app/founder",
        "sameAs": [
            "https://www.linkedin.com/in/vamsiram"
        ]
    };

    const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Backbenchers",
        "url": "https://backbenchers.app",
        "description": "India's first student discount platform with QR-verified in-store redemption",
        "potentialAction": {
            "@type": "SearchAction",
            "target": "https://backbenchers.app/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
        }
    };

    const mobileAppSchema = {
        "@context": "https://schema.org",
        "@type": "MobileApplication",
        "name": "Backbenchers - Student Discounts",
        "operatingSystem": "Android, iOS, Web",
        "applicationCategory": "LifestyleApplication",
        "description": "Get exclusive student discounts at local stores. Verify once, save everywhere!",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "INR"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "ratingCount": "100"
        }
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(founderSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(mobileAppSchema) }}
            />
        </>
    );
}
