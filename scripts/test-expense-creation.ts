/**
 * Test script to debug expense creation during itinerary create vs direct addition
 * Run this with: npx tsx scripts/test-expense-creation.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testExpenseCreation() {
  console.log('\n🧪 Testing Expense Creation Flow\n')
  console.log('=' .repeat(60))

  // Test 1: Check if itinerary_attendees table exists
  console.log('\n1️⃣  Checking if itinerary_attendees table exists...')
  const { data: attendeesTable, error: attendeesTableError } = await supabase
    .from('itinerary_attendees')
    .select('id')
    .limit(1)

  if (attendeesTableError) {
    console.error('❌ itinerary_attendees table issue:', attendeesTableError.message)
    console.error('   → You may need to run migration 021_create_itinerary_attendees.sql')
    return
  }
  console.log('✅ itinerary_attendees table exists')

  // Test 2: Check recent itineraries and their attendees
  console.log('\n2️⃣  Checking recent itineraries and attendees...')
  const { data: recentItineraries, error: itinerariesError } = await supabase
    .from('itineraries')
    .select(`
      id,
      title,
      user_id,
      created_at,
      itinerary_attendees (
        id,
        user_id,
        role
      )
    `)
    .order('created_at', { ascending: false })
    .limit(5)

  if (itinerariesError) {
    console.error('❌ Error fetching itineraries:', itinerariesError.message)
    return
  }

  console.log(`   Found ${recentItineraries.length} recent itineraries:`)
  recentItineraries.forEach((itin: any) => {
    const attendeeCount = itin.itinerary_attendees?.length || 0
    const hasOwner = itin.itinerary_attendees?.some((a: any) => a.role === 'owner')
    console.log(`   - "${itin.title}" (${itin.id.substring(0, 8)}...)`)
    console.log(`     Owner: ${itin.user_id.substring(0, 8)}...`)
    console.log(`     Attendees: ${attendeeCount} ${hasOwner ? '✅' : '❌ NO OWNER!'}`)
  })

  // Test 3: Check expenses and their splits
  console.log('\n3️⃣  Checking expenses and splits for recent itineraries...')
  const { data: recentExpenses, error: expensesError } = await supabase
    .from('expenses')
    .select(`
      id,
      itinerary_id,
      title,
      category,
      amount,
      split_type,
      created_at,
      expense_splits (
        id,
        user_id,
        amount,
        is_paid
      )
    `)
    .order('created_at', { ascending: false })
    .limit(10)

  if (expensesError) {
    console.error('❌ Error fetching expenses:', expensesError.message)
    return
  }

  console.log(`   Found ${recentExpenses.length} recent expenses:`)
  recentExpenses.forEach((exp: any) => {
    const splitCount = exp.expense_splits?.length || 0
    const totalSplit = exp.expense_splits?.reduce((sum: number, s: any) => sum + parseFloat(s.amount), 0) || 0
    console.log(`   - ${exp.title} ($${exp.amount})`)
    console.log(`     ID: ${exp.id.substring(0, 8)}...`)
    console.log(`     Itinerary: ${exp.itinerary_id.substring(0, 8)}...`)
    console.log(`     Splits: ${splitCount} (total: $${totalSplit.toFixed(2)}) ${splitCount > 0 ? '✅' : '❌'}`)
    if (splitCount === 0) {
      console.log(`     ⚠️  NO SPLITS - This expense won't show in UI!`)
    }
  })

  // Test 4: Find expenses without splits (the problem!)
  console.log('\n4️⃣  Finding expenses WITHOUT splits...')
  const { data: expensesWithoutSplits, error: noSplitsError } = await supabase
    .from('expenses')
    .select(`
      id,
      title,
      amount,
      itinerary_id,
      created_at,
      expense_splits!left (
        id
      )
    `)
    .is('expense_splits.id', null)
    .order('created_at', { ascending: false })
    .limit(10)

  if (noSplitsError) {
    console.error('❌ Error finding expenses without splits:', noSplitsError.message)
  } else {
    if (expensesWithoutSplits && expensesWithoutSplits.length > 0) {
      console.log(`   ❌ Found ${expensesWithoutSplits.length} expenses without splits:`)
      expensesWithoutSplits.forEach((exp: any) => {
        console.log(`   - ${exp.title} ($${exp.amount})`)
        console.log(`     Created: ${new Date(exp.created_at).toLocaleString()}`)
        console.log(`     Itinerary: ${exp.itinerary_id.substring(0, 8)}...`)
      })
      console.log('\n   💡 These expenses were created but the trigger failed to create splits!')
    } else {
      console.log('   ✅ All expenses have splits')
    }
  }

  // Test 5: Check if triggers exist
  console.log('\n5️⃣  Checking database triggers...')
  const { data: triggers, error: triggersError } = await supabase
    .rpc('pg_trigger_check', {})
    .catch(() => {
      // Fallback - try to check via information_schema
      return { data: null, error: { message: 'Custom check needed' } }
    })

  console.log('   ℹ️  Manual trigger check required - run this SQL in Supabase:')
  console.log(`
  SELECT
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
  FROM information_schema.triggers
  WHERE trigger_name IN (
    'add_owner_as_attendee_trigger',
    'create_equal_splits_trigger'
  );
  `)

  console.log('\n' + '='.repeat(60))
  console.log('🏁 Test Complete\n')
}

// Run the test
testExpenseCreation().catch(console.error)
