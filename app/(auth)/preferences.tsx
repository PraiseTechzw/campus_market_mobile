"use client"

import { useState } from "react"
import { StyleSheet, View, Text, ScrollView, KeyboardAvoidingView, Platform } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { router } from "expo-router"
import { useTheme } from "@/providers/theme-provider"
import { useAuth } from "@/providers/auth-provider"
import { supabase } from "@/lib/supabase"
import Button from "@/components/button"
import TextInput from "@/components/text-input"
import Animated, { FadeIn } from "react-native-reanimated"
import Toast from "react-native-toast-message"

export default function PreferencesScreen() {
  const { colors } = useTheme()
  const { user, profile, updateProfile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [institution, setInstitution] = useState("")
  const [course, setCourse] = useState("")
  const [studyYear, setStudyYear] = useState("")
  const [major, setMajor] = useState("")

  const handleSubmit = async () => {
    if (!user) {
      Toast.show({
        type: "error",
        text1: "Not logged in",
        text2: "Please sign in to continue",
      })
      return
    }

    setIsLoading(true)
    try {
      // Update user profile
      await updateProfile({
        academic_info: {
          institution,
          course,
          study_year: studyYear,
          major,
        }
      })

      // Save preferences to user_settings
      const { error } = await supabase
        .from("user_settings")
        .update({
          preferences: {
            academicInfo: {
              institution,
              course,
              year: studyYear,
              major,
            }
          }
        })
        .eq("id", user.id)

      if (error) throw error

      Toast.show({
        type: "success",
        text1: "Preferences saved",
        text2: "Your information has been updated successfully",
      })

      // Redirect to home page
      router.replace("/")
    } catch (error) {
      console.error("Error saving preferences:", error)
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to save your preferences. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    router.replace("/")
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Tell us about yourself</Text>
            <Text style={[styles.subtitle, { color: colors.textDim }]}>
              This information helps us provide better recommendations for your campus needs
            </Text>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(200).duration(600)} style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Institution</Text>
              <TextInput
                placeholder="Your university or college"
                value={institution}
                onChangeText={setInstitution}
                containerStyle={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Program/Course</Text>
              <TextInput
                placeholder="Program you're enrolled in"
                value={course}
                onChangeText={setCourse}
                containerStyle={styles.input}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Year of Study</Text>
                <TextInput
                  placeholder="e.g. 1st, 2nd"
                  value={studyYear}
                  onChangeText={setStudyYear}
                  containerStyle={styles.input}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Major/Specialization</Text>
                <TextInput
                  placeholder="Your major"
                  value={major}
                  onChangeText={setMajor}
                  containerStyle={styles.input}
                />
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(400).duration(600)} style={styles.helpText}>
            <Text style={[styles.helpTextContent, { color: colors.textDim }]}>
              This information helps us connect you with relevant listings and services
              specific to your program and academic needs.
            </Text>
          </Animated.View>
        </ScrollView>

        <Animated.View 
          entering={FadeIn.delay(600).duration(600)}
          style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}
        >
          <Button 
            title="Skip for now" 
            variant="secondary" 
            onPress={handleSkip} 
            style={styles.skipButton} 
          />
          <Button 
            title="Save preferences" 
            onPress={handleSubmit} 
            loading={isLoading}
            fullWidth
          />
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    marginBottom: 0,
  },
  row: {
    flexDirection: "row",
    marginHorizontal: -8,
  },
  helpText: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  helpTextContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 24,
    borderTopWidth: 1,
  },
  skipButton: {
    marginBottom: 16,
  },
}) 