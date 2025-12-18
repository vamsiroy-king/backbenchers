import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/dashboard/',
                    '/admin/',
                    '/merchant/dashboard/',
                    '/api/',
                    '/auth/callback',
                ],
            },
        ],
        sitemap: 'https://backbenchers.app/sitemap.xml',
    };
}
