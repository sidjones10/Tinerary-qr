import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

async function applyMigration() {
  // Create Supabase client with service role key for admin access
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing environment variables!')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // Read the migration file
  const migrationPath = path.join(process.cwd(), 'supabase/migrations/014_add_profile_creation_trigger.sql')
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

  console.log('Applying migration: 014_add_profile_creation_trigger.sql')
  console.log('---')

  try {
    // Execute the migration SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL })

    if (error) {
      // If rpc doesn't exist, try direct SQL execution through the REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: migrationSQL })
      })

      if (!response.ok) {
        throw new Error(`Failed to execute migration: ${await response.text()}`)
      }
    }

    console.log('✅ Migration applied successfully!')
    console.log('---')
    console.log('The profile creation trigger is now active.')
    console.log('Try signing up again!')

  } catch (error) {
    console.error('❌ Error applying migration:', error)
    console.log('\n📝 Manual application required:')
    console.log('1. Go to: https://supabase.com/dashboard/project/sdkazvcbmthdemmwjrjk/sql/new')
    console.log('2. Copy and paste the migration SQL')
    console.log('3. Click Run')
    process.exit(1)
  }
}

applyMigration()
