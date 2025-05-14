-- Clear existing triggers and functions first without referencing tables that don't exist yet
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS handle_user_delete() CASCADE;
DROP FUNCTION IF EXISTS update_profile_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_seller_rating() CASCADE;

-- Drop existing tables if they exist using CASCADE to handle dependencies automatically
DROP TABLE IF EXISTS seller_ratings CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS notifications CASCADE; 
DROP TABLE IF EXISTS payment_records CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS product_favorites CASCADE;
DROP TABLE IF EXISTS accommodation_favorites CASCADE;
DROP TABLE IF EXISTS accommodation_reviews CASCADE;
DROP TABLE IF EXISTS accommodation_bookings CASCADE;
DROP TABLE IF EXISTS accommodation_listings CASCADE;
DROP TABLE IF EXISTS accommodation_amenities CASCADE;
DROP TABLE IF EXISTS accommodation_types CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS banners CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- We need to create all tables first, then create triggers and policies

-- Create profiles table first (since other tables depend on it)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  rating NUMERIC,
  role TEXT DEFAULT 'student',
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_seller BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id),
  condition TEXT CHECK (condition IN ('new', 'like_new', 'good', 'used', 'worn')),
  images TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  is_negotiable BOOLEAN DEFAULT FALSE,
  is_urgent BOOLEAN DEFAULT FALSE,
  featured BOOLEAN DEFAULT FALSE,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participants UUID[] NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE
);

-- Create orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  buyer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'delivered', 'cancelled')) DEFAULT 'pending',
  price NUMERIC NOT NULL,
  payment_method TEXT,
  delivery_address TEXT,
  delivery_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create banners table
CREATE TABLE banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  action_url TEXT,
  active BOOLEAN DEFAULT TRUE,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create accommodation_types table
CREATE TABLE accommodation_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create accommodation_amenities table
CREATE TABLE accommodation_amenities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT CHECK (category IN ('essential', 'feature', 'safety', 'location')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create accommodation_listings table
CREATE TABLE accommodation_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type_id UUID REFERENCES accommodation_types(id),
  amenities UUID[] DEFAULT '{}',
  price_per_month NUMERIC NOT NULL,
  security_deposit NUMERIC,
  bedrooms INTEGER NOT NULL DEFAULT 1,
  bathrooms INTEGER NOT NULL DEFAULT 1,
  max_occupants INTEGER NOT NULL DEFAULT 1,
  address TEXT NOT NULL,
  location_lat NUMERIC,
  location_lng NUMERIC,
  images TEXT[] DEFAULT '{}',
  available_from DATE NOT NULL,
  minimum_stay_months INTEGER DEFAULT 1,
  is_furnished BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create accommodation_bookings table
CREATE TABLE accommodation_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES accommodation_listings(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'completed')) DEFAULT 'pending',
  move_in_date DATE NOT NULL,
  move_out_date DATE,
  monthly_rent NUMERIC NOT NULL,
  security_deposit NUMERIC,
  is_deposit_paid BOOLEAN DEFAULT FALSE,
  special_requests TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create accommodation_reviews table
