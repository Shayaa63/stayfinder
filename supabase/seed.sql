-- ==========================================
-- STAYFINDER: SEED DATA 
-- Policies ligger i supabase/migrations/
-- ==========================================

-- 1. TESTANVÄNDARE (behövs lokalt eftersom auth.users töms vid db reset)
-- Lokalt lösenord: password123

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '56db4e63-6dcc-426c-9cdd-e1c266aafea9',
  'authenticated',
  'authenticated',
  'aisha_1@live.se',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
)
ON CONFLICT DO NOTHING;

INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  '56db4e63-6dcc-426c-9cdd-e1c266aafea9',
  '56db4e63-6dcc-426c-9cdd-e1c266aafea9',
  '{"sub":"56db4e63-6dcc-426c-9cdd-e1c266aafea9","email":"aisha_1@live.se","email_verified":true}',
  'email',
  now(),
  now(),
  now()
)
ON CONFLICT DO NOTHING;


-- 2. PROPERTIES

INSERT INTO public.properties (
  property_id,
  user_id,
  title,
  description,
  city,
  country,
  address,
  price_per_night,
  max_guests,
  images,
  is_published
)
VALUES

(
  'a1000000-0000-4000-8000-000000000001',
  '56db4e63-6dcc-426c-9cdd-e1c266aafea9',
  'Modern Apartment in Central Stockholm',
  'Enjoy a bright and modern apartment in the heart of Stockholm. The property features a comfortable living room, fully equipped kitchen, stylish bedroom and easy access to restaurants, shopping and public transport.',
  'Stockholm',
  'Sweden',
  'Södermalm, Stockholm',
  1450,
  4,
  ARRAY['https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80'],
  true
),

(
  'a1000000-0000-4000-8000-000000000002',
  '56db4e63-6dcc-426c-9cdd-e1c266aafea9',
  'Cozy Scandinavian City Apartment',
  'A cozy Scandinavian apartment with beautiful natural light and minimalist interior design. Perfect for couples or small families looking to explore the city while enjoying a peaceful place to stay.',
  'Gothenburg',
  'Sweden',
  'Haga, Gothenburg',
  1100,
  3,
  ARRAY['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80'],
  true
),

(
  'a1000000-0000-4000-8000-000000000003',
  '56db4e63-6dcc-426c-9cdd-e1c266aafea9',
  'Stylish Malmö Loft',
  'Stay in a stylish loft with an open-plan layout, comfortable furniture and modern amenities. Located close to cafés, local shops and public transport, this property is ideal for a city getaway.',
  'Malmö',
  'Sweden',
  'Möllevången, Malmö',
  950,
  2,
  ARRAY['https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=80'],
  true
),

(
  'a1000000-0000-4000-8000-000000000004',
  '56db4e63-6dcc-426c-9cdd-e1c266aafea9',
  'Luxury Nordic Waterfront Villa',
  'Experience a relaxing stay in a spacious waterfront villa. Enjoy large windows, beautiful surroundings, generous living areas and a private outdoor space. Ideal for families and groups.',
  'Oslo',
  'Norway',
  'Bygdøy, Oslo',
  2600,
  6,
  ARRAY['https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=80'],
  true
),

(
  'a1000000-0000-4000-8000-000000000005',
  '56db4e63-6dcc-426c-9cdd-e1c266aafea9',
  'Charming Copenhagen Townhouse',
  'A charming townhouse combining classic architecture with modern Scandinavian comfort. Explore Copenhagen by foot or bicycle and return to a welcoming home with plenty of space.',
  'Copenhagen',
  'Denmark',
  'Nørrebro, Copenhagen',
  1850,
  5,
  ARRAY['https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80'],
  true
),

(
  'a1000000-0000-4000-8000-000000000006',
  '56db4e63-6dcc-426c-9cdd-e1c266aafea9',
  'Peaceful Lakeside Cabin',
  'Escape to a peaceful cabin surrounded by nature. Enjoy a warm and inviting interior, a fully equipped kitchen and beautiful lake views. A great choice for a relaxing weekend or longer holiday.',
  'Uppsala',
  'Sweden',
  'Lake Mälaren area, Uppsala',
  1350,
  4,
  ARRAY['https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1200&q=80'],
  true
),

