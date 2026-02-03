const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local');
    // Try .env if .env.local fails or keys missing
    dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

console.log('Connecting to Supabase...');
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

// Decode JWT to check role
function parseJwt(token) {
    try {
        return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    } catch (e) {
        return null;
    }
}

const jwt = parseJwt(process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('Key Role:', jwt ? jwt.role : 'Invalid Token');

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    }
);

async function verifyPermissions() {
    console.log('\n--- Test 1: List Auth Users ---');
    const { data: users, error: authError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1 });
    if (authError) console.error('Auth Error:', authError.message);
    else console.log('Auth Users Access: OK');

    console.log('\n--- Test 2: Select from transactions ---');
    const { data: tx, error: txError } = await supabaseAdmin.from('transactions').select('id').limit(1);
    if (txError) console.error('Transactions Error:', txError.message);
    else console.log('Transactions Access: OK');

    console.log('\n--- Test 3: Select from students ---');
    const { data: st, error: stError } = await supabaseAdmin.from('students').select('id').limit(1);
    if (stError) console.error('Students Error:', stError.message);
    else console.log('Students Access: OK');

    console.log('\n--- Test 4: Select from merchants ---');
    const { data: mt, error: mtError } = await supabaseAdmin.from('merchants').select('id').limit(1);
    if (mtError) console.error('Merchants Error:', mtError.message);
    else console.log('Merchants Access: OK');
}

verifyPermissions();
