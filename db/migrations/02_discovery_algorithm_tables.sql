-- Discovery Algorithm Tables

-- User Preferences Table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_destinations TEXT[] DEFAULT '{}',
  preferred_activities TEXT[] DEFAULT '{}',
  preferred_categories TEXT[] DEFAULT '{}',
  travel_style TEXT DEFAULT 'balanced', -- 'adventure', 'relaxation', 'cultural', 'foodie', 'balanced'
  budget_preference TEXT DEFAULT 'medium', -- 'budget', 'medium', 'luxury'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Itinerary Metrics Table
CREATE TABLE IF NOT EXISTS public.itinerary_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  itinerary_id UUID REFERENCES public.itineraries(id) ON DELETE CASCADE,
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

-- User Behavior Table
CREATE TABLE IF NOT EXISTS public.user_behavior (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_itineraries UUID[] DEFAULT '{}',
  saved_itineraries UUID[] DEFAULT '{}',
  liked_itineraries UUID[] DEFAULT '{}',
  search_history TEXT[] DEFAULT '{}',
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Itinerary Categories Junction Table
CREATE TABLE IF NOT EXISTS public.itinerary_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  itinerary_id UUID REFERENCES public.itineraries(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(itinerary_id, category)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_metrics_itinerary_id ON public.itinerary_metrics(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_user_id ON public.user_behavior(user_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_categories_itinerary_id ON public.itinerary_categories(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_categories_category ON public.itinerary_categories(category);

-- Add RLS policies
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_behavior ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_categories ENABLE ROW LEVEL SECURITY;

-- User Preferences policies
CREATE POLICY "Users can view their own preferences" 
  ON public.user_preferences FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" 
  ON public.user_preferences FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" 
  ON public.user_preferences FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Itinerary Metrics policies
CREATE POLICY "Anyone can view itinerary metrics" 
  ON public.itinerary_metrics FOR SELECT 
  USING (true);

CREATE POLICY "Service role can update metrics" 
  ON public.itinerary_metrics FOR UPDATE 
  USING (true);

CREATE POLICY "Service role can insert metrics" 
  ON public.itinerary_metrics FOR INSERT 
  WITH CHECK (true);

-- User Behavior policies
CREATE POLICY "Users can view their own behavior" 
  ON public.user_behavior FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own behavior" 
  ON public.user_behavior FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own behavior" 
  ON public.user_behavior FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Itinerary Categories policies
CREATE POLICY "Anyone can view itinerary categories" 
  ON public.itinerary_categories FOR SELECT 
  USING (true);

CREATE POLICY "Owners can update itinerary categories" 
  ON public.itinerary_categories FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.itineraries i 
    WHERE i.id = itinerary_id AND i.user_id = auth.uid()
  ));

CREATE POLICY "Owners can insert itinerary categories" 
  ON public.itinerary_categories FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.itineraries i 
    WHERE i.id = itinerary_id AND i.user_id = auth.uid()
  ));

-- Create triggers to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_itinerary_metrics_updated_at
  BEFORE UPDATE ON public.itinerary_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_behavior_updated_at
  BEFORE UPDATE ON public.user_behavior
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a function to automatically create metrics when a new itinerary is created
CREATE OR REPLACE FUNCTION create_itinerary_metrics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.itinerary_metrics (itinerary_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_itinerary_created
  AFTER INSERT ON public.itineraries
  FOR EACH ROW EXECUTE FUNCTION create_itinerary_metrics();

-- Create a function to automatically create user preferences and behavior when a new user signs up
CREATE OR REPLACE FUNCTION create_user_records()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);
  
  INSERT INTO public.user_behavior (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_records();
