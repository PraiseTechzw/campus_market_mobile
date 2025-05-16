"use client"

import React from 'react'
import { StyleSheet, TouchableOpacity, Image, Dimensions } from "react-native"
import { Text, View } from "@/components/themed"
import { useRouter, Stack } from "expo-router"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"
import AuthGuard from "@/components/auth-guard"
import SafeAreaWrapper from "@/components/safe-area-wrapper"
import { MaterialIcons, Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { MotiView } from "moti"

const { width } = Dimensions.get("window")

export default function EventsCreateSelection() {
  const router = useRouter()
  const colorScheme = useColorScheme()

  return (
    <SafeAreaWrapper edges={["top", "left", "right"]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <AuthGuard requireAuth={true} requireOnboarding={false}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={24} color={Colors[colorScheme ?? "light"].text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Event</Text>
            <View style={styles.backButton} />
          </View>

          <View style={styles.content}>
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500 }}
              style={styles.titleContainer}
            >
              <Text style={styles.title}>How would you like to create your event?</Text>
              <Text style={styles.subtitle}>Choose a creation method that works best for you</Text>
            </MotiView>

            <View style={styles.options}>
              <MotiView
                from={{ opacity: 0, translateY: 20, scale: 0.9 }}
                animate={{ opacity: 1, translateY: 0, scale: 1 }}
                transition={{ type: 'timing', duration: 600, delay: 100 }}
              >
                <TouchableOpacity
                  style={styles.optionCard}
                  onPress={() => router.push('/events/create/quick')}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[Colors[colorScheme ?? "light"].tint, Colors[colorScheme ?? "light"].accent]}
                    style={styles.cardGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.cardIcon}>
                      <Ionicons name="flash" size={40} color="#fff" />
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={styles.cardTitle}>Quick Creation</Text>
                      <Text style={styles.cardDescription}>Create an event with essential details in just a few steps</Text>
                      <View style={styles.cardStats}>
                        <View style={styles.statItem}>
                          <Ionicons name="timer-outline" size={16} color="#fff" />
                          <Text style={styles.statText}>2 min</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Ionicons name="document-text-outline" size={16} color="#fff" />
                          <Text style={styles.statText}>Basic Info</Text>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </MotiView>

              <MotiView
                from={{ opacity: 0, translateY: 20, scale: 0.9 }}
                animate={{ opacity: 1, translateY: 0, scale: 1 }}
                transition={{ type: 'timing', duration: 600, delay: 200 }}
              >
                <TouchableOpacity
                  style={styles.optionCard}
                  onPress={() => router.push('/events/create/basic')}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#3b82f6', '#1d4ed8']}
                    style={styles.cardGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.cardIcon}>
                      <Ionicons name="calendar" size={40} color="#fff" />
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={styles.cardTitle}>Standard Creation</Text>
                      <Text style={styles.cardDescription}>Create a detailed event with full customization options</Text>
                      <View style={styles.cardStats}>
                        <View style={styles.statItem}>
                          <Ionicons name="timer-outline" size={16} color="#fff" />
                          <Text style={styles.statText}>5 min</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Ionicons name="options-outline" size={16} color="#fff" />
                          <Text style={styles.statText}>More Options</Text>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </MotiView>
            </View>
          </View>
        </View>
      </AuthGuard>
    </SafeAreaWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  titleContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  options: {
    gap: 20,
  },
  optionCard: {
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 8,
    height: 160,
  },
  cardGradient: {
    flexDirection: "row",
    borderRadius: 16,
    overflow: "hidden",
    padding: 20,
    height: "100%",
  },
  cardIcon: {
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
    width: 70,
    height: 70,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 35,
  },
  cardContent: {
    flex: 1,
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 16,
  },
  cardStats: {
    flexDirection: "row",
    gap: 16,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statText: {
    color: "#fff",
    fontSize: 13,
    marginLeft: 4,
  },
})
