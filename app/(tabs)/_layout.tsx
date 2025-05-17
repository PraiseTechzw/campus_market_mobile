"use client"
import { StyleSheet, View } from "react-native"
import { Tabs } from "expo-router"
import { useColorScheme } from "@/hooks/use-color-scheme"
import Colors from "@/constants/Colors"
import { MaterialIcons } from "@expo/vector-icons"
import AuthGuard from "@/components/auth-guard"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useQuery } from "@tanstack/react-query"
import { getUnreadNotificationsCount } from "@/services/notifications"
import { useSession } from "@/providers/session-provider"

export default function TabLayout() {
  return (
    <AuthGuard requireAuth={true} requireOnboarding={false}>
      <TabNavigator />
    </AuthGuard>
  )
}

function TabNavigator() {
  const colorScheme = useColorScheme()
  const insets = useSafeAreaInsets()
  const { session } = useSession()
  
  // Get unread notification count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unreadNotifications", session?.user.id],
    queryFn: () => (session?.user.id ? getUnreadNotificationsCount(session.user.id) : Promise.resolve(0)),
    enabled: !!session?.user.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const tabBarStyle = {
    position: "absolute" as const,
    height: 60 + insets.bottom,
    paddingBottom: insets.bottom,
    backgroundColor: Colors[colorScheme ?? "light"].background,
    borderTopWidth: 0,
    elevation: 0,
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        tabBarInactiveTintColor: "#999",
        tabBarStyle: tabBarStyle,
        tabBarShowLabel: true,
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
        tabBarItemStyle: {
          paddingVertical: 5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="home" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: "Market",
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="shopping-bag" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: "Events",
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="event" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="accommodation"
        options={{
          title: "Housing",
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="apartment" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="message" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: "Activity",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon 
              name="notifications" 
              color={color} 
              focused={focused} 
              badgeCount={unreadCount} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="person" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
    </Tabs>
  )
}

function TabBarIcon({ 
  name, 
  color, 
  focused, 
  badgeCount = 0 
}: { 
  name: string; 
  color: string; 
  focused: boolean; 
  badgeCount?: number;
}) {
  return (
    <View style={styles.iconContainer}>
      <MaterialIcons name={name as any} size={24} color={color} />
      {focused && <View style={[styles.indicator, { backgroundColor: color }]} />}
      
      {badgeCount > 0 && (
        <View style={styles.badge}>
          <View style={styles.badgeTextContainer}>
            <MaterialIcons 
              name="circle" 
              size={badgeCount > 99 ? 18 : badgeCount > 9 ? 16 : 14} 
              color="#ff3b30" 
            />
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  indicator: {
    position: "absolute",
    bottom: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -6,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeTextContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
})
