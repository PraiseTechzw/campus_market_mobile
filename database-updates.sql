-- Create tables for new features

-- Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
    accommodation_id UUID REFERENCES public.accommodations(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
    accommodation_id UUID REFERENCES public.accommodations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT favorites_content_check CHECK (
        (listing_id IS NULL AND accommodation_id IS NOT NULL) OR
        (listing_id IS NOT NULL AND accommodation_id IS NULL)
    )
);

-- User interests table
CREATE TABLE IF NOT EXISTS public.user_interests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.listing_categories(id) ON DELETE CASCADE,
    accommodation_type_id UUID REFERENCES public.accommodation_types(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT user_interests_content_check CHECK (
        (category_id IS NULL AND accommodation_type_id IS NOT NULL) OR
        (category_id IS NOT NULL AND accommodation_type_id IS NULL)
    )
);

-- University themes table
CREATE TABLE IF NOT EXISTS public.university_themes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campus_id UUID NOT NULL REFERENCES public.campuses(id) ON DELETE CASCADE,
    primary_color TEXT NOT NULL,
    secondary_color TEXT NOT NULL,
    accent_color TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity feed items table
CREATE TABLE IF NOT EXISTS public.activity_feed (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campus_id UUID REFERENCES public.campuses(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
    accommodation_id UUID REFERENCES public.accommodations(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('new_listing', 'price_drop', 'new_accommodation', 'rent_drop', 'event', 'announcement')),
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT activity_feed_content_check CHECK (
        (listing_id IS NOT NULL AND accommodation_id IS NULL) OR
        (listing_id IS NULL AND accommodation_id IS NOT NULL) OR
        (listing_id IS NULL AND accommodation_id IS NULL)
    )
);

-- Insert sample university themes
INSERT INTO public.university_themes (campus_id, primary_color, secondary_color, accent_color)
SELECT id, '#0891b2', '#06b6d4', '#0e7490'
FROM public.campuses
WHERE name = 'University of Zimbabwe'
ON CONFLICT DO NOTHING;

INSERT INTO public.university_themes (campus_id, primary_color, secondary_color, accent_color)
SELECT id, '#7c3aed', '#8b5cf6', '#6d28d9'
FROM public.campuses
WHERE name = 'National University of Science and Technology'
ON CONFLICT DO NOTHING;

INSERT INTO public.university_themes (campus_id, primary_color, secondary_color, accent_color)
SELECT id, '#059669', '#10b981', '#047857'
FROM public.campuses
WHERE name = 'Midlands State University'
ON CONFLICT DO NOTHING;

INSERT INTO public.university_themes (campus_id, primary_color, secondary_color, accent_color)
SELECT id, '#d97706', '#f59e0b', '#b45309'
FROM public.campuses
WHERE name = 'Chinhoyi University of Technology'
ON CONFLICT DO NOTHING;

INSERT INTO public.university_themes (campus_id, primary_color, secondary_color, accent_color)
SELECT id, '#be123c', '#e11d48', '#9f1239'
FROM public.campuses
WHERE name = 'Great Zimbabwe University'
ON CONFLICT DO NOTHING;
