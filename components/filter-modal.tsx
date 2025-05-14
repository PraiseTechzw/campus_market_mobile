"use client"

import { useState } from "react"
import { StyleSheet, Modal, View, Text, TouchableOpacity, ScrollView, TouchableWithoutFeedback } from "react-native"
import { useColorScheme } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import Slider from "@react-native-community/slider"
import Colors from "@/constants/Colors"
import type { FilterOptions, ProductCondition } from "@/types"

interface FilterModalProps {
  visible: boolean
  initialOptions: FilterOptions
  onClose: () => void
  onApply: (options: FilterOptions) => void
  maxPrice: number
}

export default function FilterModal({ visible, initialOptions, onClose, onApply, maxPrice }: FilterModalProps) {
  const colorScheme = useColorScheme()
  const [options, setOptions] = useState<FilterOptions>(initialOptions)

  const handleReset = () => {
    setOptions({
      priceRange: [0, maxPrice],
      condition: [],
      sortBy: "newest",
    })
  }

  const toggleCondition = (condition: ProductCondition) => {
    setOptions((prev) => {
      const conditions = [...prev.condition]
      const index = conditions.indexOf(condition)
      if (index >= 0) {
        conditions.splice(index, 1)
      } else {
        conditions.push(condition)
      }
      return { ...prev, condition: conditions }
    })
  }

  const conditionLabels: Record<ProductCondition, string> = {
    new: "Brand New",
    like_new: "Like New",
    good: "Good",
    used: "Used",
    worn: "Worn",
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color={Colors[colorScheme ?? "light"].text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: Colors[colorScheme ?? "light"].text }]}>Filters</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={[styles.resetText, { color: Colors[colorScheme ?? "light"].tint }]}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? "light"].text }]}>Price Range</Text>
            <View style={styles.priceContainer}>
              <Text style={[styles.priceText, { color: Colors[colorScheme ?? "light"].text }]}>
                ${options.priceRange[0].toFixed(0)}
              </Text>
              <Text style={[styles.priceText, { color: Colors[colorScheme ?? "light"].text }]}>
                ${options.priceRange[1].toFixed(0)}
              </Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={maxPrice}
              step={5}
              value={options.priceRange[1]}
              onValueChange={(value) => setOptions({ ...options, priceRange: [options.priceRange[0], value] })}
              minimumTrackTintColor={Colors[colorScheme ?? "light"].tint}
              maximumTrackTintColor={Colors[colorScheme ?? "light"].border}
              thumbTintColor={Colors[colorScheme ?? "light"].tint}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? "light"].text }]}>Condition</Text>
            <View style={styles.conditionContainer}>
              {(Object.keys(conditionLabels) as ProductCondition[]).map((condition) => (
                <TouchableOpacity
                  key={condition}
                  style={[
                    styles.conditionItem,
                    {
                      backgroundColor: options.condition.includes(condition)
                        ? Colors[colorScheme ?? "light"].tint
                        : Colors[colorScheme ?? "light"].cardBackground,
                    },
                  ]}
                  onPress={() => toggleCondition(condition)}
                >
                  <Text
                    style={[
                      styles.conditionText,
                      {
                        color: options.condition.includes(condition) ? "white" : Colors[colorScheme ?? "light"].text,
                      },
                    ]}
                  >
                    {conditionLabels[condition]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? "light"].text }]}>Sort By</Text>
            <View style={styles.sortContainer}>
              {[
                { value: "newest", label: "Newest First" },
                { value: "oldest", label: "Oldest First" },
                { value: "price_low_high", label: "Price: Low to High" },
                { value: "price_high_low", label: "Price: High to Low" },
              ].map((sort) => (
                <TouchableOpacity
                  key={sort.value}
                  style={[
                    styles.sortItem,
                    {
                      backgroundColor:
                        options.sortBy === sort.value
                          ? Colors[colorScheme ?? "light"].tint
                          : Colors[colorScheme ?? "light"].cardBackground,
                    },
                  ]}
                  onPress={() => setOptions({ ...options, sortBy: sort.value as any })}
                >
                  <Text
                    style={[
                      styles.sortText,
                      {
                        color: options.sortBy === sort.value ? "white" : Colors[colorScheme ?? "light"].text,
                      },
                    ]}
                  >
                    {sort.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.applyButton, { backgroundColor: Colors[colorScheme ?? "light"].tint }]}
            onPress={() => onApply(options)}
          >
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  resetText: {
    fontSize: 14,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  priceText: {
    fontSize: 14,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  conditionContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  conditionItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  conditionText: {
    fontSize: 14,
  },
  sortContainer: {
    gap: 8,
  },
  sortItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  sortText: {
    fontSize: 14,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  applyButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  applyButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
})
