-- =====================================================
-- Oasis Royale - Supabase Database Schema
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. DISHES TABLE
CREATE TABLE IF NOT EXISTS dishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric(10, 2) NOT NULL,
  category text NOT NULL,
  image_url text,
  model_url text,
  is_available boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- RLS for dishes
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dishes are viewable by everyone"
  ON dishes FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify dishes"
  ON dishes FOR ALL
  USING (auth.role() = 'authenticated');

-- 2. ORDERS TABLE
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'ready', 'completed', 'cancelled');

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_short_id integer GENERATED ALWAYS AS IDENTITY (START WITH 100 INCREMENT BY 1),
  session_id uuid,
  table_id text DEFAULT 'walk-in',
  items jsonb NOT NULL,
  total numeric(10, 2) NOT NULL,
  status order_status DEFAULT 'pending',
  cancellation jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS for orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create orders"
  ON orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Orders are viewable by anyone (for kitchen + customer)"
  ON orders FOR SELECT
  USING (true);

CREATE POLICY "Orders can be updated by anyone (kitchen staff)"
  ON orders FOR UPDATE
  USING (true);

-- 3. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id text NOT NULL,
  guest_name text NOT NULL,
  guest_email text NOT NULL,
  guest_phone text,
  check_in date NOT NULL,
  check_out date NOT NULL,
  guests integer DEFAULT 1,
  total_price numeric(10, 2) NOT NULL,
  status text DEFAULT 'confirmed',
  special_requests text,
  created_at timestamptz DEFAULT now()
);

-- RLS for bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Bookings are viewable by authenticated users"
  ON bookings FOR SELECT
  USING (auth.role() = 'authenticated');

-- 4. STAFF TABLE (for admin auth)
CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text DEFAULT 'staff',
  created_at timestamptz DEFAULT now()
);

-- RLS for staff
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff are viewable by authenticated users"
  ON staff FOR SELECT
  USING (auth.role() = 'authenticated');

-- =====================================================
-- SEED DATA - Sample Dishes
-- =====================================================
INSERT INTO dishes (name, description, price, category, image_url, model_url, is_available) VALUES
  ('Smoked Brisket', 'Slow-smoked for 16 hours with our signature dry rub, served with house pickles.', 34.99, 'Grilled Specialties', 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600', NULL, true),
  ('Golden Saffron Risotto', 'Creamy arborio rice infused with saffron and finished with parmesan.', 28.99, 'Signature Entrees', 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600', NULL, true),
  ('Oasis Royale Burger', 'Wagyu patty, truffle aioli, caramelized onions, served with truffle fries.', 26.99, 'Grilled Specialties', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600', NULL, true),
  ('Desert Rose Cocktail', 'Vodka, rose syrup, lime, and a hint of pomegranate over crushed ice.', 18.99, 'Signature Cocktails', 'https://images.unsplash.com/photo-1536935338788-846bb9951012?w=600', NULL, true),
  ('Charred Octopus', 'Mediterranean octopus charred to perfection, with lemon-herb vinaigrette.', 32.99, 'Appetizers', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600', NULL, false),
  ('Midnight Tiramisu', 'Classic tiramisu with a dark chocolate twist and espresso foam.', 14.99, 'Dessert Platters', 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600', NULL, true),
  ('Gold Leaf Lobster', 'Charred Atlantic lobster with gold leaf, saffron beurre blanc.', 85.00, 'Signature', 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=600', NULL, true),
  ('A5 Wagyu Tasting', 'Japanese A5 Kobe seared tableside with truffle jus.', 120.00, 'Signature', 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600', NULL, true),
  ('Black Truffle Risotto', 'Carnaroli risotto with black truffle and aged parmesan.', 65.00, 'Main', 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600', NULL, true),
  ('Gold Souffle', 'Grand Marnier souffle with gold dust and vanilla cream.', 35.00, 'Dessert', 'https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?w=600', NULL, true);

-- =====================================================
-- REALTIME: Enable realtime on orders table
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
