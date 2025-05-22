-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'pending', 'inactive');
CREATE TYPE accommodation_status AS ENUM ('available', 'pending', 'occupied', 'maintenance');
CREATE TYPE product_status AS ENUM ('active', 'pending', 'sold', 'removed');
CREATE TYPE product_condition AS ENUM ('New', 'Like New', 'Good', 'Fair', 'Poor');

-- Create tables
-- Universities table
CREATE TABLE universities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    location TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    university_id UUID REFERENCES universities(id),
    role user_role NOT NULL DEFAULT 'user',
    status user_status NOT NULL DEFAULT 'pending',
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Locations table
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    city TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Accommodation types table
CREATE TABLE accommodation_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Amenities table
CREATE TABLE amenities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    icon TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Accommodations table
CREATE TABLE accommodations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    location_id UUID NOT NULL REFERENCES locations(id),
    type_id UUID NOT NULL REFERENCES accommodation_types(id),
    owner_id UUID NOT NULL REFERENCES users(id),
    status accommodation_status NOT NULL DEFAULT 'pending',
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    rating SMALLINT,
    reviews_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Accommodation amenities junction table
CREATE TABLE accommodation_amenities (
    accommodation_id UUID REFERENCES accommodations(id) ON DELETE CASCADE,
    amenity_id UUID REFERENCES amenities(id) ON DELETE CASCADE,
    PRIMARY KEY (accommodation_id, amenity_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Accommodation images table
CREATE TABLE accommodation_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    accommodation_id UUID NOT NULL REFERENCES accommodations(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Product categories table
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category_id UUID NOT NULL REFERENCES product_categories(id),
    condition product_condition NOT NULL,
    seller_id UUID NOT NULL REFERENCES users(id),
    status product_status NOT NULL DEFAULT 'pending',
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Product images table
CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reviews table (polymorphic - can be for products or accommodations)
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    -- Polymorphic relationship fields
    reviewable_type TEXT NOT NULL CHECK (reviewable_type IN ('product', 'accommodation')),
    reviewable_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Ensure a user can only review an item once
    UNIQUE (user_id, reviewable_type, reviewable_id)
);

-- Messages table for communication between users
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES users(id),
    recipient_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Saved items table (polymorphic - can be products or accommodations)
CREATE TABLE saved_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    -- Polymorphic relationship fields
    saveable_type TEXT NOT NULL CHECK (saveable_type IN ('product', 'accommodation')),
    saveable_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Ensure a user can only save an item once
    UNIQUE (user_id, saveable_type, saveable_id)
);

-- Create indexes for performance
CREATE INDEX idx_accommodations_location ON accommodations(location_id);
CREATE INDEX idx_accommodations_type ON accommodations(type_id);
CREATE INDEX idx_accommodations_owner ON accommodations(owner_id);
CREATE INDEX idx_accommodations_status ON accommodations(status);
CREATE INDEX idx_accommodations_featured ON accommodations(featured);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_featured ON products(featured);

CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_polymorphic ON reviews(reviewable_type, reviewable_id);

CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);

CREATE INDEX idx_saved_items_user ON saved_items(user_id);
CREATE INDEX idx_saved_items_polymorphic ON saved_items(saveable_type, saveable_id);

-- Create functions for complex operations
-- Function to update accommodation rating when a review is added/updated/deleted
CREATE OR REPLACE FUNCTION update_accommodation_rating()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.reviewable_type = 'accommodation')) THEN
        UPDATE accommodations
        SET 
            rating = (
                SELECT COALESCE(AVG(rating)::SMALLINT, 0)
                FROM reviews
                WHERE reviewable_type = 'accommodation' AND reviewable_id = OLD.reviewable_id
            ),
            reviews_count = (
                SELECT COUNT(*)
                FROM reviews
                WHERE reviewable_type = 'accommodation' AND reviewable_id = OLD.reviewable_id
            )
        WHERE id = OLD.reviewable_id;
    END IF;
    
    IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.reviewable_type = 'accommodation')) THEN
        UPDATE accommodations
        SET 
            rating = (
                SELECT COALESCE(AVG(rating)::SMALLINT, 0)
                FROM reviews
                WHERE reviewable_type = 'accommodation' AND reviewable_id = NEW.reviewable_id
            ),
            reviews_count = (
                SELECT COUNT(*)
                FROM reviews
                WHERE reviewable_type = 'accommodation' AND reviewable_id = NEW.reviewable_id
            )
        WHERE id = NEW.reviewable_id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to ensure only one primary image per product/accommodation