CREATE TABLE accommodation_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES accommodation_listings(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES accommodation_bookings(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create product_favorites table
CREATE TABLE product_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Create accommodation_favorites table
CREATE TABLE accommodation_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  listing_id UUID REFERENCES accommodation_listings(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

-- Create payment_records table
CREATE TABLE payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_type TEXT CHECK (payment_type IN ('order', 'booking', 'deposit', 'refund')) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES accommodation_bookings(id) ON DELETE SET NULL,
  payment_method TEXT NOT NULL,
  payment_details JSONB,
  transaction_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('message', 'order', 'booking', 'review', 'system', 'payment')) NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create reports table for user reporting issues or other users
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  reported_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  listing_id UUID REFERENCES accommodation_listings(id) ON DELETE SET NULL,
  report_type TEXT CHECK (report_type IN ('spam', 'inappropriate', 'fraud', 'offensive', 'other')) NOT NULL,
  description TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')) DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create user_settings table for storing user preferences
CREATE TABLE user_settings (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  notification_preferences JSONB DEFAULT '{"email": true, "push": true, "messages": true, "orders": true, "marketing": false}',
  theme TEXT DEFAULT 'system',
  language TEXT DEFAULT 'en',
  currency TEXT DEFAULT 'USD',
  privacy_settings JSONB DEFAULT '{"show_email": false, "show_phone": false, "show_activity": true}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create seller_ratings table for product seller ratings
CREATE TABLE seller_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rater_id UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(rater_id, order_id)
);

-- Now that all tables exist, create functions and triggers

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  first_name TEXT;
  last_name TEXT;
  full_name TEXT;
BEGIN
  -- Extract name data from metadata, defaulting to empty string if not present
  first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', first_name || ' ' || last_name);
  
  -- Insert the new profile
  INSERT INTO profiles (
    id,
    email,
    first_name,
    last_name,
    full_name,
    is_verified,
    is_seller,
    role,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    first_name,
    last_name,
    full_name,
    FALSE,
    FALSE,
    'student',
    NOW(),
    NOW()
  );
  
  -- Create default user settings
  INSERT INTO user_settings (
    id,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    -- Return NEW to allow the user creation to proceed
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to handle user deletion
CREATE OR REPLACE FUNCTION handle_user_delete() 
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM profiles WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user deletion
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_user_delete();

-- Create function to update profile timestamps
CREATE OR REPLACE FUNCTION update_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profile updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_profile_updated_at();

-- Create function to automatically calculate and update seller ratings
CREATE OR REPLACE FUNCTION update_seller_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating NUMERIC;
BEGIN
  -- Calculate the average rating for the seller
  SELECT AVG(rating) INTO avg_rating
  FROM seller_ratings
  WHERE seller_id = NEW.seller_id;
  
  -- Update the seller's profile with the new average rating
  UPDATE profiles
  SET rating = avg_rating
  WHERE id = NEW.seller_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update seller rating after a new rating is added or updated
CREATE TRIGGER update_seller_rating_on_insert
  AFTER INSERT ON seller_ratings
  FOR EACH ROW EXECUTE FUNCTION update_seller_rating();

CREATE TRIGGER update_seller_rating_on_update
  AFTER UPDATE ON seller_ratings
  FOR EACH ROW EXECUTE FUNCTION update_seller_rating();

-- Set up Row Level Security (RLS)

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodation_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodation_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodation_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodation_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodation_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodation_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_ratings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Products policies
CREATE POLICY "Products are viewable by everyone"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own products"
  ON products FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can update their own products"
  ON products FOR UPDATE
  USING (auth.uid() = seller_id);

CREATE POLICY "Users can delete their own products"
  ON products FOR DELETE
  USING (auth.uid() = seller_id);

-- Orders policies
CREATE POLICY "Users can view orders they are involved in"
  ON orders FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can update orders they are involved in"
  ON orders FOR UPDATE
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Conversations policies
CREATE POLICY "Users can view conversations they are involved in"
  ON conversations FOR SELECT
  USING (auth.uid() = ANY(participants));

CREATE POLICY "Users can create conversations they are involved in"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = ANY(participants));

-- Messages policies
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND auth.uid() = ANY(participants)
    )
  );

CREATE POLICY "Users can insert messages in their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND auth.uid() = ANY(participants)
    )
  );

CREATE POLICY "Users can update read status of their messages"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND auth.uid() = ANY(participants)
    )
  );

-- Categories policies
CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify categories"
  ON categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Banners policies
CREATE POLICY "Banners are viewable by everyone"
  ON banners FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify banners"
  ON banners FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Accommodation types policies
CREATE POLICY "Accommodation types are viewable by everyone"
  ON accommodation_types FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify accommodation types"
  ON accommodation_types FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Accommodation amenities policies
CREATE POLICY "Accommodation amenities are viewable by everyone"
  ON accommodation_amenities FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify accommodation amenities"
  ON accommodation_amenities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Accommodation listings policies
