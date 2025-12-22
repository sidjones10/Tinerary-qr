import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log("Applying profile creation trigger...")

    // Create the function
    const functionSQL = `
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
`

    await supabase.rpc("exec", { sql: functionSQL }).catch(() => {
      console.log("RPC not available, function may need manual creation")
    })

    // Drop existing trigger
    const dropTriggerSQL = `DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;`

    await supabase.rpc("exec", { sql: dropTriggerSQL }).catch(() => {
      console.log("Could not drop trigger via RPC")
    })

    // Create the trigger
    const triggerSQL = `
CREATE TRIGGER create_profile_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_profile_for_user();
`

    await supabase.rpc("exec", { sql: triggerSQL }).catch(() => {
      console.log("Could not create trigger via RPC")
    })

    // Fix existing users without profiles
    const fixExistingSQL = `
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
`

    await supabase.rpc("exec", { sql: fixExistingSQL }).catch(() => {
      console.log("Could not fix existing users via RPC")
    })

    return NextResponse.json({
      success: true,
      message: "If you see this, go to Supabase Dashboard SQL Editor and paste the migration manually",
      dashboardUrl:
        "https://supabase.com/dashboard/project/sdkazvcbmthdemmwjrjk/sql/new",
      migrationFile: "supabase/migrations/014_add_profile_creation_trigger.sql",
    })
  } catch (error: any) {
    console.error("Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        instruction:
          "Please apply the migration manually via Supabase Dashboard",
        dashboardUrl:
          "https://supabase.com/dashboard/project/sdkazvcbmthdemmwjrjk/sql/new",
        migrationFile:
          "supabase/migrations/014_add_profile_creation_trigger.sql",
      },
      { status: 500 },
    )
  }
}
