"use client"
import { StyleSheet, TouchableOpacity } from "react-native"
import { Text, View } from "@/components/themed"
import { useSession } from "@/providers/session-provider"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { useToast } from "@/providers/toast-provider"
import { MaterialIcons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import Colors from "@/constants/Colors"
import AuthGuard from "@/components/auth-guard"

export default function CreateListingScreen() {
  return (
    <AuthGuard requireAuth={true} requireOnboarding={false}>
      <CreateListingContent />
    </AuthGuard>
  )
}

function CreateListingContent() {
  const { session } = useSession()
  const colorScheme = useColorScheme()
  const toast = useToast()
  const router = useRouter()

  const handleStartBasic = () => {
    router.push("/marketplace/create/basic")
  }

  const handleStartQuick = () => {
    router.push("/marketplace/create/quick")
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={Colors[colorScheme ?? "light"].text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Listing</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Sell your items</Text>
        <Text style={styles.subtitle}>Choose how you want to create your listing</Text>

        <TouchableOpacity style={styles.optionCard} onPress={handleStartBasic}>
          <View style={styles.optionIconContainer}>
            <MaterialIcons name="list-alt" size={32} color="#fff" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Step-by-Step</Text>
            <Text style={styles.optionDescription}>
              Create your listing with a guided process. Best for first-time sellers or detailed items.
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionCard} onPress={handleStartQuick}>
          <View style={[styles.optionIconContainer, { backgroundColor: "#f59e0b" }]}>
            <MaterialIcons name="flash-on" size={32} color="#fff" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Quick Listing</Text>
            <Text style={styles.optionDescription}>
              Create a simple listing in one go. Best for experienced sellers or simple items.
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#999" />
        </TouchableOpacity>

        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Tips for successful listings:</Text>
          <View style={styles.tipItem}>
            <MaterialIcons name="photo-camera" size={20} color={Colors[colorScheme ?? "light"].tint} />
            <Text style={styles.tipText}>Add clear photos from multiple angles</Text>
          </View>
          <View style={styles.tipItem}>
            <MaterialIcons name="description" size={20} color={Colors[colorScheme ?? "light"].tint} />
            <Text style={styles.tipText}>Write detailed descriptions</Text>
          </View>
          <View style={styles.tipItem}>
            <MaterialIcons name="attach-money" size={20} color={Colors[colorScheme ?? "light"].tint} />
            <Text style={styles.tipText}>Set a fair price</Text>
          </View>
          <View style={styles.tipItem}>
            <MaterialIcons name="category" size={20} color={Colors[colorScheme ?? "light"].tint} />
            <Text style={styles.tipText}>Choose the right category</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 32,
    textAlign: "center",
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  optionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.light.tint,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: "#666",
  },
  tipsContainer: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
})
