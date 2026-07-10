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
  poster_url text,
  ios_src text,
  is_available boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- RLS for dishes
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dishes are viewable by everyone"
  ON dishes FOR SELECT
  USING (true);

CREATE POLICY "dishes_insert_policy"
  ON dishes FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('staff', 'admin'))
  );

CREATE POLICY "dishes_update_policy"
  ON dishes FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('staff', 'admin'))
  );

CREATE POLICY "dishes_delete_policy"
  ON dishes FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('staff', 'admin'))
  );

-- 2. ORDERS TABLE
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'ready', 'completed', 'cancelled');

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_short_id integer GENERATED ALWAYS AS IDENTITY (START WITH 100 INCREMENT BY 1),
  session_id uuid,
  table_id text DEFAULT 'walk-in',
  customer_name text,
  customer_phone text,
  source text DEFAULT 'qr' CHECK (source IN ('qr', 'counter')),
  items jsonb NOT NULL,
  total numeric(10, 2) NOT NULL,
  status order_status DEFAULT 'pending',
  estimated_minutes integer,
  tags jsonb DEFAULT '[]',
  priority text DEFAULT 'normal' CHECK (priority IN ('normal', 'vip')),
  cancellation jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  status_changed_at timestamptz DEFAULT now()
);

-- Index for date-range queries
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- RLS for orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_insert_policy"
  ON orders FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR (session_id IS NOT NULL));

CREATE POLICY "orders_select_policy"
  ON orders FOR SELECT
  USING (auth.role() = 'authenticated' OR true);

CREATE POLICY "orders_update_policy"
  ON orders FOR UPDATE
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

-- 5. PROFILES TABLE (for auth system)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text DEFAULT '',
  role text DEFAULT 'customer' CHECK (role IN ('customer', 'staff', 'admin')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_select_staff" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('staff', 'admin'))
);
CREATE POLICY "profiles_insert_service" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_update_service" ON profiles FOR UPDATE USING (true);

-- 6. RESTAURANT TABLES (for table_id validation)
CREATE TABLE IF NOT EXISTS restaurant_tables (
  id text PRIMARY KEY,
  name text NOT NULL,
  capacity integer DEFAULT 4,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "restaurant_tables_select" ON restaurant_tables FOR SELECT USING (is_active = true);
CREATE POLICY "restaurant_tables_modify" ON restaurant_tables FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('staff', 'admin'))
);

-- 7. KITCHEN HEARTBEATS
CREATE TABLE IF NOT EXISTS kitchen_heartbeats (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_heartbeat timestamptz DEFAULT now()
);

ALTER TABLE kitchen_heartbeats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff upsert own heartbeat" ON kitchen_heartbeats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Staff update own heartbeat" ON kitchen_heartbeats FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Authenticated read heartbeats" ON kitchen_heartbeats FOR SELECT USING (auth.role() = 'authenticated');

-- 8. RESTAURANT STATUS
-- (Created by migration 007, add definition here for completeness)
-- ALTER TABLE restaurant_status ENABLE ROW LEVEL SECURITY;
-- Policies added by migration 010

-- 9. ETA NOTIFICATIONS
CREATE TABLE IF NOT EXISTS eta_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  message text NOT NULL,
  old_eta integer,
  new_eta integer,
  sent_at timestamptz DEFAULT now()
);

ALTER TABLE eta_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "eta_notifications_select" ON eta_notifications FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "eta_notifications_insert" ON eta_notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- SEED DATA - Sample Dishes
-- =====================================================

-- Additional dishes with 3D models
INSERT INTO dishes (name, description, price, category, image_url, model_url, poster_url, ios_src, is_available) VALUES
  ('Artisan Pizza', 'Wood-fired pizza with fresh mozzarella, basil, and San Marzano tomatoes.', 22.99, 'Main', 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600', '/models/pizza.glb', '/models/pizza-placeholder.webp', '/models/pizza.usdz', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- REALTIME: Enable realtime on orders table
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- =====================================================
-- MIGRATION: Premium Customizations, Negotiation & Tax Settings
-- =====================================================

-- Add customization columns to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS special_instructions text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customization_charge numeric(10, 2) DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customization_status text DEFAULT 'none' CHECK (customization_status IN ('none', 'pending_approval', 'proposed', 'approved', 'rejected'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customization_notes text;

-- Add discount code tracking to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_code text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount numeric(10, 2) DEFAULT 0.00;

-- Add tax, service charges, and discount configuration to restaurant_status
ALTER TABLE restaurant_status ADD COLUMN IF NOT EXISTS tax_rate numeric(5, 2) DEFAULT 8.25;
ALTER TABLE restaurant_status ADD COLUMN IF NOT EXISTS service_charge numeric(5, 2) DEFAULT 10.00;
ALTER TABLE restaurant_status ADD COLUMN IF NOT EXISTS discount_codes jsonb DEFAULT '[]';

