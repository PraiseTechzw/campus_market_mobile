"use client"

import { View, Text } from "react-native"
import { useLocalSearchParams } from "expo-router"
import { useTheme } from "@/providers/theme-provider"

export default function ProfileScreen() {
  const { id } = useLocalSearchParams()
  const { colors } = useTheme()

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>Profile {id}</Text>
    </View>
  )
} 