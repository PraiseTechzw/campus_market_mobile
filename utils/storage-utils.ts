import { supabase } from "@/lib/supabase"
import * as ImageManipulator from "expo-image-manipulator"
import * as FileSystem from "expo-file-system"

// Maximum image size in bytes (1MB)
const MAX_IMAGE_SIZE = 1024 * 1024

/**
 * Uploads an image to Supabase Storage
 * @param uri Local URI of the image
 * @param bucket Storage bucket name
 * @param path Path within the bucket
 * @returns URL of the uploaded image
 */
export const uploadImage = async (uri: string, bucket: string, path: string): Promise<string> => {
  try {
    // Check if the image needs to be compressed
    const fileInfo = await FileSystem.getInfoAsync(uri)
    let compressedImage = { uri }

    if (fileInfo.size && fileInfo.size > MAX_IMAGE_SIZE) {
      // Compress the image
      compressedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1000 } }], // Resize to max width of 1000px
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
      )
    }

    // Convert image to base64
    const base64 = await FileSystem.readAsStringAsync(compressedImage.uri, {
      encoding: FileSystem.EncodingType.Base64,
    })

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage.from(bucket).upload(path, decode(base64), {
      contentType: "image/jpeg",
      upsert: true,
    })

    if (error) {
      console.error("Error uploading image:", error)
      throw error
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path)

    return publicUrlData.publicUrl
  } catch (error) {
    console.error("Error in uploadImage:", error)
    throw error
  }
}

/**
 * Deletes an image from Supabase Storage
 * @param url Public URL of the image
 * @param bucket Storage bucket name
 */
export const deleteImage = async (url: string, bucket: string): Promise<void> => {
  try {
    // Extract path from URL
    const path = url.split(`${bucket}/`)[1]

    if (!path) {
      console.error("Invalid image URL")
      return
    }

    // Delete from Supabase Storage
    const { error } = await supabase.storage.from(bucket).remove([path])

    if (error) {
      console.error("Error deleting image:", error)
      throw error
    }
  } catch (error) {
    console.error("Error in deleteImage:", error)
    throw error
  }
}

/**
 * Decode a base64 string to a Uint8Array
 */
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

/**
 * Helper function to convert a Blob to base64
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64String = reader.result as string
      resolve(base64String.split(",")[1]) // Remove the data URL prefix
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
