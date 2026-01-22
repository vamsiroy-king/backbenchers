
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log('--- DIAGNOSING TRENDING DATA ---');

    console.log('\n1. Checking ONLINE OFFERS...');
    const { data: onlineOffers, error: onlineError } = await supabase
        .from('online_offers')
        .select('id, title, brand_id')
        .eq('is_active', true)
        .limit(5);

    if (onlineError) {
        console.error('Error fetching online_offers:', onlineError);
    } else {
        console.log(`Found ${onlineOffers.length} online offers.`);
        const brandIds = [...new Set(onlineOffers.map(o => o.brand_id))];
        console.log('Brand IDs found:', brandIds);

        if (brandIds.length > 0) {
            console.log('\n2. Checking ONLINE BRANDS...');
            const { data: brands, error: brandsError } = await supabase
                .from('online_brands')
                .select('id, name, logo_url, average_rating')
                .in('id', brandIds);

            if (brandsError) {
                console.error('Error fetching online_brands:', brandsError);
            } else {
                console.log(`Found ${brands.length} matching brands.`);
                brands.forEach(b => {
                    console.log(`- Brand: ${b.name} (ID: ${b.id})`);
                    console.log(`  Logo URL: ${b.logo_url}`);
                    console.log(`  Rating: ${b.average_rating}`);
                });

                const foundIds = brands.map(b => b.id);
                const missingIds = brandIds.filter(id => !foundIds.includes(id));
                if (missingIds.length > 0) {
                    console.log('WARNING: The following Brand IDs exist in offers but NOT in online_brands:', missingIds);
                }
            }
        }
    }

    console.log('\n3. Checking OFFLINE TRENDING...');
    const { data: offlineOffers, error: offlineError } = await supabase
        .from('offers')
        .select(`
            id, title, 
            merchants!inner(id, business_name, city, status, online_store, logo_url, average_rating)
        `)
        .eq('status', 'active')
        .eq('merchants.status', 'approved')
        .eq('merchants.online_store', false)
        .limit(5);

    if (offlineError) {
        console.error('Error fetching offline offers:', offlineError);
    } else {
        console.log(`Found ${offlineOffers.length} offline offers.`);
        offlineOffers.forEach(o => {
            console.log(`- Offer: ${o.title} | Merchant: ${o.merchants.business_name}`);
            console.log(`  Merchant Status: ${o.merchants.status}`);
            console.log(`  Online Store: ${o.merchants.online_store}`);
            console.log(`  Logo: ${o.merchants.logo ? 'Has Blob' : 'Null'} | URL: ${o.merchants.logo_url}`);
        });
    }
}

diagnose();
