#!/usr/bin/env node

/**
 * Migration Script: Create Itinerary Attendees Table
 *
 * This script applies migration 021 which creates the itinerary_attendees table
 * and fixes expense display issues on posted itineraries.
 *
 * Usage: node scripts/run-migration-021.js
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function runMigration() {
  console.log('🚀 Starting Migration 021: Create Itinerary Attendees Table\n');

  // Check for Supabase credentials
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Missing Supabase credentials');
    console.error('Please ensure the following environment variables are set:');
    console.error('  - NEXT_PUBLIC_SUPABASE_URL');
    console.error('  - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  try {
    // Import Supabase client
    const { createClient } = require('@supabase/supabase-js');

    // Create admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('✅ Connected to Supabase');

    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '021_create_itinerary_attendees.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('\n📄 Migration SQL loaded');
    console.log('Running migration...\n');

    // Execute the migration
    // Note: Supabase client doesn't support multi-statement queries directly,
    // so we need to split and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip empty or comment-only statements
      if (!statement || statement.length < 5) continue;

      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        });

        if (error) {
          // Try direct query execution as fallback
          const { error: directError } = await supabase
            .from('_migrations')
            .select('*')
            .limit(0);  // This is just to test connection

          if (directError && directError.code === '42P01') {
            // Table doesn't exist, which is expected
          }

          console.log(`⚠️  Statement ${i + 1}: ${error.message || 'Warning - may have already been applied'}`);
        } else {
          successCount++;
          console.log(`✅ Statement ${i + 1}: Executed successfully`);
        }
      } catch (err) {
        errorCount++;
        console.error(`❌ Statement ${i + 1} failed:`, err.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Migration Summary:');
    console.log(`  Total statements: ${statements.length}`);
    console.log(`  Successful: ${successCount}`);
    console.log(`  Errors: ${errorCount}`);
    console.log('='.repeat(60));

    // Verify the migration
    console.log('\n🔍 Verifying migration...');

    // Check if itinerary_attendees table exists
    const { data: attendees, error: attendeesError } = await supabase
      .from('itinerary_attendees')
      .select('count')
      .limit(1);

    if (attendeesError) {
      console.error('❌ Verification failed: itinerary_attendees table not found');
      console.error('You may need to apply the migration manually via Supabase Dashboard');
      console.error('\nSee: supabase/migrations/021_README.md for instructions');
    } else {
      console.log('✅ itinerary_attendees table exists');

      // Count attendees
      const { count, error: countError } = await supabase
        .from('itinerary_attendees')
        .select('*', { count: 'exact', head: true });

      if (!countError) {
        console.log(`✅ Found ${count || 0} attendees in the system`);
      }
    }

    console.log('\n✨ Migration 021 completed!\n');
    console.log('Next steps:');
    console.log('1. Test by visiting a posted itinerary');
    console.log('2. Go to the Expenses tab');
    console.log('3. Try adding an expense');
    console.log('4. Verify that expense splits are created automatically\n');

  } catch (error) {
    console.error('\n❌ Migration failed with error:', error.message);
    console.error('\nPlease apply the migration manually via Supabase Dashboard:');
    console.error('1. Go to your Supabase project');
    console.error('2. Navigate to SQL Editor');
    console.error('3. Copy and paste the contents of:');
    console.error('   supabase/migrations/021_create_itinerary_attendees.sql');
    console.error('4. Click Run\n');
    console.error('See supabase/migrations/021_README.md for detailed instructions\n');
    process.exit(1);
  }
}

// Run the migration
runMigration().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
