-- Sample Data for Tinerary (Works without existing users)
-- Creates demo profiles and sample itineraries

-- First, temporarily disable RLS to insert demo data
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE itineraries DISABLE ROW LEVEL SECURITY;

-- Temporarily drop the foreign key constraint on profiles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Create demo profile (not tied to auth.users)
INSERT INTO profiles (
  id,
  email,
  username,
  name,
  bio,
  location,
  avatar_url,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'demo@tinerary.com',
  'traveler',
  'Demo Traveler',
  'Sharing amazing travel itineraries around the world! 🌍',
  'San Francisco, CA',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create sample itineraries
INSERT INTO itineraries (id, user_id, title, description, location, start_date, end_date, image_url, is_public, created_at, updated_at)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000001',
    'Weekend in NYC',
    'Experience the best of New York City in 3 days! From iconic landmarks to hidden gems, this itinerary covers the must-see attractions and local favorites.',
    'New York, NY',
    CURRENT_DATE + INTERVAL '30 days',
    CURRENT_DATE + INTERVAL '33 days',
    'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800',
    true,
    NOW(),
    NOW()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000001',
    'LA Summer Adventure',
    'Explore the best beaches, attractions, and food scene in Los Angeles. Perfect mix of relaxation and excitement!',
    'Los Angeles, CA',
    CURRENT_DATE + INTERVAL '45 days',
    CURRENT_DATE + INTERVAL '50 days',
    'https://images.unsplash.com/photo-1534190239940-9ba8944ea261?w=800',
    true,
    NOW(),
    NOW()
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000001',
    'Paris Romance Week',
    'A romantic week in the City of Light. Visit iconic landmarks, enjoy world-class cuisine, and experience Parisian culture.',
    'Paris, France',
    CURRENT_DATE + INTERVAL '60 days',
    CURRENT_DATE + INTERVAL '67 days',
    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
    true,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Create activities for NYC itinerary
INSERT INTO activities (itinerary_id, user_id, title, description, location, start_time, end_time, order_index)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000001',
    'Visit Statue of Liberty',
    'Take the ferry to Liberty Island and explore this iconic monument',
    'Liberty Island, NY',
    CURRENT_DATE + INTERVAL '30 days' + TIME '09:00:00',
    CURRENT_DATE + INTERVAL '30 days' + TIME '13:00:00',
    1
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000001',
    'Walk through Central Park',
    'Stroll through the famous Central Park, visit Bethesda Fountain and Bow Bridge',
    'Central Park, Manhattan',
    CURRENT_DATE + INTERVAL '30 days' + TIME '14:00:00',
    CURRENT_DATE + INTERVAL '30 days' + TIME '17:00:00',
    2
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000001',
    'Times Square at Night',
    'Experience the bright lights and energy of Times Square',
    'Times Square, Manhattan',
    CURRENT_DATE + INTERVAL '30 days' + TIME '19:00:00',
    CURRENT_DATE + INTERVAL '30 days' + TIME '21:00:00',
    3
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000001',
    'Brooklyn Bridge Walk',
    'Walk across the iconic Brooklyn Bridge with stunning city views',
    'Brooklyn Bridge, NY',
    CURRENT_DATE + INTERVAL '31 days' + TIME '10:00:00',
    CURRENT_DATE + INTERVAL '31 days' + TIME '12:00:00',
    4
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000001',
    'Visit MoMA',
    'Explore modern art at the Museum of Modern Art',
    'Museum of Modern Art, Manhattan',
    CURRENT_DATE + INTERVAL '31 days' + TIME '14:00:00',
    CURRENT_DATE + INTERVAL '31 days' + TIME '17:00:00',
    5
  );

-- Create activities for LA itinerary
INSERT INTO activities (itinerary_id, user_id, title, description, location, start_time, end_time, order_index)
VALUES
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000001',
    'Santa Monica Beach & Pier',
    'Relax at the beach and explore the famous Santa Monica Pier',
    'Santa Monica, CA',
    CURRENT_DATE + INTERVAL '45 days' + TIME '10:00:00',
    CURRENT_DATE + INTERVAL '45 days' + TIME '16:00:00',
    1
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000001',
    'Hollywood Walk of Fame',
    'See the stars on the famous Hollywood Walk of Fame',
    'Hollywood Blvd, Los Angeles',
    CURRENT_DATE + INTERVAL '46 days' + TIME '09:00:00',
    CURRENT_DATE + INTERVAL '46 days' + TIME '11:00:00',
    2
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000001',
    'Griffith Observatory',
    'Visit Griffith Observatory for panoramic views of LA and Hollywood sign',
    'Griffith Park, Los Angeles',
    CURRENT_DATE + INTERVAL '46 days' + TIME '14:00:00',
    CURRENT_DATE + INTERVAL '46 days' + TIME '17:00:00',
    3
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000001',
    'Venice Beach & Canals',
    'Explore the bohemian Venice Beach boardwalk and scenic canals',
    'Venice Beach, CA',
    CURRENT_DATE + INTERVAL '47 days' + TIME '11:00:00',
    CURRENT_DATE + INTERVAL '47 days' + TIME '15:00:00',
    4
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000001',
    'Getty Center',
    'Visit the Getty Center for world-class art and architecture',
    'Getty Center, Los Angeles',
    CURRENT_DATE + INTERVAL '48 days' + TIME '10:00:00',
    CURRENT_DATE + INTERVAL '48 days' + TIME '14:00:00',
    5
  );

