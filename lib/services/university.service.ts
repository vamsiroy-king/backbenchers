// University service - fetch universities from Supabase database
import { supabase } from '@/lib/supabase';

export interface University {
    id: string;
    name: string;
    shortName: string | null;
    city: string;
    state: string;
    emailDomain: string | null;
    isActive: boolean;
    totalStudents: number;
}

// Transform snake_case to camelCase
function transformUniversity(row: any): University {
    return {
        id: row.id,
        name: row.name,
        shortName: row.short_name,
        city: row.city,
        state: row.state,
        emailDomain: row.email_domain,
        isActive: row.is_active,
        totalStudents: row.total_students || 0
    };
}

// City name aliases (common alternate names)
const CITY_ALIASES: Record<string, string[]> = {
    "Bangalore": ["Bangalore", "Bengaluru"],
    "Bengaluru": ["Bangalore", "Bengaluru"],
    "Mumbai": ["Mumbai", "Bombay"],
    "Bombay": ["Mumbai", "Bombay"],
    "Chennai": ["Chennai", "Madras"],
    "Madras": ["Chennai", "Madras"],
    "Kolkata": ["Kolkata", "Calcutta"],
    "Calcutta": ["Kolkata", "Calcutta"],
    "Mysuru": ["Mysuru", "Mysore"],
    "Mysore": ["Mysuru", "Mysore"],
    "Mangaluru": ["Mangaluru", "Mangalore"],
    "Mangalore": ["Mangaluru", "Mangalore"],
};

// Get all possible names for a city
function getCityVariants(city: string): string[] {
    return CITY_ALIASES[city] || [city];
}

export const universityService = {
    // Get all active universities
    async getAll(): Promise<University[]> {
        const { data, error } = await supabase
            .from('universities')
            .select('*')
            .eq('is_active', true)
            .order('name');

        if (error) throw error;
        return (data || []).map(transformUniversity);
    },

    // Get universities by state
    async getByState(state: string): Promise<University[]> {
        const { data, error } = await supabase
            .from('universities')
            .select('*')
            .eq('state', state)
            .eq('is_active', true)
            .order('name');

        if (error) throw error;
        return (data || []).map(transformUniversity);
    },

    // Get universities by city (PRIMARY USE CASE)
    // Uses city aliases to handle variations like Bangalore/Bengaluru
    async getByCity(city: string): Promise<University[]> {
        const cityVariants = getCityVariants(city);

        const { data, error } = await supabase
            .from('universities')
            .select('*')
            .in('city', cityVariants)
            .eq('is_active', true)
            .order('name');

        if (error) throw error;
        return (data || []).map(transformUniversity);
    },

    // Get universities by state AND city
    async getByStateAndCity(state: string, city: string): Promise<University[]> {
        const { data, error } = await supabase
            .from('universities')
            .select('*')
            .eq('state', state)
            .eq('city', city)
            .eq('is_active', true)
            .order('name');

        if (error) throw error;
        return (data || []).map(transformUniversity);
    },

    // Get university by ID
    async getById(id: string): Promise<University | null> {
        const { data, error } = await supabase
            .from('universities')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return null;
        return transformUniversity(data);
    },

    // Get total count of universities
    async getCount(): Promise<number> {
        const { count, error } = await supabase
            .from('universities')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true);

        if (error) return 0;
        return count || 0;
    },

    // Get unique states that have universities
    async getAvailableStates(): Promise<string[]> {
        const { data, error } = await supabase
            .from('universities')
            .select('state')
            .eq('is_active', true);

        if (error) return [];

        // Get unique states
        const states = [...new Set((data || []).map(d => d.state))];
        return states.sort();
    },

    // Get unique cities that have universities in a state
    async getAvailableCities(state: string): Promise<string[]> {
        const { data, error } = await supabase
            .from('universities')
            .select('city')
            .eq('state', state)
            .eq('is_active', true);

        if (error) return [];

        // Get unique cities
        const cities = [...new Set((data || []).map(d => d.city))];
        return cities.sort();
    }
};
