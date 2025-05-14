"use client"
import { StyleSheet, View, Text, TouchableOpacity } from "react-native"
import { useTheme } from "@/providers/theme-provider"
import { MaterialIcons } from "@expo/vector-icons"
import type { Banner } from "@/types"
import Card from "./card"

interface PromotionalBannerProps {
  banner: Banner
  onPress?: (banner: Banner) => void
}

export default function PromotionalBanner({ banner, onPress }: PromotionalBannerProps) {
  const { colors } = useTheme()

  const handlePress = () => {
    if (onPress) {
      onPress(banner)
    }
  }

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={handlePress}>
      <Card variant="elevated" style={[styles.container, { backgroundColor: banner.bgColor || colors.tint }]}>
        <View style={styles.content}>
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: banner.textColor || "#FFFFFF" }]}>{banner.title}</Text>
            {banner.description && (
              <Text style={[styles.description, { color: banner.textColor || "#FFFFFF" }]}>{banner.description}</Text>
            )}
            {banner.buttonText && (
              <View style={[styles.button, { backgroundColor: banner.buttonBgColor || "#FFFFFF" }]}>
                <Text style={[styles.buttonText, { color: banner.buttonTextColor || colors.tint }]}>
                  {banner.buttonText}
                </Text>
              </View>
            )}
          </View>

          {banner.iconName && (
            <View style={styles.iconContainer}>
              <MaterialIcons
                name={banner.iconName as keyof typeof MaterialIcons.glyphMap}
                size={48}
                color={banner.iconColor || "#FFFFFF"}
              />
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 22,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 3,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: 'Poppins-Bold',
    marginBottom: 6,
  },
  description: {
    fontSize: 15,
    fontFamily: 'Poppins-Regular',
    marginBottom: 10,
  },
  button: {
    alignSelf: "flex-start",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 1,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: "bold",
    fontFamily: 'Poppins-SemiBold',
  },
  iconContainer: {
    marginLeft: 18,
  },
})
