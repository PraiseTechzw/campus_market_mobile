export type Campus = {
  id: string | number
  name: string
  location: string
}

export type ListingCategory = {
  id: string | number
  name: string
  icon?: string
}

export type Listing = {
  id: string | number
  user_id: string
  title: string
  description: string
  price: number
  category_id: string | number
  condition: "new" | "like_new" | "good" | "fair" | "poor"
  location: string
  campus_id?: string | number
  images: string[]
  is_sold: boolean
  created_at: string
  updated_at: string
}

export type AccommodationType = {
  id: string | number
  name: string
  description?: string
}

export type Accommodation = {
  id: string | number
  user_id: string
  title: string
  description: string
  rent: number
  type_id: string | number
  bedrooms: number
  bathrooms: number
  address: string
  campus_id?: string | number
  amenities: string[]
  rules?: string[]
  images: string[]
  is_available: boolean
  created_at: string
  updated_at: string
}

export type Profile = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  avatar_url?: string
  student_id_url?: string
  verification_status?: "pending" | "verified" | "rejected"
  is_verified: boolean
  campus_id?: string | number
  push_token?: string
  created_at: string
  updated_at: string
}

export type Conversation = {
  id: string | number
  other_user: {
    id: string
    first_name: string
    last_name: string
    avatar_url?: string
  }
  last_message?: Message
  unread_count: number
  listing?: {
    id: string | number
    title: string
  }
  created_at: string
  updated_at: string
}

export type Message = {
  id: string | number
  conversation_id: string | number
  sender_id: string
  receiver_id: string
  content: string
  read: boolean
  created_at: string
}

export type Review = {
  id: string | number
  reviewer_id: string
  reviewee_id: string
  listing_id?: string | number
  accommodation_id?: string | number
  rating: number
  comment?: string
  created_at: string
  updated_at: string
  reviewer?: {
    first_name: string
    last_name: string
    avatar_url?: string
  }
}

export type Favorite = {
  id: string | number
  user_id: string
  listing_id?: string | number
  accommodation_id?: string | number
  created_at: string
  listing?: Listing
  accommodation?: Accommodation
}

export type UserInterest = {
  id: string | number
  user_id: string
  category_id?: string | number
  accommodation_type_id?: string | number
  created_at: string
  category?: ListingCategory
  accommodation_type?: AccommodationType
}

export type UniversityTheme = {
  id: string | number
  campus_id: string | number
  primary_color: string
  secondary_color: string
  accent_color: string
  created_at: string
}

export type ActivityFeedItem = {
  id: string | number
  campus_id?: string | number
  listing_id?: string | number
  accommodation_id?: string | number
  activity_type: "new_listing" | "price_drop" | "new_accommodation" | "rent_drop" | "event" | "announcement"
  title: string
  description?: string
  created_at: string
  listing?: Listing
  accommodation?: Accommodation
}
