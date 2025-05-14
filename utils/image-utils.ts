import * as ImageManipulator from "expo-image-manipulator"

export const compressImage = async (uri: string): Promise<string> => {
  try {
    const result = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 1000 } }], {
      compress: 0.7,
      format: ImageManipulator.SaveFormat.JPEG,
    })
    return result.uri
  } catch (error) {
    console.error("Error compressing image:", error)
    return uri
  }
}

export const resizeImage = async (uri: string, width: number, height: number): Promise<string> => {
  try {
    const result = await ImageManipulator.manipulateAsync(uri, [{ resize: { width, height } }], {
      compress: 0.8,
      format: ImageManipulator.SaveFormat.JPEG,
    })
    return result.uri
  } catch (error) {
    console.error("Error resizing image:", error)
    return uri
  }
}

export const cropImage = async (
  uri: string,
  crop: { originX: number; originY: number; width: number; height: number },
): Promise<string> => {
  try {
    const result = await ImageManipulator.manipulateAsync(uri, [{ crop }], {
      compress: 0.8,
      format: ImageManipulator.SaveFormat.JPEG,
    })
    return result.uri
  } catch (error) {
    console.error("Error cropping image:", error)
    return uri
  }
}
