# Technical Documentation

## Architecture Overview

Campus Market is built using a modern tech stack with React Native and Supabase. The application follows a client-server architecture where the client is a React Native mobile app and the server is powered by Supabase's backend-as-a-service platform.

### Frontend Architecture

The frontend is built using:
- React Native with Expo for cross-platform mobile development
- TypeScript for type safety
- React Query for state management and data fetching
- Expo Router for navigation
- Moti for animations
- React Native StyleSheet for styling

### Backend Architecture

The backend is powered by Supabase, which provides:
- PostgreSQL database
- Authentication services
- Real-time subscriptions
- Storage for images and files
- Edge Functions for serverless computing

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Listings Table
```sql
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  category TEXT,
  condition TEXT,
  images TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Messages Table
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id),
  sender_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Authentication Flow

1. User signs up/logs in using email and password
2. Supabase Auth handles the authentication
3. JWT token is stored securely on the device
4. Token is used for subsequent API requests

## Real-time Features

The application uses Supabase's real-time subscriptions for:
- New messages
- Listing updates
- User status changes
- Price changes

## Image Upload Flow

1. User selects image(s)
2. Images are compressed client-side
3. Uploaded to Supabase Storage
4. URLs are stored in the database
5. Images are served through Supabase CDN

## Security Measures

- Row Level Security (RLS) policies in Supabase
- JWT token authentication
- Input validation
- Image upload restrictions
- Rate limiting
- XSS protection

## Performance Optimizations

- Image compression
- Lazy loading
- Pagination
- Caching with React Query
- Optimistic updates
- Background data prefetching

## Testing Strategy

- Unit tests for utility functions
- Component tests for UI elements
- Integration tests for features
- E2E tests for critical flows

## Deployment

The application is deployed using:
- Expo EAS for mobile app builds
- Supabase for backend services
- GitHub Actions for CI/CD

## Monitoring and Analytics

- Error tracking with Sentry
- Performance monitoring
- User analytics
- Crash reporting

## Future Improvements

- Offline support
- Push notifications
- Payment integration
- Social features
- Advanced search
- AI-powered recommendations 