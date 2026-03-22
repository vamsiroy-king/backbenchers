const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
const outputFile = path.join(__dirname, 'init.sql');

try {
    const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort(); // Sort alphabetically to maintain order

    let combinedSql = `-- ================================================================
-- BACKBENCHERS FULL DATABASE REPLICA (INIT.SQL)
-- Auto-generated from all Supabase migrations
-- Run this in the Supabase SQL Editor of the fresh project
-- ================================================================\n\n`;

    for (const file of files) {
        const filePath = path.join(migrationsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');

        combinedSql += `-- ================================================================\n`;
        combinedSql += `-- MIGRATION: ${file}\n`;
        combinedSql += `-- ================================================================\n\n`;
        combinedSql += content + '\n\n';
    }

    fs.writeFileSync(outputFile, combinedSql);
    console.log(`Successfully combined ${files.length} migration files into init.sql`);
} catch (error) {
    console.error('Error combining SQL files:', error);
}
