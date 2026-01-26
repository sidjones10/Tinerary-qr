-- Fix Publishing Issues - Ensure All Required Tables Exist
-- Run this in Supabase SQL Editor to fix publishing errors

-- 1. Ensure itineraries table exists with correct structure
CREATE TABLE IF NOT EXISTS public.itineraries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_date DATE,
  end_date DATE,
  cover_image_url TEXT,
  is_public BOOLEAN DEFAULT true,
  is_template BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Ensure activities table exists
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  itinerary_id UUID REFERENCES public.itineraries(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_time TIMESTAMP WITH TIME ZONE,
  day TEXT,
  require_rsvp BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Ensure packing_items table exists
CREATE TABLE IF NOT EXISTS public.packing_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  itinerary_id UUID REFERENCES public.itineraries(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_packed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Ensure expenses table exists
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  itinerary_id UUID REFERENCES public.itineraries(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Ensure itinerary_categories table exists
CREATE TABLE IF NOT EXISTS public.itinerary_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  itinerary_id UUID REFERENCES public.itineraries(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(itinerary_id, category)
);

-- 6. Ensure itinerary_metrics table exists
CREATE TABLE IF NOT EXISTS public.itinerary_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  itinerary_id UUID REFERENCES public.itineraries(id) ON DELETE CASCADE NOT NULL,
  view_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  trending_score DECIMAL(10,6) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(itinerary_id)
);

-- 7. Ensure notifications table exists
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  link_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_itineraries_user_id ON public.itineraries(user_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_is_public ON public.itineraries(is_public);
CREATE INDEX IF NOT EXISTS idx_itineraries_created_at ON public.itineraries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_itinerary_id ON public.activities(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_packing_items_itinerary_id ON public.packing_items(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_expenses_itinerary_id ON public.expenses(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- 9. Enable Row Level Security on all tables
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 10. Drop existing policies to avoid conflicts (if they exist)
DROP POLICY IF EXISTS "Users can view their own itineraries" ON public.itineraries;
DROP POLICY IF EXISTS "Users can view public itineraries" ON public.itineraries;
DROP POLICY IF EXISTS "Users can insert their own itineraries" ON public.itineraries;
DROP POLICY IF EXISTS "Users can update their own itineraries" ON public.itineraries;
DROP POLICY IF EXISTS "Users can delete their own itineraries" ON public.itineraries;

-- 11. Create RLS policies for itineraries
CREATE POLICY "Users can view their own itineraries"
  ON public.itineraries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public itineraries"
  ON public.itineraries FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can insert their own itineraries"
  ON public.itineraries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own itineraries"
  ON public.itineraries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own itineraries"
  ON public.itineraries FOR DELETE
  USING (auth.uid() = user_id);

-- 12. RLS policies for activities
DROP POLICY IF EXISTS "Anyone can view activities" ON public.activities;
DROP POLICY IF EXISTS "Users can insert activities for their itineraries" ON public.activities;
DROP POLICY IF EXISTS "Users can update activities for their itineraries" ON public.activities;
DROP POLICY IF EXISTS "Users can delete activities for their itineraries" ON public.activities;

CREATE POLICY "Anyone can view activities"
  ON public.activities FOR SELECT
  USING (true);

CREATE POLICY "Users can insert activities for their itineraries"
  ON public.activities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.itineraries i
      WHERE i.id = itinerary_id AND i.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update activities for their itineraries"
  ON public.activities FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries i
      WHERE i.id = itinerary_id AND i.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete activities for their itineraries"
  ON public.activities FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries i
      WHERE i.id = itinerary_id AND i.user_id = auth.uid()
    )
  );

-- 13. RLS policies for packing_items (same pattern)
DROP POLICY IF EXISTS "Anyone can view packing items" ON public.packing_items;
DROP POLICY IF EXISTS "Users can insert packing items" ON public.packing_items;
DROP POLICY IF EXISTS "Users can update packing items" ON public.packing_items;
DROP POLICY IF EXISTS "Users can delete packing items" ON public.packing_items;

CREATE POLICY "Anyone can view packing items"
  ON public.packing_items FOR SELECT
  USING (true);

CREATE POLICY "Users can insert packing items"
  ON public.packing_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.itineraries i
      WHERE i.id = itinerary_id AND i.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update packing items"
  ON public.packing_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries i
      WHERE i.id = itinerary_id AND i.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete packing items"
  ON public.packing_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries i
      WHERE i.id = itinerary_id AND i.user_id = auth.uid()
    )
  );

-- 14. RLS policies for expenses
DROP POLICY IF EXISTS "Anyone can view expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can insert expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete expenses" ON public.expenses;

CREATE POLICY "Anyone can view expenses"
  ON public.expenses FOR SELECT
  USING (true);

CREATE POLICY "Users can insert expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.itineraries i
      WHERE i.id = itinerary_id AND i.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update expenses"
  ON public.expenses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries i
      WHERE i.id = itinerary_id AND i.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete expenses"
  ON public.expenses FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries i
      WHERE i.id = itinerary_id AND i.user_id = auth.uid()
    )
  );

-- 15. RLS policies for itinerary_categories
DROP POLICY IF EXISTS "Anyone can view itinerary categories" ON public.itinerary_categories;
DROP POLICY IF EXISTS "Owners can insert itinerary categories" ON public.itinerary_categories;
DROP POLICY IF EXISTS "Owners can update itinerary categories" ON public.itinerary_categories;

CREATE POLICY "Anyone can view itinerary categories"
  ON public.itinerary_categories FOR SELECT
  USING (true);

CREATE POLICY "Owners can insert itinerary categories"
  ON public.itinerary_categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.itineraries i
      WHERE i.id = itinerary_id AND i.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update itinerary categories"
  ON public.itinerary_categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries i
      WHERE i.id = itinerary_id AND i.user_id = auth.uid()
    )
  );

-- 16. RLS policies for itinerary_metrics
DROP POLICY IF EXISTS "Anyone can view itinerary metrics" ON public.itinerary_metrics;
DROP POLICY IF EXISTS "Service role can insert metrics" ON public.itinerary_metrics;
DROP POLICY IF EXISTS "Service role can update metrics" ON public.itinerary_metrics;

CREATE POLICY "Anyone can view itinerary metrics"
  ON public.itinerary_metrics FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert metrics"
  ON public.itinerary_metrics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update metrics"
  ON public.itinerary_metrics FOR UPDATE
  USING (true);

-- 17. RLS policies for notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- 18. Drop trigger if exists (to avoid duplicate metrics creation)
DROP TRIGGER IF EXISTS on_itinerary_created ON public.itineraries;

-- 19. Verify tables exist
SELECT
  'itineraries' as table_name,
  EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'itineraries') as exists
UNION ALL
SELECT 'activities', EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'activities')
UNION ALL
SELECT 'packing_items', EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'packing_items')
UNION ALL
SELECT 'expenses', EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expenses')
UNION ALL
SELECT 'itinerary_categories', EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'itinerary_categories')
UNION ALL
SELECT 'itinerary_metrics', EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'itinerary_metrics')
UNION ALL
SELECT 'notifications', EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications');
