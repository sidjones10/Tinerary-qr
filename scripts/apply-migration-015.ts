/**
 * Script to apply migration 015: Fix notifications and metrics
 * This adds missing columns and RLS policies
 *
 * Run with: npx tsx scripts/apply-migration-015.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

async function applyMigration() {
  // Get environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Missing environment variables')
    console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    console.error('   Make sure these are set in your .env.local file')
    process.exit(1)
  }

  console.log('🔧 Connecting to Supabase...')
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Read the migration file
  const migrationPath = path.join(process.cwd(), 'supabase/migrations/015_fix_notifications_and_metrics.sql')
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

  console.log('📝 Applying migration 015_fix_notifications_and_metrics.sql...')
  console.log('')

  // Split the SQL into individual statements and execute them
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  let successCount = 0
  let errorCount = 0

  for (const statement of statements) {
    try {
      // Execute SQL via Supabase's REST API (rpc function)
      const { error } = await supabase.rpc('exec_sql', { sql: statement })

      if (error) {
        console.error(`❌ Error executing statement:`)
        console.error(`   ${statement.substring(0, 100)}...`)
        console.error(`   Error: ${error.message}`)
        errorCount++
      } else {
        successCount++
        // Show a summary of what was executed
        const action = statement.match(/^(ALTER|CREATE|DROP)\s+(\w+)/i)
        if (action) {
          console.log(`✅ ${action[1]} ${action[2]}`)
        }
      }
    } catch (err: any) {
      console.error(`❌ Unexpected error:`)
      console.error(`   ${err.message}`)
      errorCount++
    }
  }

  console.log('')
  console.log('📊 Migration Results:')
  console.log(`   ✅ Success: ${successCount} statements`)
  if (errorCount > 0) {
    console.log(`   ❌ Errors: ${errorCount} statements`)
    console.log('')
    console.log('⚠️  Some statements failed. This is normal if:')
    console.log('   - Columns already exist (IF NOT EXISTS)')
    console.log('   - Policies already exist (IF NOT EXISTS)')
    console.log('   - Indexes already exist (IF NOT EXISTS)')
  } else {
    console.log('')
    console.log('🎉 Migration completed successfully!')
  }
}

applyMigration().catch((error) => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
