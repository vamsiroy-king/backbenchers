// Unified Search Service - Real-time search across all data sources
// Searches: Categories, Merchants, Online Brands, Offers

import { supabase } from '../supabase';

export interface SearchResult {
    id: string;
    type: 'category' | 'merchant' | 'brand' | 'offer';
    name: string;
    subtitle?: string;
    icon?: string;
    logo?: string;
    distance?: number; // km, for nearby stores
    discountValue?: number;
    discountType?: string;
    category?: string;
    city?: string;
    isOnline?: boolean;
}

export interface SearchResults {
    categories: SearchResult[];
    merchants: SearchResult[];
    brands: SearchResult[];
    offers: SearchResult[];
    total: number;
}

export const searchService = {
    /**
     * Unified search across all data sources
     * @param query - Search query string
     * @param options - Filter options (city, online/offline, category)
     */
    async search(
        query: string,
        options?: {
            city?: string;
            onlineOnly?: boolean;
            offlineOnly?: boolean;
            category?: string;
            limit?: number;
        }
    ): Promise<SearchResults> {
        const searchTerm = query.trim().toLowerCase();
        const limit = options?.limit || 5;

        if (searchTerm.length < 2) {
            return { categories: [], merchants: [], brands: [], offers: [], total: 0 };
        }

        try {
            // Parallel searches for performance
            const [categoriesRes, merchantsRes, brandsRes, offersRes] = await Promise.all([
                this.searchCategories(searchTerm, limit),
                this.searchMerchants(searchTerm, options?.city, limit),
                this.searchBrands(searchTerm, limit),
                this.searchOffers(searchTerm, options?.city, limit)
            ]);

            return {
                categories: categoriesRes,
                merchants: options?.onlineOnly ? [] : merchantsRes,
                brands: options?.offlineOnly ? [] : brandsRes,
                offers: offersRes,
                total: categoriesRes.length + merchantsRes.length + brandsRes.length + offersRes.length
            };
        } catch (error) {
            console.error('Search error:', error);
            return { categories: [], merchants: [], brands: [], offers: [], total: 0 };
        }
    },

    /**
     * Search categories
     */
    async searchCategories(query: string, limit: number = 5): Promise<SearchResult[]> {
        const { data, error } = await supabase
            .from('categories')
            .select('id, name, tagline, icon')
            .eq('is_active', true)
            .ilike('name', `%${query}%`)
            .limit(limit);

        if (error || !data) return [];

        return data.map(cat => ({
            id: cat.id,
            type: 'category' as const,
            name: cat.name,
            subtitle: cat.tagline,
            icon: cat.icon
        }));
    },

    /**
     * Search merchants (offline stores)
     */
    async searchMerchants(query: string, city?: string, limit: number = 5): Promise<SearchResult[]> {
        let queryBuilder = supabase
            .from('merchants')
            .select('id, business_name, category, city, logo_url, average_rating')
            .eq('status', 'approved')
            .or(`business_name.ilike.%${query}%,category.ilike.%${query}%,description.ilike.%${query}%`)
            .limit(limit);

        if (city) {
            queryBuilder = queryBuilder.eq('city', city);
        }

        const { data, error } = await queryBuilder;

        if (error || !data) return [];

        return data.map(m => ({
            id: m.id,
            type: 'merchant' as const,
            name: m.business_name,
            subtitle: m.category,
            logo: m.logo_url,
            city: m.city,
            isOnline: false
        }));
    },

    /**
     * Search online brands
     */
    async searchBrands(query: string, limit: number = 5): Promise<SearchResult[]> {
        const { data, error } = await supabase
            .from('online_brands')
            .select('id, name, category, logo_url, tagline')
            .eq('is_active', true)
            .or(`name.ilike.%${query}%,category.ilike.%${query}%,tagline.ilike.%${query}%`)
            .limit(limit);

        if (error || !data) return [];

        return data.map(b => ({
            id: b.id,
            type: 'brand' as const,
            name: b.name,
            subtitle: b.category,
            logo: b.logo_url,
            isOnline: true
        }));
    },

    /**
     * Search offers
     */
    async searchOffers(query: string, city?: string, limit: number = 5): Promise<SearchResult[]> {
        // First get matching offers
        let queryBuilder = supabase
            .from('offers')
            .select(`
                id, 
                title, 
                discount_value, 
                type,
                merchant_id,
                merchants!inner(business_name, city, logo_url)
            `)
            .eq('status', 'active')
            .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
            .limit(limit);

        const { data, error } = await queryBuilder;

        if (error || !data) return [];

        let results = data.map((o: any) => ({
            id: o.id,
            type: 'offer' as const,
            name: o.title,
            subtitle: o.merchants?.business_name,
            logo: o.merchants?.logo_url,
            discountValue: o.discount_value,
            discountType: o.type,
            city: o.merchants?.city,
            isOnline: false
        }));

        // Filter by city if specified
        if (city) {
            results = results.filter(r => !r.city || r.city.toLowerCase() === city.toLowerCase());
        }

        return results;
    },

    /**
     * Get popular/trending searches (based on common searches)
     */
    getPopularSearches(): string[] {
        return [
            'Starbucks',
            'Nike',
            'Food & Dining',
            'Fashion',
            'Pizza',
            'Gym',
            'Coffee',
            'Electronics'
        ];
    },

    /**
     * Get recent searches from localStorage
     */
    getRecentSearches(): string[] {
        if (typeof window === 'undefined') return [];
        try {
            const recent = localStorage.getItem('recentSearches');
            return recent ? JSON.parse(recent) : [];
        } catch {
            return [];
        }
    },

    /**
     * Save a search to recent searches
     */
    saveRecentSearch(query: string): void {
        if (typeof window === 'undefined' || !query.trim()) return;
        try {
            let recent = this.getRecentSearches();
            // Remove if exists, add to front, limit to 5
            recent = recent.filter(s => s.toLowerCase() !== query.toLowerCase());
            recent.unshift(query);
            recent = recent.slice(0, 5);
            localStorage.setItem('recentSearches', JSON.stringify(recent));
        } catch {
            // Ignore localStorage errors
        }
    },

    /**
     * Clear recent searches
     */
    clearRecentSearches(): void {
        if (typeof window === 'undefined') return;
        localStorage.removeItem('recentSearches');
    }
};
