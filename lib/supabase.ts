import { createClient } from "@supabase/supabase-js"
import * as SecureStore from "expo-secure-store"

// SecureStore adapter for Supabase auth persistence
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key)
  },
  setItem: (key: string, value: string) => {
    return SecureStore.setItemAsync(key, value)
  },
  removeItem: (key: string) => {
    return SecureStore.deleteItemAsync(key)
  },
}

// Get Supabase URL and anon key from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string || "https://ogstoggnqeuljorzulbj.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nc3RvZ2ducWV1bGpvcnp1bGJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMzI3OTUsImV4cCI6MjA2MjcwODc5NX0.PtLBIcIi_gU7chDELTU1hbtxjlPG3SrvA6WTzJBzlZ8"

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Database types
export type Tables = {
  users: {
    id: string
    email: string
    first_name: string
    last_name: string
    role: "student" | "admin"
    is_verified: boolean
    profile_picture: string | null
    created_at: string
    rating: number | null
    bio: string | null
  }
  products: {
    id: string
    name: string
    price: number
    description: string
    category_id: string
    condition: "new" | "like_new" | "good" | "used" | "worn"
    images: string[]
    tags: string[]
    is_negotiable: boolean
    is_urgent: boolean
    seller_id: string
    created_at: string
    updated_at: string
    featured: boolean
  }
  categories: {
    id: string
    name: string
    icon: string
  }
  orders: {
    id: string
    product_id: string
    buyer_id: string
    seller_id: string
    status: "pending" | "confirmed" | "delivered" | "cancelled"
    price: number
    payment_method: string
    delivery_address: string | null
    delivery_notes: string | null
    created_at: string
    updated_at: string
  }
  conversations: {
    id: string
    participants: string[]
    product_id: string | null
    created_at: string
  }
  messages: {
    id: string
    conversation_id: string
    sender_id: string
    text: string
    timestamp: string
    read: boolean
  }
  banners: {
    id: string
    title: string
    description: string
    image_url: string
    action_url: string
    active: boolean
    start_date: string
    end_date: string
    created_at: string
  }
}