CREATE OR REPLACE FUNCTION ensure_single_primary_image()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary THEN
        -- For product images
        IF TG_TABLE_NAME = 'product_images' THEN
            UPDATE product_images
            SET is_primary = FALSE
            WHERE product_id = NEW.product_id AND id != NEW.id;
        -- For accommodation images
        ELSIF TG_TABLE_NAME = 'accommodation_images' THEN
            UPDATE accommodation_images
            SET is_primary = FALSE
            WHERE accommodation_id = NEW.accommodation_id AND id != NEW.id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to increment product views
CREATE OR REPLACE FUNCTION increment_product_views(product_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE products
    SET views = views + 1
    WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

-- Function to toggle product likes
CREATE OR REPLACE FUNCTION toggle_product_like(product_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    liked BOOLEAN;
BEGIN
    -- Check if the user has already liked the product
    SELECT EXISTS (
        SELECT 1 FROM saved_items
        WHERE user_id = toggle_product_like.user_id
        AND saveable_type = 'product'
        AND saveable_id = toggle_product_like.product_id
    ) INTO liked;
    
    IF liked THEN
        -- Unlike: Remove from saved_items and decrement likes
        DELETE FROM saved_items
        WHERE user_id = toggle_product_like.user_id
        AND saveable_type = 'product'
        AND saveable_id = toggle_product_like.product_id;
        
        UPDATE products
        SET likes = likes - 1
        WHERE id = toggle_product_like.product_id;
        
        RETURN FALSE;
    ELSE
        -- Like: Add to saved_items and increment likes
        INSERT INTO saved_items (user_id, saveable_type, saveable_id)
        VALUES (toggle_product_like.user_id, 'product', toggle_product_like.product_id);
        
        UPDATE products
        SET likes = likes + 1
        WHERE id = toggle_product_like.product_id;
        
        RETURN TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
-- Trigger to update accommodation rating when reviews change
CREATE TRIGGER update_accommodation_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_accommodation_rating();

-- Trigger to ensure only one primary image per product
CREATE TRIGGER ensure_single_primary_product_image
BEFORE INSERT OR UPDATE ON product_images
FOR EACH ROW
EXECUTE FUNCTION ensure_single_primary_image();

-- Trigger to ensure only one primary image per accommodation
CREATE TRIGGER ensure_single_primary_accommodation_image
BEFORE INSERT OR UPDATE ON accommodation_images
FOR EACH ROW
EXECUTE FUNCTION ensure_single_primary_image();

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accommodations_updated_at
BEFORE UPDATE ON accommodations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON messages
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Set up Row Level Security (RLS) policies
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodation_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodation_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodation_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all active users"
ON users FOR SELECT
USING (status = 'active');

CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Admins can do everything with users"
ON users FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Universities policies
CREATE POLICY "Universities are viewable by everyone"
ON universities FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can modify universities"
ON universities FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Locations policies
CREATE POLICY "Locations are viewable by everyone"
ON locations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can modify locations"
ON locations FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Accommodation types policies
CREATE POLICY "Accommodation types are viewable by everyone"
ON accommodation_types FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can modify accommodation types"
ON accommodation_types FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Amenities policies
CREATE POLICY "Amenities are viewable by everyone"
ON amenities FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can modify amenities"
ON amenities FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Accommodations policies
CREATE POLICY "Accommodations are viewable by everyone if available or occupied"
ON accommodations FOR SELECT
TO authenticated
USING (status IN ('available', 'occupied') OR owner_id = auth.uid());

CREATE POLICY "Users can create their own accommodations"
ON accommodations FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own accommodations"
ON accommodations FOR UPDATE
USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own accommodations"
ON accommodations FOR DELETE
USING (owner_id = auth.uid());

CREATE POLICY "Admins can do everything with accommodations"
ON accommodations FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Accommodation amenities policies
CREATE POLICY "Accommodation amenities are viewable by everyone"
ON accommodation_amenities FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can manage amenities for their own accommodations"
ON accommodation_amenities FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM accommodations
        WHERE id = accommodation_id AND owner_id = auth.uid()
    )
);

CREATE POLICY "Admins can do everything with accommodation amenities"
ON accommodation_amenities FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Accommodation images policies
CREATE POLICY "Accommodation images are viewable by everyone"
ON accommodation_images FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can manage images for their own accommodations"
ON accommodation_images FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM accommodations
        WHERE id = accommodation_id AND owner_id = auth.uid()
    )
);

CREATE POLICY "Admins can do everything with accommodation images"
ON accommodation_images FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Product categories policies
CREATE POLICY "Product categories are viewable by everyone"
ON product_categories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can modify product categories"
ON product_categories FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Products policies
CREATE POLICY "Products are viewable by everyone if active or sold"
ON products FOR SELECT
TO authenticated
USING (status IN ('active', 'sold') OR seller_id = auth.uid());

