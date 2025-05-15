import { supabase } from "@/lib/supabase"
import type { Profile } from "@/types"

export async function getUserProfile() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) throw new Error("User not authenticated")

    const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (error) throw error

    return data as Profile
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return null
  }
}

export async function updateUserProfile(updates: Partial<Profile>) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) throw new Error("User not authenticated")

    const { data, error } = await supabase
      .from("profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single()

    if (error) throw error

    return data as Profile
  } catch (error) {
    console.error("Error updating user profile:", error)
    throw error
  }
}

export async function uploadStudentId(fileUri: string) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) throw new Error("User not authenticated")

    // Convert image to blob
    const response = await fetch(fileUri)
    const blob = await response.blob()

    // Upload to Supabase Storage
    const fileExt = fileUri.split(".").pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = `student_ids/${fileName}`

    const { error: uploadError } = await supabase.storage.from("verifications").upload(filePath, blob)

    if (uploadError) throw uploadError

    // Get public URL
    const { data } = supabase.storage.from("verifications").getPublicUrl(filePath)

    // Update profile with student ID URL and set verification status to pending
    if (data) {
      await updateUserProfile({
        student_id_url: data.publicUrl,
        verification_status: "pending",
      })
    }

    return true
  } catch (error) {
    console.error("Error uploading student ID:", error)
    throw error
  }
}