CREATE POLICY "Accommodation listings are viewable by everyone"
  ON accommodation_listings FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own accommodation listings"
  ON accommodation_listings FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own accommodation listings"
  ON accommodation_listings FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own accommodation listings"
  ON accommodation_listings FOR DELETE
  USING (auth.uid() = owner_id);

-- Accommodation bookings policies
CREATE POLICY "Users can view bookings they are involved in"
  ON accommodation_bookings FOR SELECT
  USING (auth.uid() = tenant_id OR auth.uid() = owner_id);

CREATE POLICY "Users can create bookings"
  ON accommodation_bookings FOR INSERT
  WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Users can update bookings they are involved in"
  ON accommodation_bookings FOR UPDATE
  USING (auth.uid() = tenant_id OR auth.uid() = owner_id);

-- Accommodation reviews policies
CREATE POLICY "Accommodation reviews are viewable by everyone"
  ON accommodation_reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own accommodation reviews"
  ON accommodation_reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update their own accommodation reviews"
  ON accommodation_reviews FOR UPDATE
  USING (auth.uid() = reviewer_id);

CREATE POLICY "Users can delete their own accommodation reviews"
  ON accommodation_reviews FOR DELETE
  USING (auth.uid() = reviewer_id);

-- Product favorites policies
CREATE POLICY "Users can view their own product favorites"
  ON product_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add product favorites"
  ON product_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own product favorites"
  ON product_favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Accommodation favorites policies
CREATE POLICY "Users can view their own accommodation favorites"
  ON accommodation_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add accommodation favorites"
  ON accommodation_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accommodation favorites"
  ON accommodation_favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Payment records policies
CREATE POLICY "Users can view their own payment records"
  ON payment_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Only system can insert payment records"
  ON payment_records FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Reports policies
CREATE POLICY "Users can view reports they created"
  ON reports FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports"
  ON reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Only admins can update reports"
  ON reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- User settings policies
CREATE POLICY "Users can view their own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = id);

-- Seller ratings policies
CREATE POLICY "Seller ratings are viewable by everyone"
  ON seller_ratings FOR SELECT
  USING (true);