CREATE POLICY "Users can create their own products"
ON products FOR INSERT
TO authenticated
WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Users can update their own products"
ON products FOR UPDATE
USING (seller_id = auth.uid());

CREATE POLICY "Users can delete their own products"
ON products FOR DELETE
USING (seller_id = auth.uid());

CREATE POLICY "Admins can do everything with products"
ON products FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Product images policies
CREATE POLICY "Product images are viewable by everyone"
ON product_images FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can manage images for their own products"
ON product_images FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM products
        WHERE id = product_id AND seller_id = auth.uid()
    )
);

CREATE POLICY "Admins can do everything with product images"
ON product_images FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Reviews policies
CREATE POLICY "Reviews are viewable by everyone"
ON reviews FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create their own reviews"
ON reviews FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own reviews"
ON reviews FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own reviews"
ON reviews FOR DELETE
USING (user_id = auth.uid());

CREATE POLICY "Admins can do everything with reviews"
ON reviews FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Messages policies
CREATE POLICY "Users can view messages they sent or received"
ON messages FOR SELECT
TO authenticated
USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send messages"
ON messages FOR INSERT
TO authenticated
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update messages they sent"
ON messages FOR UPDATE
USING (sender_id = auth.uid());

CREATE POLICY "Users can delete messages they sent or received"
ON messages FOR DELETE
USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Admins can do everything with messages"
ON messages FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Saved items policies
CREATE POLICY "Users can view their own saved items"
ON saved_items FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can save items"
ON saved_items FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own saved items"
ON saved_items FOR DELETE
USING (user_id = auth.uid());

CREATE POLICY "Admins can do everything with saved items"
ON saved_items FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Insert initial data
-- Insert universities
INSERT INTO universities (name, location) VALUES
('University of Zimbabwe', 'Harare'),
('National University of Science and Technology', 'Bulawayo'),
('Midlands State University', 'Gweru'),
('Harare Institute of Technology', 'Harare'),
('Chinhoyi University of Technology', 'Chinhoyi');

-- Insert locations
INSERT INTO locations (name, city) VALUES
('Mount Pleasant', 'Harare'),
('Avondale', 'Harare'),
('Bulawayo CBD', 'Bulawayo'),
('Senga', 'Gweru'),
('Mkoba', 'Gweru'),
('Hillside', 'Bulawayo'),
('Avenues', 'Harare'),
('Eastlea', 'Harare');

-- Insert accommodation types
INSERT INTO accommodation_types (name, description) VALUES
('Single Room', 'A room for one person'),
('Shared Room', 'A room shared by multiple people'),
('Studio Apartment', 'A self-contained small apartment'),
('1-Bedroom Apartment', 'An apartment with one bedroom'),
('2-Bedroom Apartment', 'An apartment with two bedrooms'),
('House', 'A full house');

-- Insert amenities
INSERT INTO amenities (name, icon) VALUES
('Wi-Fi', 'wifi'),
('Water', 'droplet'),
('Electricity', 'zap'),
('Security', 'shield'),
('Furnished', 'sofa'),
('Parking', 'car'),
('Laundry', 'shirt'),
('Kitchen', 'utensils');

-- Insert product categories
INSERT INTO product_categories (name, description) VALUES
('Textbooks', 'Academic textbooks and study materials'),
('Electronics', 'Electronic devices and accessories'),
('Furniture', 'Furniture for home or dorm'),
('Clothing', 'Clothing items and accessories'),
('Stationery', 'Stationery and office supplies'),
('Kitchen Appliances', 'Appliances for kitchen use'),
('Sports Equipment', 'Equipment for sports and fitness'),
('Other', 'Miscellaneous items');

-- Create storage buckets for images
INSERT INTO storage.buckets (id, name, public) VALUES 
('profile-images', 'Profile Images', true),
('accommodation-images', 'Accommodation Images', true),
('product-images', 'Product Images', true);

-- Set up storage policies
CREATE POLICY "Public profiles are viewable by everyone" 
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can upload their own profile image" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own profile image" 
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Accommodation images are viewable by everyone" 
ON storage.objects FOR SELECT
USING (bucket_id = 'accommodation-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can upload images to their own accommodations" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'accommodation-images' AND 
  EXISTS (
    SELECT 1 FROM accommodations
    WHERE id::text = (storage.foldername(name))[1] AND owner_id = auth.uid()
  )
);

CREATE POLICY "Product images are viewable by everyone" 
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can upload images to their own products" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' AND 
  EXISTS (
    SELECT 1 FROM products
    WHERE id::text = (storage.foldername(name))[1] AND seller_id = auth.uid()
  )
);