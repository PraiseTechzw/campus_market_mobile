"use client"

import { useState, useRef, useEffect } from "react"
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native"
import { useTheme } from "@/providers/theme-provider"
import OptimizedImage from "./optimized-image"
import type { Banner } from "@/types"

interface BannerCarouselProps {
  banners: Banner[]
  autoPlay?: boolean
  interval?: number
  onBannerPress?: (banner: Banner) => void
}

const { width: screenWidth } = Dimensions.get("window")

export default function BannerCarousel({
  banners,
  autoPlay = true,
  interval = 5000,
  onBannerPress,
}: BannerCarouselProps) {
  const { colors } = useTheme()
  const [activeIndex, setActiveIndex] = useState(0)
  const scrollViewRef = useRef<ScrollView>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (autoPlay && banners.length > 1) {
      startAutoPlay()
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [autoPlay, banners.length, activeIndex])

  const startAutoPlay = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    timerRef.current = setInterval(() => {
      const nextIndex = (activeIndex + 1) % banners.length
      setActiveIndex(nextIndex)
      scrollViewRef.current?.scrollTo({
        x: nextIndex * screenWidth,
        animated: true,
      })
    }, interval)
  }

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x
    const newIndex = Math.round(contentOffsetX / screenWidth)

    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex)
    }
  }

  const handleBannerPress = (banner: Banner) => {
    if (onBannerPress) {
      onBannerPress(banner)
    }
  }

  if (!banners || banners.length === 0) {
    return null
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {banners.map((banner, index) => (
          <TouchableOpacity
            key={banner.id || index}
            activeOpacity={0.9}
            onPress={() => handleBannerPress(banner)}
            style={styles.bannerContainer}
          >
            <OptimizedImage
              source={banner.imageUrl}
              style={styles.bannerImage}
              width={screenWidth}
              height={180}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {banners.length > 1 && (
        <View style={styles.pagination}>
          {banners.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                {
                  backgroundColor: index === activeIndex ? colors.tint : colors.neutral3,
                  width: index === activeIndex ? 20 : 8,
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    height: 180,
  },
  bannerContainer: {
    width: screenWidth,
    height: 180,
  },
  bannerImage: {
    width: screenWidth,
    height: 180,
  },
  pagination: {
    position: "absolute",
    bottom: 12,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
})
