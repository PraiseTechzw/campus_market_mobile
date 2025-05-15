"use client"
import { StyleSheet, View, TouchableOpacity, ScrollView } from "react-native"
import { Text } from "@/components/themed"
import { useToast } from "@/providers/toast-provider"
import { Stack, useRouter } from "expo-router"
import { MaterialIcons } from "@expo/vector-icons"
import Colors from "@/constants/Colors"
import { useColorScheme } from "@/hooks/use-color-scheme"

export default function DemoToastScreen() {
  const { showToast } = useToast()
  const router = useRouter()
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? "light"]

  const showSuccessToast = () => {
    showToast("Operation completed successfully!", "success")
  }

  const showErrorToast = () => {
    showToast("An error occurred. Please try again.", "error")
  }

  const showInfoToast = () => {
    showToast("Here's some information for you.", "info")
  }

  const showWarningToast = () => {
    showToast("Warning: This action cannot be undone.", "warning")
  }

  const showLongToast = () => {
    showToast(
      "This is a very long toast message that will demonstrate how the toast handles multiple lines of text. It should wrap properly and still look good.",
      "info",
      5000,
    )
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Toast Notifications",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color={colors.tint} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Toast Notification Demo</Text>
        <Text style={styles.description}>
          Tap the buttons below to see different types of toast notifications in action.
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.success }]} onPress={showSuccessToast}>
            <MaterialIcons name="check-circle" size={24} color="white" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Success Toast</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, { backgroundColor: colors.error }]} onPress={showErrorToast}>
            <MaterialIcons name="error" size={24} color="white" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Error Toast</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, { backgroundColor: colors.info }]} onPress={showInfoToast}>
            <MaterialIcons name="info" size={24} color="white" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Info Toast</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, { backgroundColor: colors.warning }]} onPress={showWarningToast}>
            <MaterialIcons name="warning" size={24} color="white" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Warning Toast</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={showLongToast}>
            <MaterialIcons name="text-fields" size={24} color="white" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Long Text Toast</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <MaterialIcons name="lightbulb" size={24} color={colors.tint} style={styles.infoIcon} />
          <Text style={styles.infoText}>
            These toast notifications are customizable and can be used throughout the app to provide feedback to users.
            They automatically dismiss after a few seconds or can be dismissed by tapping the close button.
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  backButton: {
    marginLeft: 16,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#10b981",
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
    color: "#666",
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 24,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#10b981",
  },
  buttonIcon: {
    marginRight: 12,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#f0f9ff",
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#10b981",
  },
  infoIcon: {
    marginRight: 12,
    alignSelf: "flex-start",
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
})
