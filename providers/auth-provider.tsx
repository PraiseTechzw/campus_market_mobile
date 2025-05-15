"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { Session, User, AuthError, AuthResponse } from "@supabase/supabase-js"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as Linking from "expo-linking"
import { router } from "expo-router"
import Toast from "react-native-toast-message"

export interface UserProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  phone: string | null
  avatar_url: string | null
  bio: string | null
  rating: number | null
  role: "student" | "admin"
  is_verified: boolean
  is_seller: boolean
  created_at: string
  updated_at: string
  academic_info?: {
    institution?: string
    course?: string
    study_year?: string
    major?: string
  }
}

interface AuthState {
  session: Session | null
  user: User | null
  profile: UserProfile | null
  loading: boolean
  initialized: boolean
}

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string, userData: Partial<UserProfile & { firstName: string, lastName: string }>) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  updateEmail: (email: string) => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
  refreshSession: () => Promise<void>
  sendVerificationEmail: () => Promise<void>
  isAdmin: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// URL for deep linking
const DEEP_LINK_PREFIX = Linking.createURL("/")

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    loading: true,
    initialized: false,
  })

  // Handle deep links for auth flows
  useEffect(() => {
    const handleDeepLink = async (event: Linking.EventType) => {
      if (event.url.includes("type=recovery") || event.url.includes("type=signup")) {
        // Extract the token from the URL
        const params = new URLSearchParams(event.url.split("#")[1])
        const accessToken = params.get("access_token")
        const refreshToken = params.get("refresh_token")
        const type = params.get("type")

        if (accessToken && refreshToken) {
          try {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })

            if (error) throw error

            if (type === "recovery") {
              // Navigate to password reset screen
              router.push("/reset-password")
            } else if (type === "signup") {
              // Handle email verification
              Toast.show({
                type: "success",
                text1: "Email Verified",
                text2: "Your email has been successfully verified.",
              })
            }
          } catch (error) {
            console.error("Error handling deep link:", error)
          }
        }
      }
    }

    // Add event listener for deep links
    const subscription = Linking.addEventListener("url", handleDeepLink)

    // Check for initial URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url } as Linking.EventType)
      }
    })

    return () => {
      subscription.remove()
    }
  }, [])

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for existing session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          throw sessionError
        }

        if (sessionData?.session) {
          setState((prev) => ({
            ...prev,
            session: sessionData.session,
            user: sessionData.session.user,
          }))

          // Fetch user profile
          await fetchUserProfile(sessionData.session.user.id)
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
      } finally {
        setState((prev) => ({ ...prev, loading: false, initialized: true }))
      }
    }

    initializeAuth()

    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event)

      setState((prev) => ({
        ...prev,
        session,
        user: session?.user || null,
      }))

      if (session?.user) {
        await fetchUserProfile(session.user.id)
      } else if (event === "SIGNED_OUT") {
        setState((prev) => ({ ...prev, profile: null }))
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) {
        throw error
      }

      if (data) {
        setState((prev) => ({ ...prev, profile: data as UserProfile }))

        // Store profile in AsyncStorage for offline access
        await AsyncStorage.setItem("userProfile", JSON.stringify(data))
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)

      // Try to load from AsyncStorage if network request fails
      try {
        const storedProfile = await AsyncStorage.getItem("userProfile")
        if (storedProfile) {
          const profile = JSON.parse(storedProfile)
          if (profile.id === userId) {
            setState((prev) => ({ ...prev, profile: profile as UserProfile }))
          }
        }
      } catch (storageError) {
        console.error("Error loading profile from storage:", storageError)
      }
    }
  }

  const handleAuthError = (error: AuthError) => {
    console.error("Auth error:", error)

    let message = "An error occurred during authentication"

    // Map common Supabase error codes to user-friendly messages
    if (error.message.includes("Email not confirmed")) {
      message = "Please verify your email address before signing in"
    } else if (error.message.includes("Invalid login credentials")) {
      message = "Invalid email or password"
    } else if (error.message.includes("Email already registered")) {
      message = "This email is already registered"
    } else if (error.message.includes("Password should be")) {
      message = error.message
    } else {
      message = error.message
    }

    Toast.show({
      type: "error",
      text1: "Authentication Error",
      text2: message,
    })

    throw error
  }

  const signUp = async (email: string, password: string, userData: Partial<UserProfile & { firstName: string, lastName: string }>) => {
    setState((prev) => ({ ...prev, loading: true }))

    try {
      console.log("Starting signup process for:", email);
      
      // Prepare user metadata
      const userMetadata = {
        first_name: userData.firstName || userData.first_name || '',
        last_name: userData.lastName || userData.last_name || '',
        full_name: `${userData.firstName || userData.first_name || ''} ${userData.lastName || userData.last_name || ''}`.trim(),
      };
      
      // Create auth user with Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${DEEP_LINK_PREFIX}auth/callback?type=signup`,
          data: userMetadata,
        } as any, // Type assertion to resolve the linter error
      })

      console.log("Signup response:", data?.user ? "User created" : "No user created", error ? `Error: ${error.message}` : "No error");

      if (error) {
        // Log detailed error information
        console.error("Signup error details:", JSON.stringify(error));
        
        // Check if it's the 500 unexpected_failure error which indicates database trigger issues
        if (error.message.includes("Database error") || 
            (error.status === 500 && error.name === "AuthApiError")) {
          
          console.log("Detected database error during signup, attempting alternative signup flow");
          
          // Try an alternative approach - create user without metadata first
          const { data: basicData, error: basicError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${DEEP_LINK_PREFIX}auth/callback?type=signup`,
            }
          });
          
          if (basicError) {
            console.error("Basic signup also failed:", basicError);
            handleAuthError(basicError);
            return;
          }
          
          if (basicData?.user) {
            console.log("Basic user created, now adding profile manually");
            
            // Wait 2 seconds for auth to finalize
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Manually create the profile since trigger failed
            try {
              const { data: profileData, error: profileError } = await supabase
                .from("profiles")
                .insert({
                  id: basicData.user.id,
                  email: email,
                  first_name: userMetadata.first_name,
                  last_name: userMetadata.last_name,
                  full_name: userMetadata.full_name,
                  is_verified: false,
                  is_seller: false,
                  role: 'student',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .select();
                
              if (profileError) {
                console.error("Failed to manually create profile:", profileError);
                // Continue anyway to show verification screen
              } else {
                console.log("Profile manually created");
              }
              
              // Create user settings too
              try {
                await supabase
                  .from("user_settings")
                  .insert({
                    id: basicData.user.id,
                    notification_preferences: {"email": true, "push": true, "messages": true, "orders": true, "marketing": false},
                    theme: 'system',
                    language: 'en',
                    currency: 'USD',
                    privacy_settings: {"show_email": false, "show_phone": false, "show_activity": true},
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  });
                console.log("User settings manually created");
              } catch (e) {
                console.warn("Error creating user settings:", e);
                // Continue anyway
              }
              
              // Show success and route to verification
              Toast.show({
                type: "success",
                text1: "Account Created",
                text2: "Please check your email to verify your account.",
              });
              
              router.replace("/(auth)/verification-pending");
              return;
            } catch (manualError) {
              console.error("Error during manual profile creation:", manualError);
              // Continue to standard error handling
            }
          }
        }
        
        // Handle normal auth errors
        handleAuthError(error);
        return;
      }

      // Verify the user was actually created and has an account
      if (data.user) {
        console.log("User created with ID:", data.user.id);
        
        // Add a small delay to allow database triggers to complete
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Check if profile was created successfully
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", data.user.id)
          .single();

        console.log("Profile check result:", profileData ? "Profile exists" : "No profile found", 
                   profileError ? `Error: ${profileError.message}` : "No error");

        if (profileError || !profileData) {
          console.error("Error verifying user profile:", profileError || "Profile not found");
          console.log("Attempting to manually create profile...");
          
          // Manually create the profile if the trigger failed
          try {
            const fullName = `${userMetadata.first_name} ${userMetadata.last_name}`.trim();
            
            const { data: manualProfileData, error: manualProfileError } = await supabase
              .from("profiles")
              .insert({
                id: data.user.id,
                email: email,
                first_name: userMetadata.first_name,
                last_name: userMetadata.last_name,
                full_name: fullName,
                is_verified: false,
                is_seller: false,
                role: 'student',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .select();
              
            if (manualProfileError) {
              console.error("Failed to manually create profile:", manualProfileError);
              
              // Try to clean up the failed user
              try {
                console.log("Attempting to clean up failed user registration");
                await supabase.auth.signOut();
              } catch (e) {
                console.error("Error during cleanup:", e);
              }
              
              Toast.show({
                type: "error",
                text1: "Signup Failed",
                text2: "Unable to create your profile. Please try again with a different email or contact support.",
              });
              
              return;
            }
            
            console.log("Profile manually created:", manualProfileData);
            
            // Try to create user settings too
            try {
              const { error: settingsError } = await supabase
                .from("user_settings")
                .insert({
                  id: data.user.id,
                  notification_preferences: {"email": true, "push": true, "messages": true, "orders": true, "marketing": false},
                  theme: 'system',
                  language: 'en',
                  currency: 'USD',
                  privacy_settings: {"show_email": false, "show_phone": false, "show_activity": true},
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                });
                
              if (settingsError) {
                console.warn("Created profile but failed to create settings:", settingsError);
                // Continue anyway since profile was created
              }
            } catch (e) {
              console.warn("Error creating user settings:", e);
              // Continue anyway since profile was created
            }
          } catch (manualError) {
            console.error("Error during manual profile creation:", manualError);
            
            // Try to clean up the failed user
            try {
              console.log("Attempting to clean up failed user registration");
              await supabase.auth.signOut();
            } catch (e) {
              console.error("Error during cleanup:", e);
            }
            
            Toast.show({
              type: "error",
              text1: "Signup Failed",
              text2: "Database error creating your profile. Please try again with a different email or contact support.",
            });
            
            return;
          }
        }

        // If we got here, the user was created successfully
        console.log("Signup successful, profile created properly");
        Toast.show({
          type: "success",
          text1: "Account Created",
          text2: "Please check your email to verify your account.",
        });
        
        // Now it's safe to redirect to verification page
        router.replace("/(auth)/verification-pending");
      } else {
        console.error("No user data returned after signup");
        Toast.show({
          type: "error",
          text1: "Signup Failed",
          text2: "No user data returned. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error during signup:", error);
      
      // Log detailed error information
      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      } else {
        console.error("Non-Error object thrown:", JSON.stringify(error));
      }
      
      Toast.show({
        type: "error",
        text1: "Signup Failed",
        text2: "An error occurred during signup. Please try again.",
      });
    } finally {
      setState((prev) => ({ ...prev, loading: false }))
    }
  }

  const signIn = async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true }))

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        handleAuthError(error)
      }

      if (data.user) {
        Toast.show({
          type: "success",
          text1: "Welcome Back",
          text2: `${data.user.user_metadata.first_name || "User"}`,
        })
      }
    } catch (error) {
      console.error("Sign in error:", error)
    } finally {
      setState((prev) => ({ ...prev, loading: false }))
    }
  }

  const signOut = async () => {
    setState((prev) => ({ ...prev, loading: true }))

    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        throw error
      }

      // Clear local storage
      await AsyncStorage.removeItem("userProfile")

      // Reset auth state
      setState((prev) => ({
        ...prev,
        session: null,
        user: null,
        profile: null,
      }))

      Toast.show({
        type: "success",
        text1: "Signed Out",
        text2: "You have been successfully signed out",
      })
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "An error occurred during sign out",
      })
    } finally {
      setState((prev) => ({ ...prev, loading: false }))
    }
  }

  const resetPassword = async (email: string) => {
    setState((prev) => ({ ...prev, loading: true }))

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${DEEP_LINK_PREFIX}auth/callback?type=recovery`,
      })

      if (error) {
        handleAuthError(error)
      }

      Toast.show({
        type: "success",
        text1: "Password Reset Email Sent",
        text2: "Check your email for a password reset link",
      })
    } catch (error) {
      console.error("Password reset error:", error)
    } finally {
      setState((prev) => ({ ...prev, loading: false }))
    }
  }

  const updatePassword = async (password: string) => {
    setState((prev) => ({ ...prev, loading: true }))

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) {
        handleAuthError(error)
      }

      Toast.show({
        type: "success",
        text1: "Password Updated",
        text2: "Your password has been successfully updated",
      })
    } catch (error) {
      console.error("Update password error:", error)
    } finally {
      setState((prev) => ({ ...prev, loading: false }))
    }
  }

  const updateEmail = async (email: string) => {
    setState((prev) => ({ ...prev, loading: true }))

    try {
      const { error } = await supabase.auth.updateUser({
        email,
        options: {
          emailRedirectTo: `${DEEP_LINK_PREFIX}auth/callback?type=email_change`,
        },
      } as any) // Use type assertion to bypass the type check

      if (error) {
        handleAuthError(error)
      }

      Toast.show({
        type: "success",
        text1: "Verification Email Sent",
        text2: "Check your new email to verify the change",
      })
    } catch (error) {
      console.error("Update email error:", error)
    } finally {
      setState((prev) => ({ ...prev, loading: false }))
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    setState((prev) => ({ ...prev, loading: true }))

    try {
      if (!state.user) {
        throw new Error("User not authenticated")
      }

      // Check if we need to update the auth metadata
      const metadataUpdates: Record<string, any> = {}
      if (updates.first_name || updates.last_name || updates.full_name) {
        if (updates.first_name) metadataUpdates.first_name = updates.first_name
        if (updates.last_name) metadataUpdates.last_name = updates.last_name
        
        // If full_name not explicitly provided, construct it from first and last name
        if (!updates.full_name && (updates.first_name || updates.last_name)) {
          const currentProfile = state.profile
          metadataUpdates.full_name = `${updates.first_name || currentProfile?.first_name || ''} ${updates.last_name || currentProfile?.last_name || ''}`.trim()
        } else if (updates.full_name) {
          metadataUpdates.full_name = updates.full_name
        }
      }

      // Update auth metadata if needed
      if (Object.keys(metadataUpdates).length > 0) {
        const { error: authError } = await supabase.auth.updateUser({
          data: metadataUpdates,
        })

        if (authError) {
          throw authError
        }
      }

      // Update profile
      const { data, error } = await supabase
        .from("profiles")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", state.user.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      // Only update profile in state if everything succeeded
      setState((prev) => ({
        ...prev,
        profile: data as UserProfile,
        loading: false,
      }))

      // Update local storage
      await AsyncStorage.setItem("userProfile", JSON.stringify(data))

      // Show success message
      Toast.show({
        type: "success",
        text1: "Profile Updated",
        text2: "Your profile has been successfully updated.",
      })
    } catch (error: any) {
      console.error("Error updating profile:", error)
      setState((prev) => ({ ...prev, loading: false }))

      // Show error message
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: error.message || "Failed to update profile",
      })

      throw error
    }
  }

  const refreshSession = async () => {
    setState((prev) => ({ ...prev, loading: true }))

    try {
      const { data, error } = await supabase.auth.refreshSession()

      if (error) {
        handleAuthError(error)
      }

      if (data?.session) {
        // Store session in a variable to avoid type error
        const session = data.session;
        setState((prev) => ({
          ...prev,
          session,
          user: session.user,
        }))
      }
    } catch (error) {
      console.error("Refresh session error:", error)
    } finally {
      setState((prev) => ({ ...prev, loading: false }))
    }
  }

  const sendVerificationEmail = async () => {
    setState((prev) => ({ ...prev, loading: true }))

    try {
      if (!state.user?.email) {
        throw new Error("User email not found")
      }

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: state.user.email,
        options: {
          emailRedirectTo: `${DEEP_LINK_PREFIX}auth/callback?type=signup`,
        },
      })

      if (error) {
        handleAuthError(error)
      }

      Toast.show({
        type: "success",
        text1: "Verification Email Sent",
        text2: "Please check your email to verify your account",
      })
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "An error occurred while sending verification email",
      })
    } finally {
      setState((prev) => ({ ...prev, loading: false }))
    }
  }

  const isAdmin = () => {
    return state.profile?.role === "admin"
  }

  const value = {
    ...state,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateEmail,
    updateProfile,
    refreshSession,
    sendVerificationEmail,
    isAdmin,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
