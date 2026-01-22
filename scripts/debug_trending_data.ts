
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env from parent directory
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log('Checking Online Offers...');
    const { data: offers, error: offersError } = await supabase
        .from('online_offers')
        .select('*')
        .limit(5);

    if (offersError) {
        console.error('Error fetching offers:', offersError);
        return;
    }

    console.log(`Found ${offers.length} online offers.`);
    if (offers.length > 0) {
        console.log('Sample Offer:', JSON.stringify(offers[0], null, 2));

        const brandIds = offers.map((o: any) => o.brand_id).filter(Boolean);
        console.log('Brand IDs from offers:', brandIds);

        if (brandIds.length > 0) {
            console.log('Checking Online Brands...');
            const { data: brands, error: brandsError } = await supabase
                .from('online_brands')
                .select('*')
                .in('id', brandIds);

            if (brandsError) {
                console.error('Error fetching brands:', brandsError);
            } else {
                console.log(`Found ${brands.length} matching brands.`);
                if (brands.length > 0) {
                    console.log('Sample Brand:', JSON.stringify(brands[0], null, 2));
                } else {
                    console.warn('No matching brands found for the offer brand_ids!');
                }
            }
        }
    } else {
        console.warn('No online_offers found.');
    }
}

checkData();
