import { supabase } from "@/lib/supabase"
import type { UniversityTheme } from "@/types"

export async function getUniversityTheme(campusId: string | number) {
  try {
    const { data, error } = await supabase.from("university_themes").select("*").eq("campus_id", campusId).single()

    if (error) {
      if (error.code === "PGRST116") {
        // No theme found, return default theme
        return {
          id: "default",
          campus_id: campusId,
          primary_color: "#0891b2",
          secondary_color: "#06b6d4",
          accent_color: "#0e7490",
          created_at: new Date().toISOString(),
        } as UniversityTheme
      }
      throw error
    }

    return data as UniversityTheme
  } catch (error) {
    console.error("Error fetching university theme:", error)
    // Return default theme
    return {
      id: "default",
      campus_id: campusId,
      primary_color: "#0891b2",
      secondary_color: "#06b6d4",
      accent_color: "#0e7490",
      created_at: new Date().toISOString(),
    } as UniversityTheme
  }
}
