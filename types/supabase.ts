export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          avatar_url: string | null
          student_id_url: string | null
          verification_status: string | null
          is_verified: boolean
          campus_id: string | null
          push_token: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name: string
          last_name: string
          email: string
          phone?: string | null
          avatar_url?: string | null
          student_id_url?: string | null
          verification_status?: string | null
          is_verified?: boolean
          campus_id?: string | null
          push_token?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string | null
          avatar_url?: string | null
          student_id_url?: string | null
          verification_status?: string | null
          is_verified?: boolean
          campus_id?: string | null
          push_token?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      campuses: {
        Row: {
          id: string
          name: string
          location: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          location: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          location?: string
          created_at?: string
        }
      }
      listing_categories: {
        Row: {
          id: string
          name: string
          icon: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          icon?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          icon?: string | null
          created_at?: string
        }
      }
      listings: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          price: number
          category_id: string | null
          condition: string | null
          location: string
          campus_id: string | null
          images: string[] | null
          is_sold: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description: string
          price: number
          category_id?: string | null
          condition?: string | null
          location: string
          campus_id?: string | null
          images?: string[] | null
          is_sold?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          price?: number
          category_id?: string | null
          condition?: string | null
          location?: string
          campus_id?: string | null
          images?: string[] | null
          is_sold?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      accommodation_types: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
      }
      accommodations: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          rent: number
          type_id: string | null
          bedrooms: number
          bathrooms: number
          address: string
          campus_id: string | null
          amenities: string[] | null
          rules: string[] | null
          images: string[] | null
          is_available: boolean
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description: string
          rent: number
          type_id?: string | null
          bedrooms: number
          bathrooms: number
          address: string
          campus_id?: string | null
          amenities?: string[] | null
          rules?: string[] | null
          images?: string[] | null
          is_available?: boolean
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          rent?: number
          type_id?: string | null
          bedrooms?: number
          bathrooms?: number
          address?: string
          campus_id?: string | null
          amenities?: string[] | null
          rules?: string[] | null
          images?: string[] | null
          is_available?: boolean
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          participant1_id: string
          participant2_id: string
          listing_id: string | null
          accommodation_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          participant1_id: string
          participant2_id: string
          listing_id?: string | null
          accommodation_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          participant1_id?: string
          participant2_id?: string
          listing_id?: string | null
          accommodation_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          receiver_id: string
          content: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          receiver_id: string
          content: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          receiver_id?: string
          content?: string
          read?: boolean
          created_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          accommodation_id: string
          user_id: string
          start_date: string
          end_date: string | null
          status: string
          payment_status: string
          payment_method: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          accommodation_id: string
          user_id: string
          start_date: string
          end_date?: string | null
          status?: string
          payment_status?: string
          payment_method?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          accommodation_id?: string
          user_id?: string
          start_date?: string
          end_date?: string | null
          status?: string
          payment_status?: string
          payment_method?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          reviewer_id: string
          reviewee_id: string
          listing_id: string | null
          accommodation_id: string | null
          rating: number
          comment: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reviewer_id: string
          reviewee_id: string
          listing_id?: string | null
          accommodation_id?: string | null
          rating: number
          comment?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reviewer_id?: string
          reviewee_id?: string
          listing_id?: string | null
          accommodation_id?: string | null
          rating?: number
          comment?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          listing_id: string | null
          accommodation_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          listing_id?: string | null
          accommodation_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          listing_id?: string | null
          accommodation_id?: string | null
          created_at?: string
        }
      }
      user_interests: {
        Row: {
          id: string
          user_id: string
          category_id: string | null
          accommodation_type_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id?: string | null
          accommodation_type_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string | null
          accommodation_type_id?: string | null
          created_at?: string
        }
      }
      university_themes: {
        Row: {
          id: string
          campus_id: string
          primary_color: string
          secondary_color: string
          accent_color: string
          created_at: string
        }
        Insert: {
          id?: string
          campus_id: string
          primary_color: string
          secondary_color: string
          accent_color: string
          created_at?: string
        }
        Update: {
          id?: string
          campus_id?: string
          primary_color?: string
          secondary_color?: string
          accent_color?: string
          created_at?: string
        }
      }
      activity_feed: {
        Row: {
          id: string
          campus_id: string | null
          listing_id: string | null
          accommodation_id: string | null
          activity_type: string
          title: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          campus_id?: string | null
          listing_id?: string | null
          accommodation_id?: string | null
          activity_type: string
          title: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          campus_id?: string | null
          listing_id?: string | null
          accommodation_id?: string | null
          activity_type?: string
          title?: string
          description?: string | null
          created_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          theme_preference: string
          notification_preferences: Json
          language_preference: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          theme_preference?: string
          notification_preferences?: Json
          language_preference?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          theme_preference?: string
          notification_preferences?: Json
          language_preference?: string
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          location: string
          start_date: string
          end_date: string | null
          campus_id: string | null
          organizer_id: string | null
          image_url: string | null
          is_featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          location: string
          start_date: string
          end_date?: string | null
          campus_id?: string | null
          organizer_id?: string | null
          image_url?: string | null
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          location?: string
          start_date?: string
          end_date?: string | null
          campus_id?: string | null
          organizer_id?: string | null
          image_url?: string | null
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      event_participants: {
        Row: {
          id: string
          event_id: string
          user_id: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          status: string
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          status?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          body: string
          data: Json | null
          is_read: boolean
          type: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          body: string
          data?: Json | null
          is_read?: boolean
          type: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          body?: string
          data?: Json | null
          is_read?: boolean
          type?: string
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          listing_id: string | null
          accommodation_id: string | null
          user_id: string | null
          reason: string
          details: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          listing_id?: string | null
          accommodation_id?: string | null
          user_id?: string | null
          reason: string
          details?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          listing_id?: string | null
          accommodation_id?: string | null
          user_id?: string | null
          reason?: string
          details?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      analytics_events: {
        Row: {
          id: string
          user_id: string | null
          event_name: string
          event_data: Json | null
          device_info: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          event_name: string
          event_data?: Json | null
          device_info?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          event_name?: string
          event_data?: Json | null
          device_info?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      participants: {
        Row: {
          conversation_id: string
          user_id: string
          first_name: string
          last_name: string
          avatar_url: string | null
        }
      }
    }
    Functions: {
      handle_new_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
  }
}
