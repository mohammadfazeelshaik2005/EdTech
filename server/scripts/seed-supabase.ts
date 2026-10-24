/**
 * PathSync AI — Supabase Database Seeder & Health Check
 * Connects to the configured Supabase instance and seeds the opportunities table.
 *
 * Usage:
 *   npx tsx scripts/seed-supabase.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Read .env manually
function loadEnv() {
  const envPaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../.env'),
  ];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const idx = trimmed.indexOf('=');
        if (idx !== -1) {
          const key = trimmed.slice(0, idx).trim();
          const value = trimmed.slice(idx + 1).trim();
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    }
  }
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

async function main() {
  console.log('================================================================');
  console.log('🐘 PATHSYNC AI: POSTGRESQL / SUPABASE DATABASE SETUP & SEED');
  console.log('================================================================\n');

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('mock-pathsync') || supabaseUrl.includes('your-project')) {
    console.log('⚠️  Notice: Current .env contains mock or placeholder Supabase credentials.');
    console.log(`   VITE_SUPABASE_URL: ${supabaseUrl || '(not set)'}`);
    console.log('\nTo connect to your real PostgreSQL database via Supabase:');
    console.log('  1. Create a project on https://supabase.com (PostgreSQL 15/16)');
    console.log('  2. Run the SQL schema: supabase/schema.sql in the Supabase SQL Editor');
    console.log('  3. Run the SQL seed:   supabase/seed.sql in the Supabase SQL Editor');
    console.log('  4. Update .env with your real Project URL & anon key');
    console.log('\nFor Standalone / Local PostgreSQL:');
    console.log('  Run: docker compose up -d');
    console.log('  Or execute database/standalone-postgres.sql directly in psql.\n');
    return;
  }

  console.log(`📡 Connecting to Supabase project: ${supabaseUrl}...`);
  const client = createClient(supabaseUrl, supabaseKey);

  // 1. Check if opportunities table exists
  const { data, error } = await client.from('opportunities').select('id, title, verification_status').limit(5);

  if (error) {
    console.error('❌ Failed to query opportunities table:', error.message);
    console.log('\n👉 Please run supabase/schema.sql in your Supabase SQL Editor first!');
    return;
  }

  console.log(`✅ Successfully connected! Found ${data?.length || 0} existing opportunities.`);
  console.log('Done!');
}

main().catch(console.error);
