-- Migration: Add performance indexes for commonly queried columns
-- These indexes improve query performance for discovery feeds, user lookups, and social features

-- =====================================================
-- ITINERARIES TABLE INDEXES
-- =====================================================

-- Index for public itinerary discovery (used in feed queries)
CREATE INDEX IF NOT EXISTS idx_itineraries_is_public_created_at
ON itineraries(is_public, created_at DESC)
WHERE is_public = true;

-- Index for user's itineraries
CREATE INDEX IF NOT EXISTS idx_itineraries_user_id
ON itineraries(user_id);

-- Index for location-based searches
CREATE INDEX IF NOT EXISTS idx_itineraries_location
ON itineraries(location)
WHERE location IS NOT NULL;

-- Index for date-based queries (upcoming events)
CREATE INDEX IF NOT EXISTS idx_itineraries_start_date
ON itineraries(start_date)
WHERE start_date IS NOT NULL;

-- =====================================================
-- ITINERARY METRICS TABLE INDEXES
-- =====================================================

-- Index for trending/popular content sorting
CREATE INDEX IF NOT EXISTS idx_itinerary_metrics_like_count
ON itinerary_metrics(like_count DESC);

CREATE INDEX IF NOT EXISTS idx_itinerary_metrics_view_count
ON itinerary_metrics(view_count DESC);

-- Composite index for itinerary lookup with metrics
CREATE INDEX IF NOT EXISTS idx_itinerary_metrics_itinerary_id
ON itinerary_metrics(itinerary_id);

-- =====================================================
-- SAVED ITINERARIES TABLE INDEXES (Likes/Saves)
-- =====================================================

-- Index for user's liked items
CREATE INDEX IF NOT EXISTS idx_saved_itineraries_user_type
ON saved_itineraries(user_id, type);

-- Index for itinerary's likes/saves count
CREATE INDEX IF NOT EXISTS idx_saved_itineraries_itinerary_type
ON saved_itineraries(itinerary_id, type);

-- =====================================================
-- COMMENTS TABLE INDEXES
-- =====================================================

-- Index for fetching comments by itinerary
CREATE INDEX IF NOT EXISTS idx_comments_itinerary_id
ON comments(itinerary_id, created_at DESC);

-- Index for user's comments
CREATE INDEX IF NOT EXISTS idx_comments_user_id
ON comments(user_id);

-- Index for reply threads
CREATE INDEX IF NOT EXISTS idx_comments_parent_id
ON comments(parent_comment_id)
WHERE parent_comment_id IS NOT NULL;

-- =====================================================
-- USER FOLLOWS TABLE INDEXES
-- =====================================================

-- Index for getting followers
CREATE INDEX IF NOT EXISTS idx_user_follows_following_id
ON user_follows(following_id, created_at DESC);

-- Index for getting following list
CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id
ON user_follows(follower_id, created_at DESC);

-- =====================================================
-- NOTIFICATIONS TABLE INDEXES
-- =====================================================

-- Index for user's unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
ON notifications(user_id, is_read, created_at DESC)
WHERE is_read = false;

-- Index for all user notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id
ON notifications(user_id, created_at DESC);

-- =====================================================
-- PROFILES TABLE INDEXES
-- =====================================================

-- Index for username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username
ON profiles(username)
WHERE username IS NOT NULL;

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email
ON profiles(email)
WHERE email IS NOT NULL;

-- =====================================================
-- ACTIVITIES TABLE INDEXES
-- =====================================================

-- Index for activities by itinerary
CREATE INDEX IF NOT EXISTS idx_activities_itinerary_id
ON activities(itinerary_id, start_time);

-- =====================================================
-- ITINERARY CATEGORIES TABLE INDEXES
-- =====================================================

-- Index for category-based discovery
CREATE INDEX IF NOT EXISTS idx_itinerary_categories_category
ON itinerary_categories(category);

-- Index for itinerary's categories
CREATE INDEX IF NOT EXISTS idx_itinerary_categories_itinerary_id
ON itinerary_categories(itinerary_id);

-- =====================================================
-- CONSENT RECORDS TABLE INDEXES (if exists)
-- =====================================================

-- Index for user consent lookups
CREATE INDEX IF NOT EXISTS idx_consent_records_user_id
ON consent_records(user_id, consent_type);