-- Create activities for Paris itinerary
INSERT INTO activities (itinerary_id, user_id, title, description, location, start_time, end_time, order_index)
VALUES
  (
    '33333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000001',
    'Eiffel Tower Visit',
    'Visit the iconic Eiffel Tower and enjoy views from the top',
    'Champ de Mars, Paris',
    CURRENT_DATE + INTERVAL '60 days' + TIME '09:00:00',
    CURRENT_DATE + INTERVAL '60 days' + TIME '12:00:00',
    1
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000001',
    'Louvre Museum',
    'Explore the world''s largest art museum and see the Mona Lisa',
    'Musée du Louvre, Paris',
    CURRENT_DATE + INTERVAL '61 days' + TIME '10:00:00',
    CURRENT_DATE + INTERVAL '61 days' + TIME '15:00:00',
    2
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000001',
    'Seine River Cruise',
    'Romantic evening cruise on the Seine River',
    'Port de la Bourdonnais, Paris',
    CURRENT_DATE + INTERVAL '61 days' + TIME '19:00:00',
    CURRENT_DATE + INTERVAL '61 days' + TIME '21:00:00',
    3
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000001',
    'Montmartre & Sacré-Cœur',
    'Visit the artistic Montmartre district and the Sacré-Cœur Basilica',
    'Montmartre, Paris',
    CURRENT_DATE + INTERVAL '62 days' + TIME '10:00:00',
    CURRENT_DATE + INTERVAL '62 days' + TIME '14:00:00',
    4
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000001',
    'Champs-Élysées & Arc de Triomphe',
    'Walk down the famous avenue and visit the Arc de Triomphe',
    'Avenue des Champs-Élysées, Paris',
    CURRENT_DATE + INTERVAL '63 days' + TIME '14:00:00',
    CURRENT_DATE + INTERVAL '63 days' + TIME '17:00:00',
    5
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000001',
    'Versailles Palace Day Trip',
    'Full day trip to the magnificent Palace of Versailles',
    'Versailles, France',
    CURRENT_DATE + INTERVAL '64 days' + TIME '09:00:00',
    CURRENT_DATE + INTERVAL '64 days' + TIME '18:00:00',
    6
  );

-- Create sample packing items
INSERT INTO packing_items (itinerary_id, user_id, name, is_packed)
VALUES
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Comfortable walking shoes', false),
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Light jacket', false),
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Camera', false),
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Power bank', false),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 'Swimsuit', false),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 'Sunscreen SPF 50', false),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 'Sunglasses', false),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', 'Passport', false),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', 'Travel adapter (EU plug)', false),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', 'French phrasebook', false);

-- Create sample expenses
INSERT INTO expenses (itinerary_id, user_id, category, amount, description)
VALUES
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Accommodation', 450.00, 'Hotel near Times Square (3 nights)'),
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Transportation', 75.00, 'Ferry tickets & subway passes'),
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Food', 200.00, 'Restaurants and cafes'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 'Accommodation', 650.00, 'Beachfront hotel (5 nights)'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 'Transportation', 300.00, 'Rental car'),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', 'Accommodation', 850.00, 'Boutique hotel in Marais (7 nights)'),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', 'Food', 600.00, 'French cuisine experiences');

-- Create categories for itineraries
INSERT INTO itinerary_categories (itinerary_id, category)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'City Break'),
  ('11111111-1111-1111-1111-111111111111', 'Culture'),
  ('11111111-1111-1111-1111-111111111111', 'Sightseeing'),
  ('22222222-2222-2222-2222-222222222222', 'Beach'),
  ('22222222-2222-2222-2222-222222222222', 'Adventure'),
  ('22222222-2222-2222-2222-222222222222', 'Relaxation'),
  ('33333333-3333-3333-3333-333333333333', 'Romance'),
  ('33333333-3333-3333-3333-333333333333', 'Culture'),
  ('33333333-3333-3333-3333-333333333333', 'Historic');

-- Create metrics for each itinerary
INSERT INTO itinerary_metrics (itinerary_id, view_count, save_count, share_count, like_count, comment_count)
VALUES
  ('11111111-1111-1111-1111-111111111111', 245, 32, 15, 58, 12),
  ('22222222-2222-2222-2222-222222222222', 198, 28, 10, 45, 8),
  ('33333333-3333-3333-3333-333333333333', 312, 48, 22, 89, 18)
ON CONFLICT (itinerary_id) DO NOTHING;

-- Recreate the foreign key constraint (optional - only if you want to maintain referential integrity)
-- Comment this out if you want to keep the demo profile without a corresponding auth user
-- ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Sample data created successfully!';
  RAISE NOTICE '   🗽 NYC Weekend Trip';
  RAISE NOTICE '   🌴 LA Summer Adventure';
  RAISE NOTICE '   🗼 Paris Romance Week';
  RAISE NOTICE '';
  RAISE NOTICE '💡 These trips will show in Discovery feed!';
  RAISE NOTICE '   Go to Dashboard → Discover tab';
END $$;
