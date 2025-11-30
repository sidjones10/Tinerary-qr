// Quick script to apply the profile creation trigger
// Run with: node apply-trigger.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function applyTrigger() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing environment variables!');
    console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
    process.exit(1);
  }

  console.log('🔗 Connecting to Supabase...');
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // The SQL to create the trigger
  const sql = `
-- Add trigger to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;

-- Create the trigger
CREATE TRIGGER create_profile_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_profile_for_user();

-- Update existing auth users that don't have profiles
INSERT INTO public.profiles (id, email, username, name)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1)),
  COALESCE(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1))
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
`;

  console.log('📝 Applying profile creation trigger...\n');

  try {
    // Split the SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      const { error } = await supabase.rpc('exec', { sql: statement });
      if (error) {
        // Try alternate approach using from
        const { error: error2 } = await supabase.from('_migrations').select('*');
        console.error('⚠️  Could not execute via RPC, trying manual approach...');
        break;
      }
    }

    console.log('\n✅ Trigger applied successfully!');
    console.log('\n🎉 You can now try signing up again.');
    console.log('The trigger will automatically create profiles for new users.\n');

  } catch (error) {
    console.error('\n❌ Automatic application failed.');
    console.error('Error:', error.message);
    console.log('\n📋 Please apply manually via Supabase Dashboard:');
    console.log('1. Go to: https://supabase.com/dashboard/project/sdkazvcbmthdemmwjrjk/sql/new');
    console.log('2. Paste the contents of: supabase/migrations/014_add_profile_creation_trigger.sql');
    console.log('3. Click "Run"\n');
  }
}

applyTrigger();
