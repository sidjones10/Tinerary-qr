import { createClient } from "@supabase/supabase-js"

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase environment variables are not set")
}

// Create a Supabase client
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
})

// Function to test the database connection
export async function testConnection() {
  try {
    console.log("Testing Supabase connection...")

    // First, check if we can connect to Supabase at all
    const { data: healthCheck, error: healthError } = await supabaseClient.rpc("get_service_status")

    if (healthError) {
      console.log("Health check failed, trying system schema query...")

      // If RPC fails, try a simple query that should work on any Supabase instance
      const { data: systemData, error: systemError } = await supabaseClient
        .from("_prisma_migrations")
        .select("*")
        .limit(1)
        .maybeSingle()

      if (systemError) {
        console.log("System schema query failed, trying public schema...")

        // Try to query any table in the public schema
        const { data: tablesData, error: tablesError } = await supabaseClient
          .from("pg_tables")
          .select("tablename")
          .eq("schemaname", "public")
          .limit(5)

        if (tablesError) {
          console.log("Public schema query failed, trying raw query...")

          // Last resort - try a raw SQL query
          const { data: rawData, error: rawError } = await supabaseClient.rpc("execute_sql", {
            sql: "SELECT current_database() as db_name",
          })

          if (rawError) {
            console.error("All connection attempts failed:", rawError)
            return {
              success: false,
              message: "Failed to connect to Supabase database",
              error: rawError,
              details: "All connection attempts failed",
            }
          }

          return {
            success: true,
            message: "Connected to Supabase with limited permissions",
            data: { database: rawData?.db_name || "unknown" },
            details: "Only raw SQL query succeeded",
          }
        }

        return {
          success: true,
          message: "Connected to Supabase database",
          data: { tables: tablesData },
          details: "Found tables in public schema",
        }
      }

      return {
        success: true,
        message: "Connected to Supabase system schema",
        data: systemData,
        details: "Connected to system schema",
      }
    }

    return {
      success: true,
      message: "Supabase connection successful",
      data: healthCheck,
      details: "Health check passed",
    }
  } catch (error) {
    console.error("Supabase connection test failed:", error)
    return {
      success: false,
      message: "Supabase connection failed with exception",
      error,
      details: "Exception thrown during connection test",
    }
  }
}

// Create a compatibility layer for code that was using drizzle
export const db = {
  // Add methods that mimic the drizzle API but use supabaseClient directly
  query: async (table: string, options: any = {}) => {
    const { data, error } = await supabaseClient.from(table).select(options.columns || "*")
    if (error) throw error
    return data
  },
  insert: async (table: string, values: any) => {
    const { data, error } = await supabaseClient.from(table).insert(values).select()
    if (error) throw error
    return data
  },
  update: async (table: string, values: any, conditions: any) => {
    let query = supabaseClient.from(table).update(values)

    // Apply conditions if they exist
    if (conditions && conditions.where) {
      Object.entries(conditions.where).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
    }

    const { data, error } = await query.select()
    if (error) throw error
    return data
  },
  delete: async (table: string, conditions: any) => {
    let query = supabaseClient.from(table).delete()

    // Apply conditions if they exist
    if (conditions && conditions.where) {
      Object.entries(conditions.where).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
    }

    const { data, error } = await query.select()
    if (error) throw error
    return data
  },
}

// Function to check if a table exists
export async function checkTableExists(tableName: string) {
  try {
    // This is a simple way to check if a table exists - try to select 0 rows from it
    const { error } = await supabaseClient.from(tableName).select("*", { count: "exact", head: true }).limit(0)

    return {
      success: !error,
      exists: !error,
      message: error ? `Table ${tableName} does not exist` : `Table ${tableName} exists`,
      error: error || null,
    }
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error)
    return {
      success: false,
      exists: false,
      message: `Failed to check if table ${tableName} exists`,
      error,
    }
  }
}

// Function to create helper functions in the database
export async function setupHelperFunctions() {
  try {
    // Create the get_service_status function
    const { error: statusError } = await supabaseClient.rpc("execute_sql", {
      sql: `
          CREATE OR REPLACE FUNCTION get_service_status()
          RETURNS jsonb
          LANGUAGE sql
          SECURITY DEFINER
          AS $$
            SELECT jsonb_build_object(
              'timestamp', now(),
              'database', current_database(),
              'version', version(),
              'status', 'online'
            );
          $$;
        `,
    })

    if (statusError) {
      console.error("Error creating get_service_status function:", statusError)
    }

    // Create the execute_sql function if it doesn't exist
    const { error: sqlError } = await supabaseClient.rpc("execute_sql", {
      sql: `
          CREATE OR REPLACE FUNCTION execute_sql(sql text)
          RETURNS jsonb
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          DECLARE
            result jsonb;
          BEGIN
            EXECUTE sql INTO result;
            RETURN result;
          EXCEPTION WHEN OTHERS THEN
            RETURN jsonb_build_object(
              'error', SQLERRM,
              'detail', SQLSTATE
            );
          END;
          $$;
        `,
    })

    if (sqlError) {
      console.error("Error creating execute_sql function:", sqlError)
      return {
        success: false,
        message: "Failed to create helper functions",
        error: sqlError,
      }
    }

    return {
      success: true,
      message: "Helper functions created successfully",
    }
  } catch (error) {
    console.error("Error setting up helper functions:", error)
    return {
      success: false,
      message: "Failed to set up helper functions",
      error,
    }
  }
}
