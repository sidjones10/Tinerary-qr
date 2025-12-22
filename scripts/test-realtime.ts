/**
 * Test script to verify Supabase Realtime is working
 * Run this to check if your Realtime setup is correct
 *
 * Usage: node --loader ts-node/esm scripts/test-realtime.ts
 */

import { createClient } from '@supabase/supabase-js'

// Replace with your Supabase credentials
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testRealtimeConnection() {
  console.log('🔍 Testing Supabase Realtime Connection...\n')

  // Test 1: Check if we can create a channel
  console.log('1️⃣ Creating Realtime channel...')
  const channel = supabase.channel('test-channel')

  // Test 2: Subscribe to notifications table
  console.log('2️⃣ Subscribing to notifications table...')

  channel
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
      },
      (payload) => {
        console.log('✅ Received notification update:', payload)
      }
    )
    .subscribe((status) => {
      console.log('📡 Subscription status:', status)

      if (status === 'SUBSCRIBED') {
        console.log('\n✅ SUCCESS! Realtime is working!')
        console.log('Try creating a notification in your app to see real-time updates here.\n')
      } else if (status === 'CHANNEL_ERROR') {
        console.error('\n❌ ERROR! Realtime subscription failed.')
        console.error('Make sure you have enabled Realtime for the notifications table.\n')
      } else if (status === 'TIMED_OUT') {
        console.error('\n⏱️ TIMEOUT! Connection timed out.')
        console.error('Check your Supabase URL and API key.\n')
      }
    })

  // Keep the script running to listen for changes
  console.log('\n👂 Listening for changes... (Press Ctrl+C to exit)')
}

testRealtimeConnection()