CREATE POLICY "Users can create ratings for sellers they bought from"
  ON seller_ratings FOR INSERT
  WITH CHECK (
    auth.uid() = rater_id AND
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = seller_ratings.order_id
      AND orders.buyer_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own ratings"
  ON seller_ratings FOR UPDATE
  USING (auth.uid() = rater_id);

-- Insert sample data AFTER all tables, functions, and policies are created

-- Insert sample categories
INSERT INTO categories (name, icon) VALUES
  -- Academic Materials
  ('Textbooks', 'book'),
  ('Course Notes', 'file-text'),
  ('Stationery', 'edit'),
  ('Lab Equipment', 'tool'),
  ('Calculators', 'calculator'),
  ('Academic Services', 'briefcase'),
  
  -- Electronics
  ('Computers & Laptops', 'laptop'),
  ('Phones & Tablets', 'smartphone'),
  ('Computer Accessories', 'hard-drive'),
  ('Audio Equipment', 'headphones'),
  ('Cameras', 'camera'),
  ('TV & Video', 'tv'),
  ('Appliances', 'monitor'),
  
  -- Home & Living
  ('Furniture', 'chair'),
  ('Kitchen Items', 'coffee'),
  ('Bedding & Linen', 'layers'),
  ('Decor', 'image'),
  ('Storage', 'archive'),
  ('Housekeeping', 'home'),
  
  -- Clothing & Fashion
  ('Men''s Clothing', 'user'),
  ('Women''s Clothing', 'user-plus'),
  ('Shoes', 'boot'),
  ('Bags & Backpacks', 'shopping-bag'),
  ('Accessories', 'watch'),
  ('Jewelry', 'gem'),
  ('School Uniforms', 'scissors'),
  
  -- Transport
  ('Bicycles', 'bike'),
  ('Cars', 'car'),
  ('Ride Sharing', 'users'),
  ('Transport Services', 'truck'),
  ('Vehicle Parts', 'settings'),
  
  -- Sports & Leisure
  ('Sports Equipment', 'activity'),
  ('Exercise & Fitness', 'trending-up'),
  ('Team Sports', 'users'),
  ('Outdoor Activities', 'compass'),
  ('Board & Card Games', 'grid'),
  ('Musical Instruments', 'music'),
  
  -- Food & Nutrition
  ('Meal Prep & Delivery', 'package'),
  ('Cooking Ingredients', 'shopping-cart'),
  ('Snacks', 'coffee'),
  ('Meal Vouchers', 'credit-card'),
  ('Catering Services', 'utensils'),
  
  -- Services
  ('Tutoring', 'book-open'),
  ('Computer Repair', 'tool'),
  ('Cleaning', 'trash'),
  ('Beauty & Grooming', 'scissors'),
  ('Event Planning', 'calendar'),
  ('Photography', 'camera'),
  ('Graphic Design', 'pen-tool'),
  ('Translation', 'globe'),
  
  -- Campus Jobs
  ('Part-time Jobs', 'clock'),
  ('Internships', 'briefcase'),
  ('Research Assistants', 'search'),
  ('Campus Ambassador', 'user-check'),
  ('Tutoring Jobs', 'edit-3'),
  
  -- Event Tickets
  ('Campus Events', 'calendar'),
  ('Sports Events', 'flag'),
  ('Concerts', 'music'),
  ('Workshops', 'users'),
  ('Graduation', 'award'),
  
  -- Zimbabwe-Specific
  ('Booster Packages', 'box'),
  ('Combi Services', 'truck'),
  ('Tuck Shop Items', 'shopping-bag'),
  ('Sadza Power', 'battery-charging'),
  ('Bulk Groceries', 'package'),
  ('Hostel Essentials', 'home'),
  
  -- Miscellaneous
  ('Lost & Found', 'help-circle'),
  ('Free Items', 'gift'),
  ('Swap & Exchange', 'repeat'),
  ('Others', 'more-horizontal');

-- Insert sample accommodation types
INSERT INTO accommodation_types (name, description, icon) VALUES
  ('Apartment', 'Fully furnished apartment with separate bedroom', 'apartment'),
  ('Studio', 'Open-plan living space with combined bedroom and living area', 'studio'),
  ('Room in shared house', 'Private room with shared common areas', 'bed'),
  ('Entire house', 'Complete house for rent', 'home'),
  ('Dormitory', 'Student dormitory room', 'door-open'),
  -- Zimbabwe-specific accommodation types
  ('Single Room', 'Private room for one person with no sharing', 'user'),
  ('2-Sharing Room', 'Room shared between two students with two beds', 'users'),
  ('3-Sharing Room', 'Room shared between three students with three beds', 'users'),
  ('4-Sharing Room', 'Room shared between four students with four beds', 'users'),
  ('Cottage', 'Small separate house within a larger property', 'home'),
  ('Bedsitter', 'Combined bedroom and sitting room with small kitchenette', 'coffee'),
  ('Boarding House', 'Traditional Zimbabwe boarding house with caretaker', 'home-heart'),
  ('Campus Hostel', 'Official university hostel on campus grounds', 'building'),
  ('Off-Campus Hostel', 'Private hostel near university with multiple sharing options', 'building-community'),
  ('Servant Quarter', 'Converted small housing unit often behind main houses', 'door');

-- Insert sample accommodation amenities
INSERT INTO accommodation_amenities (name, icon, category) VALUES
  ('Wi-Fi', 'wifi', 'essential'),
  ('Kitchen', 'kitchen', 'essential'),
  ('Washing machine', 'wash', 'essential'),
  ('Heating', 'thermometer', 'essential'),
  ('Air conditioning', 'wind', 'feature'),
  ('TV', 'tv', 'feature'),
  ('Free parking', 'car', 'feature'),
  ('Gym', 'dumbbell', 'feature'),
  ('Pool', 'droplet', 'feature'),
  ('Fire extinguisher', 'fire-extinguisher', 'safety'),
  ('Smoke alarm', 'alert-triangle', 'safety'),
  ('First aid kit', 'plus', 'safety'),
  ('Near campus', 'map-pin', 'location'),
  ('Near public transport', 'bus', 'location'),
  ('Near shops', 'shopping-bag', 'location');