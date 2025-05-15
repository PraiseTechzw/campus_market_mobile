"use client"

import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from "react-native"
import { useRouter } from "expo-router"
import Colors from "../../constants/Colors"
import { Ionicons } from "@expo/vector-icons"

const ProfileScreen = () => {
  const router = useRouter()
  const colorScheme = useColorScheme()

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: Colors[colorScheme ?? "light"].text }]}>Profile</Text>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.profileImageContainer}>
          <View style={styles.profileImage}>
            <Ionicons name="person" size={60} color={Colors[colorScheme ?? "light"].text} />
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Ionicons name="camera" size={20} color={Colors[colorScheme ?? "light"].text} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.userName, { color: Colors[colorScheme ?? "light"].text }]}>John Doe</Text>
        <Text style={[styles.userEmail, { color: Colors[colorScheme ?? "light"].secondary }]}>
          john.doe@example.com
        </Text>
      </View>

      <View style={styles.menuSection}>
        <Text style={[styles.menuTitle, { color: Colors[colorScheme ?? "light"].text }]}>Account</Text>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/profile/listings")}>
          <Ionicons name="bag" size={20} color={Colors[colorScheme ?? "light"].text} />
          <Text style={styles.menuItemText}>My Listings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/profile/favorites")}>
          <Ionicons name="heart" size={20} color={Colors[colorScheme ?? "light"].text} />
          <Text style={styles.menuItemText}>Favorites</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/profile/interests")}>
          <Ionicons name="star" size={20} color={Colors[colorScheme ?? "light"].text} />
          <Text style={styles.menuItemText}>My Interests</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/profile/settings")}>
          <Ionicons name="settings" size={20} color={Colors[colorScheme ?? "light"].text} />
          <Text style={styles.menuItemText}>Settings</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.menuSection}>
        <Text style={[styles.menuTitle, { color: Colors[colorScheme ?? "light"].text }]}>Preferences</Text>

        <TouchableOpacity style={styles.menuItem}>
          {colorScheme === "light" ? (
            <Ionicons name="moon" size={20} color={Colors[colorScheme ?? "light"].text} />
          ) : (
            <Ionicons name="sunny" size={20} color={Colors[colorScheme ?? "light"].text} />
          )}
          <Text style={styles.menuItemText}>Dark Mode</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="bell" size={20} color={Colors[colorScheme ?? "light"].text} />
          <Text style={styles.menuItemText}>Notifications</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton}>
        <Ionicons name="log-out" size={20} color={Colors[colorScheme ?? "light"].text} />
        <Text style={[styles.logoutButtonText, { color: Colors[colorScheme ?? "light"].text }]}>Log Out</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileImageContainer: {
    position: "relative",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "lightgray",
    justifyContent: "center",
    alignItems: "center",
  },
  editButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "gray",
    borderRadius: 20,
    padding: 5,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
  },
  userEmail: {
    fontSize: 16,
    color: "gray",
  },
  menuSection: {
    marginBottom: 20,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "lightgray",
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 10,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    backgroundColor: "red",
    borderRadius: 10,
  },
  logoutButtonText: {
    color: "white",
    fontSize: 18,
    marginLeft: 10,
  },
})

export default ProfileScreen
