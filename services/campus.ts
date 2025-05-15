import { supabase } from "@/lib/supabase"
import type { Campus } from "@/types"

export async function getCampuses() {
  try {
    const { data, error } = await supabase.from("campuses").select("*").order("name")

    if (error) throw error

    return data as Campus[]
  } catch (error) {
    console.error("Error fetching campuses:", error)
    return []
  }
}

export async function getCampusById(id: string | number) {
  try {
    const { data, error } = await supabase.from("campuses").select("*").eq("id", id).single()

    if (error) throw error

    return data as Campus
  } catch (error) {
    console.error("Error fetching campus:", error)
    return null
  }
}
