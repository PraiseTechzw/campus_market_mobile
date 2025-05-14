"use client";

import type React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";
import Colors from "@/constants/Colors";
import { useAuth } from "@/providers/auth-provider";
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import Animated, { FadeIn } from "react-native-reanimated";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        tabBarInactiveTintColor: Colors[colorScheme ?? "light"].textDim,
        tabBarStyle: {
          position: "absolute",
          bottom: Platform.OS === "ios" ? 20 : 10,
          left: 20,
          right: 20,
          elevation: 0,
          backgroundColor: "transparent",
          borderTopWidth: 0,
          height: 60,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={80}
            tint={colorScheme === "dark" ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarItemStyle: {
          paddingVertical: 5,
        },
        tabBarLabelStyle: {
          fontFamily: "Poppins-Medium",
          fontSize: 12,
          marginTop: -5,
        },
        headerTitleStyle: {
          fontFamily: "Poppins-SemiBold",
        },
        headerStyle: {
          backgroundColor: Colors[colorScheme ?? "light"].background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Animated.View entering={FadeIn.duration(200)}>
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={24}
                color={color}
              />
            </Animated.View>
          ),
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: "Marketplace",
          tabBarIcon: ({ color, focused }) => (
            <Animated.View entering={FadeIn.duration(200)}>
              <MaterialIcons name="store" size={24} color={color} />
            </Animated.View>
          ),
        }}
      />
      <Tabs.Screen
        name="sell"
        options={{
          title: "Sell",
          tabBarIcon: ({ color, focused }) => (
            <Animated.View entering={FadeIn.duration(200)}>
              <MaterialCommunityIcons
                name={focused ? "plus-circle" : "plus-circle-outline"}
                size={28}
                color={color}
              />
            </Animated.View>
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, focused }) => (
            <Animated.View entering={FadeIn.duration(200)}>
              <Ionicons
                name={focused ? "chatbubble" : "chatbubble-outline"}
                size={24}
                color={color}
              />
            </Animated.View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Animated.View entering={FadeIn.duration(200)}>
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={24}
                color={color}
              />
            </Animated.View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <Ionicons name="settings-outline" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="admin"
        options={{
          title: "Admin",
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <Animated.View entering={FadeIn.duration(200)}>
              <MaterialIcons
                name="admin-panel-settings"
                size={24}
                color={color}
              />
            </Animated.View>
          ),
        }}
      />
    </Tabs>
  );
}