(
  'a1000000-0000-4000-8000-000000000007',
  '56db4e63-6dcc-426c-9cdd-e1c266aafea9',
  'Bright Apartment Near the Beach',
  'A bright and airy apartment close to the beach. Enjoy a comfortable bedroom, open living space and convenient access to seaside walks, restaurants and local attractions.',
  'Helsingborg',
  'Sweden',
  'City Centre, Helsingborg',
  1200,
  3,
  ARRAY['https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80'],
  true
),

(
  'a1000000-0000-4000-8000-000000000008',
  '56db4e63-6dcc-426c-9cdd-e1c266aafea9',
  'Contemporary Family Home',
  'A spacious contemporary home designed for comfortable family stays. Features multiple bedrooms, a large living room, modern kitchen and convenient access to nearby parks and attractions.',
  'Stockholm',
  'Sweden',
  'Nacka, Stockholm',
  2100,
  8,
  ARRAY['https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1200&q=80'],
  true
)

ON CONFLICT (property_id)
DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  city = EXCLUDED.city,
  country = EXCLUDED.country,
  address = EXCLUDED.address,
  price_per_night = EXCLUDED.price_per_night,
  max_guests = EXCLUDED.max_guests,
  images = EXCLUDED.images,
  is_published = EXCLUDED.is_published,
  updated_at = now();


-- 3. BOOKINGS

INSERT INTO public.bookings (
  booking_id,
  property_id,
  user_id,
  guest_name,
  guest_email,
  check_in,
  check_out,
  guests,
  status
)
VALUES

(
  'b1000000-0000-4000-8000-000000000001',
  'a1000000-0000-4000-8000-000000000001',
  '56db4e63-6dcc-426c-9cdd-e1c266aafea9',
  'Aisha Hashi',
  'aisha_1@live.se',
  '2026-12-05',
  '2026-12-08',
  2,
  'confirmed'
),

(
  'b1000000-0000-4000-8000-000000000002',
  'a1000000-0000-4000-8000-000000000002',
  '56db4e63-6dcc-426c-9cdd-e1c266aafea9',
  'Aisha Hashi',
  'aisha_1@live.se',
  '2026-12-18',
  '2026-12-21',
  2,
  'pending'
),

(
  'b1000000-0000-4000-8000-000000000003',
  'a1000000-0000-4000-8000-000000000003',
  '56db4e63-6dcc-426c-9cdd-e1c266aafea9',
  'Aisha Hashi',
  'aisha_1@live.se',
  '2027-01-15',
  '2027-01-19',
  2,
  'confirmed'
),

(
  'b1000000-0000-4000-8000-000000000004',
  'a1000000-0000-4000-8000-000000000004',
  '56db4e63-6dcc-426c-9cdd-e1c266aafea9',
  'Aisha Hashi',
  'aisha_1@live.se',
  '2027-02-10',
  '2027-02-14',
  4,
  'pending'
),

(
  'b1000000-0000-4000-8000-000000000005',
  'a1000000-0000-4000-8000-000000000005',
  '56db4e63-6dcc-426c-9cdd-e1c266aafea9',
  'Aisha Hashi',
  'aisha_1@live.se',
  '2027-03-05',
  '2027-03-08',
  3,
  'cancelled'
),

(
  'b1000000-0000-4000-8000-000000000006',
  'a1000000-0000-4000-8000-000000000006',
  '56db4e63-6dcc-426c-9cdd-e1c266aafea9',
  'Aisha Hashi',
  'aisha_1@live.se',
  '2027-04-12',
  '2027-04-16',
  3,
  'confirmed'
)

ON CONFLICT (booking_id)
DO UPDATE SET
  property_id = EXCLUDED.property_id,
  user_id = EXCLUDED.user_id,
  guest_name = EXCLUDED.guest_name,
  guest_email = EXCLUDED.guest_email,
  check_in = EXCLUDED.check_in,
  check_out = EXCLUDED.check_out,
  guests = EXCLUDED.guests,
  status = EXCLUDED.status;


-- 4. VERIFIERA

SELECT 'properties' AS table_name, COUNT(*) AS total
FROM public.properties
WHERE user_id = '56db4e63-6dcc-426c-9cdd-e1c266aafea9'

UNION ALL

SELECT 'bookings' AS table_name, COUNT(*) AS total
FROM public.bookings
WHERE user_id = '56db4e63-6dcc-426c-9cdd-e1c266aafea9';