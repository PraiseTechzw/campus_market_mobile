"use client"

import React, { useEffect } from "react"
import { StyleSheet, TouchableOpacity, View, Text, Modal, FlatList } from "react-native"
import { useQuery } from "@tanstack/react-query"
import { getCampuses } from "@/services/campus"
import type { Campus } from "@/types"
import { Ionicons } from "@expo/vector-icons"

type CampusSelectorProps = {
  selectedCampus: Campus | null
  onSelectCampus: (campus: Campus | null) => void
}

export default function CampusSelector({ selectedCampus, onSelectCampus }: CampusSelectorProps) {
  const [modalVisible, setModalVisible] = React.useState(false)

  const { data: campuses, isLoading } = useQuery({
    queryKey: ["campuses"],
    queryFn: getCampuses,
  })

  useEffect(() => {
    // Set the first campus as default if none is selected and campuses are loaded
    if (!selectedCampus && campuses && campuses.length > 0) {
      onSelectCampus(campuses[0])
    }
  }, [campuses, selectedCampus, onSelectCampus])

  const handleSelectCampus = (campus: Campus | null) => {
    onSelectCampus(campus)
    setModalVisible(false)
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.selector} onPress={() => setModalVisible(true)}>
        <Text style={styles.selectorText}>
          {selectedCampus ? selectedCampus.name : isLoading ? "Loading..." : "Select Campus"}
        </Text>
        <Ionicons name = 'chevron-down' size={20} color="#666" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Campus</Text>

            <FlatList
              data={campuses}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.campusItem, selectedCampus?.id === item.id && styles.selectedCampusItem]}
                  onPress={() => handleSelectCampus(item)}
                >
                  <Text
                    style={[styles.campusItemText, selectedCampus?.id === item.id && styles.selectedCampusItemText]}
                  >
                    {item.name}
                  </Text>
                  <Text style={styles.campusLocation}>{item.location}</Text>
                </TouchableOpacity>
              )}
              ListHeaderComponent={
                <TouchableOpacity style={styles.campusItem} onPress={() => handleSelectCampus(null)}>
                  <Text style={styles.campusItemText}>All Campuses</Text>
                </TouchableOpacity>
              }
            />

            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectorText: {
    fontSize: 16,
    color: "#333",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  campusItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  selectedCampusItem: {
    backgroundColor: "#e6f7ff",
  },
  campusItemText: {
    fontSize: 16,
    color: "#333",
  },
  selectedCampusItemText: {
    fontWeight: "bold",
    color: "#0891b2",
  },
  campusLocation: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: "#0891b2",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
})
