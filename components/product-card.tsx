"use client"
import { StyleSheet, View, Text, TouchableOpacity } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "@/providers/theme-provider"
import type { Product } from "@/types"
import { formatDistanceToNow } from "date-fns"
import OptimizedImage from "./optimized-image"
import Card from "./card"
import { globalStyles } from "@/constants/Styles"

interface ProductCardProps {
  product: Product
  onPress: () => void
  style?: object
}

export default function ProductCard({ product, onPress, style }: ProductCardProps) {
  const { colors } = useTheme()
  const isNew = (Date.now() - new Date(product.createdAt).getTime()) < 1000 * 60 * 60 * 24 * 3 // 3 days

  return (
    <TouchableOpacity style={[styles.container, style]} onPress={onPress} activeOpacity={0.8}>
      <Card variant="elevated" style={styles.card}>
        <View style={styles.imageContainer}>
          <OptimizedImage
            source={product.images[0] || "/placeholder.svg?height=200&width=200"}
            style={styles.image}
            width="100%"
            height={180}
            borderRadius={16}
          />
          {product.isFeatured && (
            <View style={[styles.badge, { backgroundColor: colors.tint, top: 10, left: 10 }]}> 
              <Text style={styles.badgeText}>FEATURED</Text>
            </View>
          )}
          {isNew && (
            <View style={[styles.badge, { backgroundColor: colors.accent1, top: 10, right: 10 }]}> 
              <Text style={styles.badgeText}>NEW</Text>
            </View>
          )}
          {product.isUrgent && (
            <View style={[styles.urgentBadge, { backgroundColor: colors.error }]}> 
              <Text style={styles.urgentText}>URGENT</Text>
            </View>
          )}
        </View>
        <View style={styles.contentContainer}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {product.name}
          </Text>
          <Text style={[styles.price, { color: colors.tint }]}>
            ${product.price.toFixed(2)}
            {product.isNegotiable && <Text style={[styles.negotiable, { color: colors.textDim }]}> (Negotiable)</Text>}
          </Text>
          <View style={styles.infoContainer}>
            <View style={styles.sellerContainer}>
              {product.seller?.profilePicture ? (
                <OptimizedImage
                  source={product.seller.profilePicture}
                  style={styles.sellerImage}
                  width={24}
                  height={24}
                  borderRadius={12}
                />
              ) : (
                <View style={[styles.sellerInitial, { backgroundColor: colors.tint }]}> 
                  <Text style={styles.sellerInitialText}>{product.seller?.firstName?.charAt(0) || "U"}</Text>
                </View>
              )}
              <Text style={[styles.sellerName, { color: colors.textDim }]} numberOfLines={1}>
                {product.seller?.firstName || "Unknown"}
                {product.seller?.isVerified && (
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} style={styles.verifiedIcon} />
                )}
              </Text>
            </View>
            <Text style={[styles.time, { color: colors.textDim }]}>
              {formatDistanceToNow(new Date(product.createdAt), { addSuffix: true })}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 3,
  },
  card: {
    padding: 0,
    overflow: "hidden",
    borderRadius: 20,
  },
  imageContainer: {
    position: "relative",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  image: {
    width: "100%",
    height: 180,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  badge: {
    position: 'absolute',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 2,
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: 0.5,
  },
  urgentBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 2,
  },
  urgentText: {
    color: "white",
    fontSize: 11,
    fontFamily: 'Poppins-Bold',
  },
  contentContainer: {
    padding: 14,
  },
  title: {
    fontFamily: 'Poppins-Medium',
    fontSize: 17,
    marginBottom: 4,
  },
  price: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    marginBottom: 8,
  },
  negotiable: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
  },
  infoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sellerContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sellerImage: {
    marginRight: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  sellerInitial: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  sellerInitialText: {
    color: "white",
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
  },
  sellerName: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    flex: 1,
  },
  verifiedIcon: {
    marginLeft: 2,
  },
  time: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
  },
})
