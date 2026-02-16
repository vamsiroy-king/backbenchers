const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables for DB URL
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is missing in .env.local');
    dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

// Construct DATABASE_URL if missing
if (!process.env.DATABASE_URL) {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        // e.g. https://ruyfnutavgnsxgmfwdzo.supabase.co -> ruyfnutavgnsxgmfwdzo
        const ref = process.env.NEXT_PUBLIC_SUPABASE_URL.split('://')[1].split('.')[0];
        // Standard Supabase Transaction Pooler URL (usually)
        // postgres://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
        // Wait, we don't have the password!
        // We can't connect via 'pg' without a password.

        console.error('DATABASE_URL and DB_PASSWORD are missing. Cannot run SQL migration directly.');

        // Fallback: Try to use Supabase Service Role Key via REST API to "rpc" if we can wrap it?
        // No, we can't run raw SQL via REST unless there's an enabled extension or function.

        console.log('--- ACTION REQUIRED ---');
        console.log('Please add DATABASE_URL to your .env.local file to run migrations.');
        console.log('Format: postgres://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres');
        process.exit(1);
    }
}

const migrationPath = path.resolve(__dirname, '../supabase/migrations/050_fix_admin_stats_access.sql');
const sql = fs.readFileSync(migrationPath, 'utf8');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for Supabase transaction pooler usually
});

async function applyMigration() {
    try {
        console.log('Connecting to database...');
        await client.connect();

        console.log('Running Migration 050...');
        await client.query(sql);

        console.log('Migration successfully applied! ✅');
    } catch (err) {
        console.error('Migration Failed ❌:', err);
    } finally {
        await client.end();
    }
}

applyMigration();
