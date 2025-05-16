-- Additional tables for enhanced functionality

-- User preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    theme_preference TEXT DEFAULT 'system',
    notification_preferences JSONB DEFAULT '{"messages": true, "listings": true, "accommodations": true, "events": true}',
    language_preference TEXT DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    location TEXT NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    campus_id UUID REFERENCES public.campuses(id) ON DELETE CASCADE,
    organizer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    image_url TEXT,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event participants
CREATE TABLE IF NOT EXISTS public.event_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('going', 'interested', 'not_going')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    type TEXT NOT NULL CHECK (type IN ('message', 'listing', 'accommodation', 'event', 'system')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports table for content moderation
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
    accommodation_id UUID REFERENCES public.accommodations(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT reports_content_check CHECK (
        (listing_id IS NOT NULL AND accommodation_id IS NULL AND user_id IS NULL) OR
        (listing_id IS NULL AND accommodation_id IS NOT NULL AND user_id IS NULL) OR
        (listing_id IS NULL AND accommodation_id IS NULL AND user_id IS NOT NULL)
    )
);

-- Analytics events table
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    event_name TEXT NOT NULL,
    event_data JSONB,
    device_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_events_campus_id ON public.events(campus_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON public.event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON public.event_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON public.analytics_events(event_name);

-- ADD RLS POLICIES FOR TABLES

-- Enable RLS on events table
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all events
CREATE POLICY "Allow authenticated users to view events"
ON public.events
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert events
CREATE POLICY "Allow authenticated users to insert events"
ON public.events
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to update and delete their own events
CREATE POLICY "Allow users to update their own events"
ON public.events
FOR UPDATE
TO authenticated
USING (organizer_id = auth.uid());

CREATE POLICY "Allow users to delete their own events"
ON public.events
FOR DELETE
TO authenticated
USING (organizer_id = auth.uid());

-- Allow anonymous users to view events (optional)
CREATE POLICY "Allow anonymous users to view events"
ON public.events
FOR SELECT
TO anon
USING (true);

-- Enable RLS on event_participants table
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to see all event participants
CREATE POLICY "Allow authenticated users to view event participants"
ON public.event_participants
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to join events
CREATE POLICY "Allow authenticated users to join events"
ON public.event_participants
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow users to update their own event participation
CREATE POLICY "Allow users to update their own event participation"
ON public.event_participants
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Allow users to remove themselves from events
CREATE POLICY "Allow users to remove themselves from events"
ON public.event_participants
FOR DELETE
TO authenticated
USING (user_id = auth.uid());
