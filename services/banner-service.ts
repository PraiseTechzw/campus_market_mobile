import { supabase } from "@/lib/supabase"
import { getLocalBanners, saveLocalBanners } from "@/utils/storage"

export interface Banner {
  id: string
  title: string
  description: string
  imageUrl: string
  actionUrl: string
  type: "carousel" | "promotional"
}

export async function getBanners(isConnected: boolean): Promise<Banner[]> {
  try {
    if (isConnected) {
      // Online mode - fetch from Supabase
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("active", true)
        .gte("end_date", new Date().toISOString())
        .lte("start_date", new Date().toISOString())
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching banners:", error)
        throw error
      }

      // Transform data to Banner type
      const banners: Banner[] = data.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        imageUrl: item.image_url,
        actionUrl: item.action_url,
        type: item.type,
      }))

      // Save to local storage for offline access
      await saveLocalBanners(banners)

      return banners
    } else {
      // Offline mode - load from local storage
      return await getLocalBanners()
    }
  } catch (error) {
    console.error("Error in getBanners:", error)
    // Fallback to local storage in case of error
    return await getLocalBanners()
  }
}
