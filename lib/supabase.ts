import { createClient } from "@supabase/supabase-js"
import * as SecureStore from "expo-secure-store"

// Debug utility for storage
const DEBUG_STORAGE = false // Set to true to enable storage debugging

function logStorageSize(operation: string, key: string, value?: string) {
  if (!DEBUG_STORAGE) return
  
  if (value) {
    const size = new Blob([value]).size
    console.log(`SecureStore ${operation} - Key: ${key}, Size: ${size} bytes${size > 2048 ? ' (EXCEEDS LIMIT!)' : ''}`)
  } else {
    console.log(`SecureStore ${operation} - Key: ${key}`)
  }
}

// SecureStore adapter for Supabase auth persistence
const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    const value = await SecureStore.getItemAsync(key)
    logStorageSize('getItem', key, value || undefined)
    if (!value) return null
    
    try {
      // Check if the value is compressed (starts with "compressed:")
      if (value.startsWith('compressed:')) {
        // Check if this is a chunked value
        if (value.startsWith('compressed:CHUNKS:')) {
          // Extract number of chunks
          const chunksCount = parseInt(value.substring('compressed:CHUNKS:'.length))
          
          // Retrieve all chunks and join them
          const chunks = []
          for (let i = 0; i < chunksCount; i++) {
            const chunkKey = `${key}:chunk:${i}`
            const chunkValue = await SecureStore.getItemAsync(chunkKey)
            logStorageSize('getItem:chunk', chunkKey, chunkValue || undefined)
            if (chunkValue) {
              chunks.push(chunkValue)
            } else {
              console.warn(`Missing chunk ${i} for key ${key}`)
            }
          }
          
          const result = chunks.join('')
          logStorageSize('getItem:reassembled', key, result)
          return result
        }
        
        // Remove the prefix for non-chunked compressed data
        return value.substring('compressed:'.length)
      }
      
      // Return original value if not compressed
      return value
    } catch (error) {
      console.error('Error retrieving stored value:', error)
      return value
    }
  },
  setItem: async (key: string, value: string) => {
    logStorageSize('setItem', key, value)
    
    try {
      // Check if value exceeds SecureStore size limit (2048 bytes)
      if (value.length > 2000) {
        // Add prefix to indicate the value is compressed
        const compressedValue = 'compressed:' + value
        logStorageSize('setItem:compressed', key, compressedValue)
        
        // If still too large, split into chunks
        if (compressedValue.length > 2000) {
          const chunkSize = 1900 // Leave room for chunk metadata
          const chunks = []
          let i = 0
          
          while (i < value.length) {
            chunks.push(value.substring(i, i + chunkSize))
            i += chunkSize
          }
          
          // Store each chunk separately with a key pattern
          for (let j = 0; j < chunks.length; j++) {
            const chunkKey = `${key}:chunk:${j}`
            logStorageSize('setItem:chunk', chunkKey, chunks[j])
            await SecureStore.setItemAsync(chunkKey, chunks[j])
          }
          
          // Store the main entry with metadata about chunks
          const metaValue = `compressed:CHUNKS:${chunks.length}`
          logStorageSize('setItem:meta', key, metaValue)
          await SecureStore.setItemAsync(key, metaValue)
          return
        }
        
        return SecureStore.setItemAsync(key, compressedValue)
      }
      
      // If the value is small enough, store it directly
      return SecureStore.setItemAsync(key, value)
    } catch (error) {
      console.error('Error compressing value for storage:', error)
      return SecureStore.setItemAsync(key, value)
    }
  },
  removeItem: async (key: string) => {
    logStorageSize('removeItem', key)
    
    try {
      // First check if this is a chunked item
      const value = await SecureStore.getItemAsync(key)
      if (value && value.startsWith('compressed:CHUNKS:')) {
        // Extract number of chunks
        const chunksCount = parseInt(value.substring('compressed:CHUNKS:'.length))
        
        // Delete all chunks
        for (let i = 0; i < chunksCount; i++) {
          const chunkKey = `${key}:chunk:${i}`
          logStorageSize('removeItem:chunk', chunkKey)
          await SecureStore.deleteItemAsync(chunkKey)
        }
      }
      
      // Delete the main key
      return SecureStore.deleteItemAsync(key)
    } catch (error) {
      console.error('Error removing stored item:', error)
      return SecureStore.deleteItemAsync(key)
    }
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
  accommodation_types: {
    id: string
    name: string
    description: string | null
    icon: string
    created_at: string
    updated_at: string
  }
  accommodation_amenities: {
    id: string
    name: string
    icon: string
    category: "essential" | "feature" | "safety" | "location"
    created_at: string
    updated_at: string
  }
  accommodation_listings: {
    id: string
    title: string
    description: string
    owner_id: string
    type_id: string
    amenities: string[]
    price_per_month: number
    security_deposit: number | null
    bedrooms: number
    bathrooms: number
    max_occupants: number
    address: string
    location_lat: number | null
    location_lng: number | null
    images: string[]
    available_from: string
    minimum_stay_months: number
    is_furnished: boolean
    is_verified: boolean
    is_active: boolean
    featured: boolean
    created_at: string
    updated_at: string
  }
  accommodation_bookings: {
    id: string
    listing_id: string
    tenant_id: string
    owner_id: string
    status: "pending" | "approved" | "rejected" | "cancelled" | "completed"
    move_in_date: string
    move_out_date: string | null
    monthly_rent: number
    security_deposit: number | null
    is_deposit_paid: boolean
    special_requests: string | null
    created_at: string
    updated_at: string
  }
  accommodation_reviews: {
    id: string
    listing_id: string
    reviewer_id: string
    booking_id: string | null
    rating: number
    review_text: string | null
    created_at: string
  }
}
