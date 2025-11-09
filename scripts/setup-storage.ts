/**
 * Script to set up Supabase Storage buckets for Tinerary
 * Run with: npx tsx scripts/setup-storage.ts
 */

import { createClient } from "@supabase/supabase-js"

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing environment variables!")
  console.error("Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function setupStorageBuckets() {
  console.log("🚀 Setting up Supabase Storage buckets for Tinerary...\n")

  // Define bucket configurations
  const buckets = [
    {
      name: "itinerary-images",
      public: true,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
      fileSizeLimit: 5242880, // 5MB
    },
    {
      name: "user-avatars",
      public: true,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
      fileSizeLimit: 2097152, // 2MB
    },
  ]

  // Check existing buckets
  console.log("📋 Checking existing buckets...")
  const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets()

  if (listError) {
    console.error("❌ Error listing buckets:", listError.message)
    return
  }

  const existingBucketNames = existingBuckets?.map((b) => b.name) || []
  console.log(`Found ${existingBuckets?.length || 0} existing buckets\n`)

  // Create buckets
  for (const bucket of buckets) {
    console.log(`📦 Bucket: ${bucket.name}`)

    if (existingBucketNames.includes(bucket.name)) {
      console.log(`   ✓ Already exists, skipping creation`)
    } else {
      console.log(`   Creating...`)

      const { error: createError } = await supabase.storage.createBucket(bucket.name, {
        public: bucket.public,
        fileSizeLimit: bucket.fileSizeLimit,
        allowedMimeTypes: bucket.allowedMimeTypes,
      })

      if (createError) {
        console.log(`   ❌ Error: ${createError.message}`)
      } else {
        console.log(`   ✓ Created successfully`)
      }
    }

    // Set up storage policies
    console.log(`   Setting up policies...`)
    await setupPolicies(bucket.name)
    console.log(`   ✓ Policies configured\n`)
  }

  console.log("✅ Storage setup complete!")
  console.log("\n📝 Next steps:")
  console.log("   1. Verify buckets in Supabase Dashboard > Storage")
  console.log("   2. Update your code to use uploadImage() from lib/storage-service.ts")
  console.log("   3. Test uploading images in the Create page\n")
}

async function setupPolicies(bucketName: string) {
  const policies = []

  if (bucketName === "itinerary-images") {
    policies.push(
      // Allow authenticated users to upload
      {
        name: "Authenticated users can upload images",
        definition: `(bucket_id = '${bucketName}')`,
        check: `(bucket_id = '${bucketName}')`,
        command: "INSERT",
        roles: ["authenticated"],
      },
      // Allow public to view
      {
        name: "Public can view images",
        definition: `(bucket_id = '${bucketName}')`,
        command: "SELECT",
        roles: ["public", "authenticated"],
      },
      // Allow users to update their own
      {
        name: "Users can update their images",
        definition: `(bucket_id = '${bucketName}' AND auth.uid()::text = (storage.foldername(name))[1])`,
        command: "UPDATE",
        roles: ["authenticated"],
      },
      // Allow users to delete their own
      {
        name: "Users can delete their images",
        definition: `(bucket_id = '${bucketName}' AND auth.uid()::text = (storage.foldername(name))[1])`,
        command: "DELETE",
        roles: ["authenticated"],
      },
    )
  } else if (bucketName === "user-avatars") {
    policies.push(
      // Allow users to upload their avatar
      {
        name: "Users can upload avatars",
        definition: `(bucket_id = '${bucketName}' AND auth.uid()::text = (storage.foldername(name))[1])`,
        check: `(bucket_id = '${bucketName}' AND auth.uid()::text = (storage.foldername(name))[1])`,
        command: "INSERT",
        roles: ["authenticated"],
      },
      // Allow public to view avatars
      {
        name: "Public can view avatars",
        definition: `(bucket_id = '${bucketName}')`,
        command: "SELECT",
        roles: ["public", "authenticated"],
      },
      // Allow users to update their avatar
      {
        name: "Users can update their avatar",
        definition: `(bucket_id = '${bucketName}' AND auth.uid()::text = (storage.foldername(name))[1])`,
        command: "UPDATE",
        roles: ["authenticated"],
      },
      // Allow users to delete their avatar
      {
        name: "Users can delete their avatar",
        definition: `(bucket_id = '${bucketName}' AND auth.uid()::text = (storage.foldername(name))[1])`,
        command: "DELETE",
        roles: ["authenticated"],
      },
    )
  }

  // Note: Policy creation via SDK is limited in some Supabase versions
  // Users may need to create these policies manually in the dashboard
  console.log(`   📋 Policy definitions ready (may need manual setup in Dashboard)`)

  // Return policy SQL for reference
  return policies
}

// Run the setup
setupStorageBuckets().catch((error) => {
  console.error("❌ Setup failed:", error)
  process.exit(1)
})
