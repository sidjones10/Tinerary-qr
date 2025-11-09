-- ============================================
-- COMPLETE FIX FOR TINERARY DATABASE
-- ============================================
-- Run this entire file in your Supabase SQL Editor to fix all issues
-- This adds missing RLS policies and fixes the drafts table schema

-- ============================================
-- PART 1: FIX DRAFTS TABLE SCHEMA
-- ============================================

-- Drop the old drafts table if it exists with the wrong schema
DROP TABLE IF EXISTS drafts CASCADE;

-- Recreate drafts table with proper schema
CREATE TABLE drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  description TEXT,
  location TEXT,
  start_date DATE,
  end_date DATE,
  type TEXT DEFAULT 'event',
  is_public BOOLEAN DEFAULT true,
  activities JSONB DEFAULT '[]',
  packing_items JSONB DEFAULT '[]',
  expenses JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;

-- Create index for performance
CREATE INDEX idx_drafts_user_id ON drafts(user_id);

-- ============================================
-- PART 2: ADD MISSING RLS POLICIES
-- ============================================

-- PROFILES POLICIES (CRITICAL)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- DRAFTS POLICIES
DROP POLICY IF EXISTS "Users can view own drafts" ON drafts;
CREATE POLICY "Users can view own drafts" ON drafts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own drafts" ON drafts;
CREATE POLICY "Users can create own drafts" ON drafts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own drafts" ON drafts;
CREATE POLICY "Users can update own drafts" ON drafts
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own drafts" ON drafts;
CREATE POLICY "Users can delete own drafts" ON drafts
  FOR DELETE USING (auth.uid() = user_id);

-- ACTIVITIES POLICIES
DROP POLICY IF EXISTS "Users can view activities" ON activities;
CREATE POLICY "Users can view activities" ON activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = activities.itinerary_id
      AND (itineraries.is_public = true OR itineraries.user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create activities" ON activities;
CREATE POLICY "Users can create activities" ON activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update activities" ON activities;
CREATE POLICY "Users can update activities" ON activities
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete activities" ON activities;
CREATE POLICY "Users can delete activities" ON activities
  FOR DELETE USING (auth.uid() = user_id);

-- PACKING ITEMS POLICIES
DROP POLICY IF EXISTS "Users can view packing items" ON packing_items;
CREATE POLICY "Users can view packing items" ON packing_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = packing_items.itinerary_id
      AND (itineraries.is_public = true OR itineraries.user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create packing items" ON packing_items;
CREATE POLICY "Users can create packing items" ON packing_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update packing items" ON packing_items;
CREATE POLICY "Users can update packing items" ON packing_items
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete packing items" ON packing_items;
CREATE POLICY "Users can delete packing items" ON packing_items
  FOR DELETE USING (auth.uid() = user_id);

-- EXPENSES POLICIES
DROP POLICY IF EXISTS "Users can view expenses" ON expenses;
CREATE POLICY "Users can view expenses" ON expenses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = expenses.itinerary_id
      AND (itineraries.is_public = true OR itineraries.user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create expenses" ON expenses;
CREATE POLICY "Users can create expenses" ON expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update expenses" ON expenses;
CREATE POLICY "Users can update expenses" ON expenses
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete expenses" ON expenses;
CREATE POLICY "Users can delete expenses" ON expenses
  FOR DELETE USING (auth.uid() = user_id);

-- SAVED ITINERARIES POLICIES
DROP POLICY IF EXISTS "Users can view own saved itineraries" ON saved_itineraries;
CREATE POLICY "Users can view own saved itineraries" ON saved_itineraries
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can save itineraries" ON saved_itineraries;
CREATE POLICY "Users can save itineraries" ON saved_itineraries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unsave itineraries" ON saved_itineraries;
CREATE POLICY "Users can unsave itineraries" ON saved_itineraries
  FOR DELETE USING (auth.uid() = user_id);

-- USER INTERACTIONS POLICIES
DROP POLICY IF EXISTS "Users can view own interactions" ON user_interactions;
CREATE POLICY "Users can view own interactions" ON user_interactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create interactions" ON user_interactions;
CREATE POLICY "Users can create interactions" ON user_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- USER PREFERENCES POLICIES
DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own preferences" ON user_preferences;
CREATE POLICY "Users can create own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- INVITATIONS POLICIES
DROP POLICY IF EXISTS "Users can view invitations" ON itinerary_invitations;
CREATE POLICY "Users can view invitations" ON itinerary_invitations
  FOR SELECT USING (auth.uid() = invitee_id OR auth.uid() = inviter_id);

DROP POLICY IF EXISTS "Users can create invitations" ON itinerary_invitations;
CREATE POLICY "Users can create invitations" ON itinerary_invitations
  FOR INSERT WITH CHECK (auth.uid() = inviter_id);

DROP POLICY IF EXISTS "Users can update invitations" ON itinerary_invitations;
CREATE POLICY "Users can update invitations" ON itinerary_invitations
  FOR UPDATE USING (auth.uid() = invitee_id OR auth.uid() = inviter_id);

-- PENDING INVITATIONS POLICIES
DROP POLICY IF EXISTS "Users can view pending invitations they sent" ON pending_invitations;
CREATE POLICY "Users can view pending invitations they sent" ON pending_invitations
  FOR SELECT USING (auth.uid() = inviter_id);

DROP POLICY IF EXISTS "Users can create pending invitations" ON pending_invitations;
CREATE POLICY "Users can create pending invitations" ON pending_invitations
  FOR INSERT WITH CHECK (auth.uid() = inviter_id);

-- CATEGORIES POLICIES
DROP POLICY IF EXISTS "Anyone can view categories" ON itinerary_categories;
CREATE POLICY "Anyone can view categories" ON itinerary_categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create categories for own itineraries" ON itinerary_categories;
CREATE POLICY "Users can create categories for own itineraries" ON itinerary_categories
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = itinerary_categories.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
  );

-- ITINERARY METRICS POLICIES
DROP POLICY IF EXISTS "Anyone can view metrics" ON itinerary_metrics;
CREATE POLICY "Anyone can view metrics" ON itinerary_metrics
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "System can insert metrics" ON itinerary_metrics;
CREATE POLICY "System can insert metrics" ON itinerary_metrics
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "System can update metrics" ON itinerary_metrics;
CREATE POLICY "System can update metrics" ON itinerary_metrics
  FOR UPDATE USING (true);

-- NOTIFICATIONS POLICIES
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- PART 3: ADD DAY COLUMN TO ACTIVITIES
-- ============================================

-- Add day column to activities table for organizing multi-day trips
ALTER TABLE activities ADD COLUMN IF NOT EXISTS day TEXT;

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_activities_day ON activities(day);

-- ============================================
-- DONE! Your database is now fully configured.
-- ============================================
