import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

// Use environment variables for the connection string
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error("DATABASE_URL environment variable is not set")
}

// Create a postgres client with keep-alive disabled
const client = postgres(connectionString || "", {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false,
})

// Create a drizzle client with the schema
export const db = drizzle(client, { schema })

// Re-export from supabase-db.ts
export * from "./supabase-db"
