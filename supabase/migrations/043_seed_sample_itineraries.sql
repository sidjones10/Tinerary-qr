-- Sample Itineraries for Discover Page
-- Creates 3 sample itineraries: Austin Thrifting, CA Burger Tour, Long Island Day

-- 1. Thrifting Day in Austin (Event - single day)
-- 2. My Personal Burger Tour in California (Trip - multi-day)
-- 3. Boring Day in Long Island (Trip - multi-day)

-- ============================================================
-- ITINERARIES
-- ============================================================
INSERT INTO itineraries (id, user_id, title, description, location, start_date, end_date, image_url, is_public, created_at, updated_at)
VALUES
  (
    '44444444-4444-4444-4444-444444444444',
    (SELECT id FROM profiles LIMIT 1),
    'Thrifting Day in Austin',
    'A full day hitting the best thrift stores in Austin, TX. Vintage finds, funky clothes, and hidden treasures around South Congress and East Austin.',
    'Austin, TX',
    CURRENT_DATE + INTERVAL '20 days',
    CURRENT_DATE + INTERVAL '20 days',  -- Same day = Event
    'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800',
    true,
    NOW(),
    NOW()
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    (SELECT id FROM profiles LIMIT 1),
    'My Personal Burger Tour in California',
    'Three days of the best burgers California has to offer, ending with a beach day and one last burger. From In-N-Out to hidden gems, this is the ultimate burger road trip.',
    'California',
    CURRENT_DATE + INTERVAL '25 days',
    CURRENT_DATE + INTERVAL '28 days',  -- 4 days = Trip
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
    true,
    NOW(),
    NOW()
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    (SELECT id FROM profiles LIMIT 1),
    'Boring Day in Long Island',
    'A slow, low-key trip out to Long Island. Beach walks, a casual lunch, and some drawing. Nothing crazy, just vibes.',
    'Long Island, NY',
    CURRENT_DATE + INTERVAL '35 days',
    CURRENT_DATE + INTERVAL '37 days',  -- 3 days = Trip
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    true,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ACTIVITIES - Thrifting Day in Austin (Event)
-- ============================================================
INSERT INTO activities (itinerary_id, user_id, title, description, location, start_time, end_time, order_index)
VALUES
  (
    '44444444-4444-4444-4444-444444444444',
    (SELECT id FROM profiles LIMIT 1),
    'Buffalo Exchange',
    'Start the day at Buffalo Exchange on South Congress. Great selection of vintage denim and band tees.',
    'Buffalo Exchange, South Congress Ave, Austin, TX',
    CURRENT_DATE + INTERVAL '20 days' + TIME '10:00:00',
    CURRENT_DATE + INTERVAL '20 days' + TIME '11:30:00',
    1
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    (SELECT id FROM profiles LIMIT 1),
    'Uncommon Objects',
    'Browse the wildest collection of oddities, antiques, and vintage home decor in Austin.',
    'Uncommon Objects, South Congress Ave, Austin, TX',
    CURRENT_DATE + INTERVAL '20 days' + TIME '12:00:00',
    CURRENT_DATE + INTERVAL '20 days' + TIME '13:30:00',
    2
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    (SELECT id FROM profiles LIMIT 1),
    'Lunch at Torchy''s Tacos',
    'Refuel with tacos. Get the Trailer Park Trashy.',
    'Torchy''s Tacos, South Congress, Austin, TX',
    CURRENT_DATE + INTERVAL '20 days' + TIME '13:30:00',
    CURRENT_DATE + INTERVAL '20 days' + TIME '14:30:00',
    3
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    (SELECT id FROM profiles LIMIT 1),
    'Blue Velvet Vintage',
    'Head to East Austin for some of the best curated vintage finds in the city. Lots of 70s and 80s gems.',
    'Blue Velvet, East Austin, TX',
    CURRENT_DATE + INTERVAL '20 days' + TIME '15:00:00',
    CURRENT_DATE + INTERVAL '20 days' + TIME '16:30:00',
    4
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    (SELECT id FROM profiles LIMIT 1),
    'Room Service Vintage',
    'End the thrift crawl at Room Service Vintage. Mid-century furniture and retro clothing.',
    'Room Service Vintage, East Austin, TX',
    CURRENT_DATE + INTERVAL '20 days' + TIME '17:00:00',
    CURRENT_DATE + INTERVAL '20 days' + TIME '18:30:00',
    5
  );

-- ============================================================
-- ACTIVITIES - My Personal Burger Tour in California (Trip)
-- ============================================================
INSERT INTO activities (itinerary_id, user_id, title, description, location, start_time, end_time, order_index)
VALUES
  (
    '55555555-5555-5555-5555-555555555555',
    (SELECT id FROM profiles LIMIT 1),
    'In-N-Out Burger',
    'Day 1 kicks off with the classic. Double-Double animal style, no debate.',
    'In-N-Out Burger, Los Angeles, CA',
    CURRENT_DATE + INTERVAL '25 days' + TIME '12:00:00',
    CURRENT_DATE + INTERVAL '25 days' + TIME '13:30:00',
    1
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    (SELECT id FROM profiles LIMIT 1),
    'Hodad''s',
    'Day 2 means a trip to Ocean Beach in San Diego for Hodad''s. Massive burgers, no shirt no shoes no problem.',
    'Hodad''s, Ocean Beach, San Diego, CA',
    CURRENT_DATE + INTERVAL '26 days' + TIME '12:00:00',
    CURRENT_DATE + INTERVAL '26 days' + TIME '14:00:00',
    2
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    (SELECT id FROM profiles LIMIT 1),
    'Super Duper Burgers',
    'Day 3 we go up to San Francisco for Super Duper. Fresh, organic, and perfectly juicy.',
    'Super Duper Burgers, San Francisco, CA',
    CURRENT_DATE + INTERVAL '27 days' + TIME '12:00:00',
    CURRENT_DATE + INTERVAL '27 days' + TIME '13:30:00',
    3
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    (SELECT id FROM profiles LIMIT 1),
    'Santa Monica Beach',
    'Last day starts at the beach. Soak up the sun, walk the pier, and enjoy the ocean before the final burger.',
    'Santa Monica Beach, Santa Monica, CA',
    CURRENT_DATE + INTERVAL '28 days' + TIME '09:00:00',
    CURRENT_DATE + INTERVAL '28 days' + TIME '13:00:00',
    4
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    (SELECT id FROM profiles LIMIT 1),
    'Father''s Office',
    'End the tour with one of the best burgers in LA. The Office Burger with caramelized onions and gruyere. Chef''s kiss.',
    'Father''s Office, Santa Monica, CA',
    CURRENT_DATE + INTERVAL '28 days' + TIME '14:00:00',
    CURRENT_DATE + INTERVAL '28 days' + TIME '15:30:00',
    5
  );

-- ============================================================
-- ACTIVITIES - Boring Day in Long Island (Trip)
-- ============================================================
INSERT INTO activities (itinerary_id, user_id, title, description, location, start_time, end_time, order_index)
VALUES
  (
    '66666666-6666-6666-6666-666666666666',
    (SELECT id FROM profiles LIMIT 1),
    'Beach Walk at Jones Beach',
    'Start the trip with a long walk along Jones Beach. Fresh air, waves, empty thoughts.',
    'Jones Beach State Park, Long Island, NY',
    CURRENT_DATE + INTERVAL '35 days' + TIME '09:00:00',
    CURRENT_DATE + INTERVAL '35 days' + TIME '11:00:00',
    1
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    (SELECT id FROM profiles LIMIT 1),
    'Lunch at a Diner',
    'Find a classic Long Island diner. Get a grilled cheese or something. Nothing fancy.',
    'Nautilus Diner, Massapequa, Long Island, NY',
    CURRENT_DATE + INTERVAL '36 days' + TIME '12:00:00',
    CURRENT_DATE + INTERVAL '36 days' + TIME '13:30:00',
    2
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    (SELECT id FROM profiles LIMIT 1),
    'Drawing Session',
    'Bring a sketchbook and draw whatever. The beach, the diner, a seagull. Doesn''t have to be good.',
    'Long Beach Boardwalk, Long Island, NY',
    CURRENT_DATE + INTERVAL '37 days' + TIME '14:00:00',
    CURRENT_DATE + INTERVAL '37 days' + TIME '17:00:00',
    3
  );

-- ============================================================
-- CATEGORIES
-- ============================================================
INSERT INTO itinerary_categories (itinerary_id, category)
VALUES
  ('44444444-4444-4444-4444-444444444444', 'Shopping'),
  ('44444444-4444-4444-4444-444444444444', 'Culture'),
  ('44444444-4444-4444-4444-444444444444', 'City Break'),

  ('55555555-5555-5555-5555-555555555555', 'Food'),
  ('55555555-5555-5555-5555-555555555555', 'Road Trip'),
  ('55555555-5555-5555-5555-555555555555', 'Beach'),

  ('66666666-6666-6666-6666-666666666666', 'Relaxation'),
  ('66666666-6666-6666-6666-666666666666', 'Beach'),
  ('66666666-6666-6666-6666-666666666666', 'Art');

-- ============================================================
-- METRICS
-- ============================================================
INSERT INTO itinerary_metrics (itinerary_id, view_count, save_count, share_count, like_count, comment_count)
VALUES
  ('44444444-4444-4444-4444-444444444444', 187, 24, 9, 42, 7),
  ('55555555-5555-5555-5555-555555555555', 320, 55, 18, 73, 14),
  ('66666666-6666-6666-6666-666666666666', 95, 11, 4, 19, 3)
ON CONFLICT (itinerary_id) DO NOTHING;

-- ============================================================
-- PACKING ITEMS
-- ============================================================
INSERT INTO packing_items (itinerary_id, user_id, name, is_packed)
VALUES
  -- Austin Thrifting
  ('44444444-4444-4444-4444-444444444444', (SELECT id FROM profiles LIMIT 1), 'Comfortable shoes', false),
  ('44444444-4444-4444-4444-444444444444', (SELECT id FROM profiles LIMIT 1), 'Reusable tote bags', false),
  ('44444444-4444-4444-4444-444444444444', (SELECT id FROM profiles LIMIT 1), 'Cash for deals', false),
  ('44444444-4444-4444-4444-444444444444', (SELECT id FROM profiles LIMIT 1), 'Water bottle', false),

  -- CA Burger Tour
  ('55555555-5555-5555-5555-555555555555', (SELECT id FROM profiles LIMIT 1), 'Stretchy pants', false),
  ('55555555-5555-5555-5555-555555555555', (SELECT id FROM profiles LIMIT 1), 'Antacids', false),
  ('55555555-5555-5555-5555-555555555555', (SELECT id FROM profiles LIMIT 1), 'Sunscreen', false),
  ('55555555-5555-5555-5555-555555555555', (SELECT id FROM profiles LIMIT 1), 'Beach towel', false),
  ('55555555-5555-5555-5555-555555555555', (SELECT id FROM profiles LIMIT 1), 'Swimsuit', false),

  -- Long Island
  ('66666666-6666-6666-6666-666666666666', (SELECT id FROM profiles LIMIT 1), 'Sketchbook', false),
  ('66666666-6666-6666-6666-666666666666', (SELECT id FROM profiles LIMIT 1), 'Pencils and pens', false),
  ('66666666-6666-6666-6666-666666666666', (SELECT id FROM profiles LIMIT 1), 'Hoodie', false),
  ('66666666-6666-6666-6666-666666666666', (SELECT id FROM profiles LIMIT 1), 'Sunglasses', false);

-- ============================================================
-- EXPENSES
-- ============================================================
INSERT INTO expenses (itinerary_id, user_id, title, category, amount, currency, date, description)
VALUES
  -- Austin Thrifting
  ('44444444-4444-4444-4444-444444444444', (SELECT id FROM profiles LIMIT 1), 'Thrift Haul', 'Shopping', 85.00, 'USD', NOW(), 'Vintage finds and thrift hauls'),
  ('44444444-4444-4444-4444-444444444444', (SELECT id FROM profiles LIMIT 1), 'Lunch', 'Food', 25.00, 'USD', NOW(), 'Lunch at Torchy''s Tacos'),
  ('44444444-4444-4444-4444-444444444444', (SELECT id FROM profiles LIMIT 1), 'Gas & Parking', 'Transportation', 15.00, 'USD', NOW(), 'Gas and parking'),

  -- CA Burger Tour
  ('55555555-5555-5555-5555-555555555555', (SELECT id FROM profiles LIMIT 1), 'Burgers', 'Food', 120.00, 'USD', NOW(), 'Burgers across California'),
  ('55555555-5555-5555-5555-555555555555', (SELECT id FROM profiles LIMIT 1), 'Road Trip Gas', 'Transportation', 200.00, 'USD', NOW(), 'Gas for the road trip'),
  ('55555555-5555-5555-5555-555555555555', (SELECT id FROM profiles LIMIT 1), 'Hotels', 'Accommodation', 350.00, 'USD', NOW(), 'Hotels along the route'),

  -- Long Island
  ('66666666-6666-6666-6666-666666666666', (SELECT id FROM profiles LIMIT 1), 'Diner Lunch', 'Food', 30.00, 'USD', NOW(), 'Diner lunch'),
  ('66666666-6666-6666-6666-666666666666', (SELECT id FROM profiles LIMIT 1), 'Train Tickets', 'Transportation', 40.00, 'USD', NOW(), 'Train to Long Island');

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Sample itineraries created successfully!';
  RAISE NOTICE '  Thrifting Day in Austin (Event)';
  RAISE NOTICE '  My Personal Burger Tour in California (Trip)';
  RAISE NOTICE '  Boring Day in Long Island (Trip)';
END $$;
