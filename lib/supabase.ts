import AsyncStorage from "@react-native-async-storage/async-storage"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"
import Constants from "expo-constants"

// Initialize Supabase with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || Constants.expoConfig?.extra?.supabaseUrl || "https://ekatrgycippkvhgymgtw.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || Constants.expoConfig?.extra?.supabaseAnonKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrYXRyZ3ljaXBwa3ZoZ3ltZ3R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMDQyOTIsImV4cCI6MjA2Mjg4MDI5Mn0.dcPv7YBj3Fe0MwJz02voaz0LtkbCh2nQ29Xjv8MsKnY"

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
