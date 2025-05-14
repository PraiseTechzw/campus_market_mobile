import { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/providers/theme-provider";
import { useSupabaseQuery } from "@/hooks/use-supabase-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/auth-provider";
import type { Product, Category, Order } from "@/types";
import ScreenContainer from "@/components/screen-container";
import SearchBar from "@/components/search-bar";
import CategoryList from "@/components/category-list";
import ProductCard from "@/components/product-card";
import BannerCarousel from "@/components/banner-carousel";
import PromotionalBanner from "@/components/promotional-banner";
import Button from "@/components/button";
import Card from "@/components/card";
import { Banner } from "@/services/banner-service";
import React from "react";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";

export default function HomeScreen() {
  const { colors } = useTheme();
  const { user, profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  
  // New state variables for the features
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [savedItems, setSavedItems] = useState<Product[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [nearbyItems, setNearbyItems] = useState<Product[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [userActivities, setUserActivities] = useState<{
    selling: number;
    orders: number;
    messages: number;
  }>({ selling: 0, orders: 0, messages: 0 });

  // Load recently viewed items from AsyncStorage
  useEffect(() => {
    const loadRecentlyViewed = async () => {
      try {
        const recentlyViewedJson = await AsyncStorage.getItem('recentlyViewed');
        if (recentlyViewedJson) {
          setRecentlyViewed(JSON.parse(recentlyViewedJson).slice(0, 6));
        }
      } catch (error) {
        console.error("Error loading recently viewed items:", error);
      }
    };

    const loadSearchHistory = async () => {
      try {
        const searchHistoryJson = await AsyncStorage.getItem('searchHistory');
        if (searchHistoryJson) {
          setSearchHistory(JSON.parse(searchHistoryJson).slice(0, 5));
        }
      } catch (error) {
        console.error("Error loading search history:", error);
      }
    };

    const loadSavedItems = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('saved_items')
            .select('product_id')
            .eq('user_id', user.id)
            .limit(6);
          
          if (data && data.length > 0) {
            const productIds = data.map(item => item.product_id);
            const { data: products } = await supabase
              .from('products')
              .select('*, seller:profiles(id, firstName, lastName, profilePicture, isVerified)')
              .in('id', productIds)
              .eq('isActive', true);
            
            if (products) {
              setSavedItems(products);
            }
          }
        } catch (error) {
          console.error("Error loading saved items:", error);
        }
      }
    };

    const loadUserActivities = async () => {
      if (user) {
        try {
          // Get count of user's active selling items
          const { count: sellingCount } = await supabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('seller_id', user.id)
            .eq('isActive', true);

          // Get count of user's orders
          const { count: ordersCount } = await supabase
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .eq('buyer_id', user.id);
            
          // Get count of unread messages
          const { count: messagesCount } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('recipient_id', user.id)
            .eq('is_read', false);

          setUserActivities({
            selling: sellingCount || 0,
            orders: ordersCount || 0,
            messages: messagesCount || 0
          });
        } catch (error) {
          console.error("Error loading user activities:", error);
        }
      }
    };

    const loadNotifications = async () => {
      if (user) {
        try {
          const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_read', false)
            .order('created_at', { ascending: false })
            .limit(5);
          
          if (data) {
            setNotifications(data);
          }
        } catch (error) {
          console.error("Error loading notifications:", error);
        }
      }
    };

    const getUserLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          setUserLocation(location);
        }
      } catch (error) {
        console.error("Error getting location:", error);
      }
    };

    loadRecentlyViewed();
    loadSearchHistory();
    loadSavedItems();
    loadUserActivities();
    loadNotifications();
    getUserLocation();
  }, [user]);

  // Get nearby items when location is available
  useEffect(() => {
    const loadNearbyItems = async () => {
      if (userLocation) {
        try {
          // This is a simplified example. In a real app, you'd use geospatial queries
          const { data } = await supabase
            .from('products')
            .select('*, seller:profiles(id, firstName, lastName, profilePicture, isVerified)')
            .eq('isActive', true)
            .order('created_at', { ascending: false })
            .limit(6);
          
          if (data) {
            setNearbyItems(data);
          }
        } catch (error) {
          console.error("Error loading nearby items:", error);
        }
      }
    };

    loadNearbyItems();
  }, [userLocation]);

  // Fetch banners
  const {
    data: banners,
    loading: bannersLoading,
    refetch: refetchBanners,
  } = useSupabaseQuery<Banner>({
    key: "banners",
    query: () =>
      supabase.from("banners").select("*").eq("isActive", true).order("order"),
  });

  // Fetch featured products
  const {
    data: featuredProducts,
    loading: featuredLoading,
    refetch: refetchFeatured,
  } = useSupabaseQuery<Product>({
    key: "featured_products",
    query: () =>
      supabase
        .from("products")
        .select(
          `
          *,
          seller:profiles(id, firstName, lastName, profilePicture, isVerified)
        `
        )
        .eq("isActive", true)
        .eq("isFeatured", true)
        .order("createdAt", { ascending: false })
        .limit(6),
  });

  // Fetch recent products
  const {
    data: recentProducts,
    loading: recentLoading,
    refetch: refetchRecent,
  } = useSupabaseQuery<Product>({
    key: "recent_products",
    query: () =>
      supabase
        .from("products")
        .select(
          `
          *,
          seller:profiles(id, firstName, lastName, profilePicture, isVerified)
        `
        )
        .eq("isActive", true)
        .order("createdAt", { ascending: false })
        .limit(10),
  });

  // Fetch categories
  const {
    data: categories,
    loading: categoriesLoading,
    refetch: refetchCategories,
  } = useSupabaseQuery<Category>({
    key: "categories",
    query: () => supabase.from("categories").select("*").order("name"),
  });

  // Fetch popular/trending products
  const {
    data: trendingProducts,
    loading: trendingLoading,
    refetch: refetchTrending,
  } = useSupabaseQuery<Product>({
    key: "trending_products",
    query: () =>
      supabase
        .from("products")
        .select(
          `
          *,
          seller:profiles(id, firstName, lastName, profilePicture, isVerified)
        `
        )
        .eq("isActive", true)
        // In a real app, you would have view counts or a trending algorithm
        .order("views", { ascending: false })
        .limit(6),
  });

  // Fetch deals/discounts
  const {
    data: dealsProducts,
    loading: dealsLoading,
    refetch: refetchDeals,
  } = useSupabaseQuery<Product>({
    key: "deals_products",
    query: () =>
      supabase
        .from("products")
        .select(
          `
          *,
          seller:profiles(id, firstName, lastName, profilePicture, isVerified)
        `
        )
        .eq("isActive", true)
        .eq("hasDiscount", true) // Assuming you have this field
        .order("discountPercent", { ascending: false })
        .limit(6),
  });

  // Fetch recommended products based on user preferences
  const {
    data: recommendedProducts,
    loading: recommendedLoading,
    refetch: refetchRecommended,
  } = useSupabaseQuery<Product>({
    key: "recommended_products",
    query: () => {
      // If user is logged in, get some products that might interest them
      if (user) {
        return supabase
          .from("products")
          .select(
            `
            *,
            seller:profiles(id, firstName, lastName, profilePicture, isVerified)
          `
          )
          .eq("isActive", true)
          .order("createdAt", { ascending: false })
          .limit(6);
      }
      // Otherwise, just get some random popular products
      return supabase
        .from("products")
        .select(
          `
          *,
          seller:profiles(id, firstName, lastName, profilePicture, isVerified)
        `
        )
        .eq("isActive", true)
        .order("views", { ascending: false })
        .limit(6);
    },
    enabled: !!user,
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push({
        pathname: "/marketplace",
        params: { search: searchQuery },
      });
    }
  };

  const handleCategorySelect = (category: Category | null) => {
    router.push({
      pathname: "/marketplace",
      params: { category: category?.id },
    });
  };

  const handleBannerPress = (banner: Banner) => {
    if (banner.actionUrl) {
      // Handle navigation based on action URL
      if (banner.actionUrl.startsWith("/")) {
        router.push(banner.actionUrl);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchBanners(),
      refetchFeatured(),
      refetchRecent(),
      refetchCategories(),
      refetchTrending(),
      refetchDeals(),
      ...(user ? [refetchRecommended()] : []),
    ]);
    setRefreshing(false);

    // Reload the other data
    if (user) {
      const loadUserData = async () => {
        try {
          // Reload recently viewed and other user-specific data
          const recentlyViewedJson = await AsyncStorage.getItem('recentlyViewed');
          if (recentlyViewedJson) {
            setRecentlyViewed(JSON.parse(recentlyViewedJson).slice(0, 6));
          }

          const searchHistoryJson = await AsyncStorage.getItem('searchHistory');
          if (searchHistoryJson) {
            setSearchHistory(JSON.parse(searchHistoryJson).slice(0, 5));
          }

          // Reload saved items
          const { data } = await supabase
            .from('saved_items')
            .select('product_id')
            .eq('user_id', user.id)
            .limit(6);
          
          if (data && data.length > 0) {
            const productIds = data.map(item => item.product_id);
            const { data: products } = await supabase
              .from('products')
              .select('*, seller:profiles(id, firstName, lastName, profilePicture, isVerified)')
              .in('id', productIds)
              .eq('isActive', true);
            
            if (products) {
              setSavedItems(products);
            }
          }

          // Reload notifications
          const { data: notificationsData } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_read', false)
            .order('created_at', { ascending: false })
            .limit(5);
          
          if (notificationsData) {
            setNotifications(notificationsData);
          }
        } catch (error) {
          console.error("Error refreshing user data:", error);
        }
      };

      loadUserData();
    }
  };

  const renderWelcomeSection = () => (
    <View style={[styles.welcomeSection, { backgroundColor: colors.background }]}>
      <Text style={[styles.welcomeText, { color: colors.text }]}>
        {user
          ? `Welcome back, ${profile?.full_name || ""}!`
          : "Welcome to Campus Market!"}
      </Text>
      <View style={styles.searchContainer}>
        <SearchBar
          placeholder="Search products, books, tech..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmit={handleSearch}
        />
      </View>
    </View>
  );

  const renderCategoriesSection = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Ionicons name="grid" size={22} color={colors.tint} style={styles.sectionIcon} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Categories
          </Text>
        </View>
      </View>
      <CategoryList
        categories={categories || []}
        selectedCategoryId={null}
        onSelectCategory={handleCategorySelect}
        showAllOption={false}
      />
    </View>
  );

  const renderFeaturedSection = () => (
    <View
      style={[styles.sectionContainer, { backgroundColor: colors.background }]}
    >
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Ionicons name="star" size={22} color={colors.tint} style={styles.sectionIcon} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Featured Items
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.seeAllButton} 
          onPress={() => router.push("/marketplace")}
        >
          <Text style={[styles.seeAllText, { color: colors.tint }]}>
            See All
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.tint} />
        </TouchableOpacity>
      </View>

      {featuredLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : featuredProducts && featuredProducts.length > 0 ? (
        <FlatList
          data={featuredProducts}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => router.push(`/product/${item.id}`)}
              style={styles.featuredProductCard}
            />
          )}
          keyExtractor={(item) => `featured-${item.id}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredList}
        />
      ) : (
        <Card variant="outlined" style={styles.emptyCard}>
          <Text style={[styles.emptyText, { color: colors.textDim }]}>
            No featured items available
          </Text>
        </Card>
      )}
    </View>
  );

  const renderPromotionalBanner = () => {
    if (!banners || banners.length === 0 || bannersLoading) return null;

    // Find a promotional banner that's not in the carousel
    const promotionalBanner = banners.find(
      (banner) => banner.type === "promotional"
    );

    if (!promotionalBanner) return null;

    return (
      <PromotionalBanner
        banner={promotionalBanner}
        onPress={handleBannerPress}
      />
    );
  };

  const renderRecentSection = () => (
    <View
      style={[styles.sectionContainer, { backgroundColor: colors.background }]}
    >
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Ionicons name="time" size={22} color={colors.tint} style={styles.sectionIcon} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recent Items
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.seeAllButton}
          onPress={() => router.push("/marketplace")}
        >
          <Text style={[styles.seeAllText, { color: colors.tint }]}>
            See All
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.tint} />
        </TouchableOpacity>
      </View>

      {recentLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : recentProducts && recentProducts.length > 0 ? (
        <>
          <View style={styles.recentProductsGrid}>
            {recentProducts.slice(0, 4).map((item) => (
              <View key={`recent-${item.id}`} style={styles.productCardContainer}>
                <ProductCard
                  product={{
                    ...item,
                    // Ensure images array is valid
                    images: Array.isArray(item.images) && item.images.length > 0 
                      ? item.images 
                      : ["/placeholder.svg?height=200&width=200"]
                  }}
                  onPress={() => router.push(`/product/${item.id}`)}
                  style={styles.recentProductCard}
                />
              </View>
            ))}
          </View>
          {recentProducts.length > 4 && (
            <Button
              title="View More"
              variant="outline"
              icon="eye-outline"
              onPress={() => router.push("/marketplace")}
              style={styles.viewMoreButton}
            />
          )}
        </>
      ) : (
        <Card variant="outlined" style={styles.emptyCard}>
          <Text style={[styles.emptyText, { color: colors.textDim }]}>
            No recent items available
          </Text>
        </Card>
      )}
    </View>
  );

  const renderSellSection = () => (
    <Card variant="elevated" style={styles.sellCard}>
      <LinearGradient
        colors={['rgba(44, 182, 125, 0.1)', 'rgba(44, 182, 125, 0.2)']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.sellCardContent}
      >
        <View style={styles.sellCardTextContainer}>
          <Text style={[styles.sellCardTitle, { color: colors.text }]}>
            Have something to sell?
          </Text>
          <Text style={[styles.sellCardDescription, { color: colors.textDim }]}>
            List your items and reach thousands of students on campus
          </Text>
        </View>
        <Button
          title="Sell Now"
          icon="add-circle-outline"
          onPress={() => router.push("/sell")}
        />
      </LinearGradient>
    </Card>
  );

  // 1. Personalized Recommendations Section
  const renderRecommendationsSection = () => {
    if (!user) return null;
    
    return (
      <View style={[styles.sectionContainer, { backgroundColor: colors.background }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recommended For You
          </Text>
          <TouchableOpacity onPress={() => router.push("/marketplace")}>
            <Text style={[styles.seeAllText, { color: colors.tint }]}>
              See All
            </Text>
          </TouchableOpacity>
        </View>

        {recommendedLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
          </View>
        ) : recommendedProducts && recommendedProducts.length > 0 ? (
          <FlatList
            data={recommendedProducts}
            renderItem={({ item }) => (
              <ProductCard
                product={item}
                onPress={() => router.push(`/product/${item.id}`)}
                style={styles.featuredProductCard}
              />
            )}
            keyExtractor={(item) => `recommended-${item.id}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredList}
          />
        ) : (
          <Card variant="outlined" style={styles.emptyCard}>
            <Text style={[styles.emptyText, { color: colors.textDim }]}>
              No recommendations available yet
            </Text>
          </Card>
        )}
      </View>
    );
  };

  // 2. Recently Viewed Items Section
  const renderRecentlyViewedSection = () => {
    if (recentlyViewed.length === 0) return null;
    
    return (
      <View style={[styles.sectionContainer, { backgroundColor: colors.background }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recently Viewed
          </Text>
          <TouchableOpacity onPress={() => router.push("/marketplace")}>
            <Text style={[styles.seeAllText, { color: colors.tint }]}>
              See All
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={recentlyViewed}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => router.push(`/product/${item.id}`)}
              style={styles.featuredProductCard}
            />
          )}
          keyExtractor={(item) => `recent-viewed-${item.id}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredList}
          ListEmptyComponent={() => (
            <Text style={[styles.emptyText, { color: colors.textDim, padding: 20 }]}>
              No recently viewed items
            </Text>
          )}
        />
      </View>
    );
  };

  // 3. Saved/Wishlist Section
  const renderSavedItemsSection = () => {
    if (!user || savedItems.length === 0) return null;
    
    return (
      <View style={[styles.sectionContainer, { backgroundColor: colors.background }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Your Wishlist
          </Text>
          <TouchableOpacity onPress={() => router.push("/wishlist")}>
            <Text style={[styles.seeAllText, { color: colors.tint }]}>
              See All
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={savedItems}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => router.push(`/product/${item.id}`)}
              style={styles.featuredProductCard}
            />
          )}
          keyExtractor={(item) => `wishlist-${item.id}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredList}
          ListEmptyComponent={() => (
            <Text style={[styles.emptyText, { color: colors.textDim, padding: 20 }]}>
              No saved items
            </Text>
          )}
        />
      </View>
    );
  };

  // 4. User Activity Dashboard
  const renderUserActivitySection = () => {
    if (!user) return null;
    
    const badgeContainerStyle = {
      position: "absolute" as const,
      top: 0,
      right: 0,
      backgroundColor: "#4CAF50", // Green
      borderRadius: 10,
      padding: 2,
    };
    
    const badgeTextStyle = {
      fontSize: 12,
      fontWeight: "bold" as const,
      fontFamily: "Poppins-Bold",
      color: "#FFFFFF", // White
    };
    
    return (
      <Card variant="elevated" style={styles.activityCard}>
        <Text style={[styles.activityTitle, { color: colors.text }]}>
          Your Activity
        </Text>
        <View style={styles.activityGrid}>
          <TouchableOpacity 
            style={styles.activityItem} 
            onPress={() => router.push("/profile?tab=selling")}
          >
            <View style={[styles.activityIconContainer, { backgroundColor: colors.neutral2 }]}>
              <Ionicons name="pricetag-outline" size={22} color={colors.tint} />
            </View>
            <Text style={[styles.activityCount, { color: colors.text }]}>
              {userActivities.selling}
            </Text>
            <Text style={[styles.activityLabel, { color: colors.textDim }]}>
              Selling
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.activityItem} 
            onPress={() => router.push("/profile?tab=orders")}
          >
            <View style={[styles.activityIconContainer, { backgroundColor: colors.neutral2 }]}>
              <Ionicons name="bag-check-outline" size={22} color={colors.success} />
            </View>
            <Text style={[styles.activityCount, { color: colors.text }]}>
              {userActivities.orders}
            </Text>
            <Text style={[styles.activityLabel, { color: colors.textDim }]}>
              Orders
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.activityItem} 
            onPress={() => router.push("/messages")}
          >
            <View style={[styles.activityIconContainer, { backgroundColor: colors.neutral2 }]}>
              <Ionicons name="chatbubble-outline" size={22} color={colors.warning} />
              {userActivities.messages > 0 && (
                <View style={badgeContainerStyle}>
                  <Text style={badgeTextStyle}>{userActivities.messages}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.activityCount, { color: colors.text }]}>
              {userActivities.messages}
            </Text>
            <Text style={[styles.activityLabel, { color: colors.textDim }]}>
              Messages
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  // 5. Notifications Center
  const renderNotificationsSection = () => {
    if (!user || notifications.length === 0) return null;
    
    return (
      <View style={[styles.sectionContainer, { backgroundColor: colors.background }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Notifications
          </Text>
          <TouchableOpacity onPress={() => router.push("/notifications")}>
            <Text style={[styles.seeAllText, { color: colors.tint }]}>
              See All
            </Text>
          </TouchableOpacity>
        </View>

        <Card variant="outlined" style={styles.notificationsCard}>
          {notifications.map((notification) => (
            <TouchableOpacity 
              key={notification.id} 
              style={styles.notificationItem}
              onPress={() => {
                // Handle notification click based on type
                if (notification.type === 'order') {
                  router.push(`/order/${notification.reference_id}`);
                } else if (notification.type === 'message') {
                  router.push(`/messages/${notification.reference_id}`);
                } else {
                  router.push('/notifications');
                }
              }}
            >
              <View style={[styles.notificationIcon, { 
                backgroundColor: 
                  notification.type === 'order' ? colors.neutral2 : 
                  notification.type === 'message' ? colors.neutral2 : 
                  colors.neutral2 
              }]}>
                <Ionicons 
                  name={
                    notification.type === 'order' ? 'bag-check-outline' : 
                    notification.type === 'message' ? 'chatbubble-outline' : 
                    'notifications-outline'
                  } 
                  size={18} 
                  color={
                    notification.type === 'order' ? colors.success : 
                    notification.type === 'message' ? colors.warning : 
                    colors.tint
                  } 
                />
              </View>
              <View style={styles.notificationContent}>
                <Text style={[styles.notificationText, { color: colors.text }]}>
                  {notification.message}
                </Text>
                <Text style={[styles.notificationTime, { color: colors.textDim }]}>
                  {new Date(notification.created_at).toLocaleDateString()}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
            </TouchableOpacity>
          ))}
        </Card>
      </View>
    );
  };

  // 6. Quick Filters/Tags
  const renderQuickFiltersSection = () => {
    // Popular search tags/filters
    const quickFilters = [
      { id: 'electronics', name: 'Electronics', icon: 'phone-portrait-outline' as const },
      { id: 'furniture', name: 'Furniture', icon: 'bed-outline' as const },
      { id: 'books', name: 'Books', icon: 'book-outline' as const },
      { id: 'clothing', name: 'Clothing', icon: 'shirt-outline' as const },
      { id: 'kitchen', name: 'Kitchen', icon: 'restaurant-outline' as const },
      { id: 'sports', name: 'Sports', icon: 'basketball-outline' as const },
    ];
    
    return (
      <View style={styles.quickFiltersContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickFiltersContent}
        >
          {quickFilters.map((filter) => (
            <TouchableOpacity 
              key={filter.id}
              style={[styles.quickFilterItem, { backgroundColor: colors.cardBackground }]}
              onPress={() => router.push(`/marketplace?category=${filter.id}`)}
            >
              <View style={[styles.quickFilterIcon, { backgroundColor: colors.neutral2 }]}>
                <Ionicons name={filter.icon} size={18} color={colors.tint} />
              </View>
              <Text style={[styles.quickFilterText, { color: colors.text }]}>
                {filter.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // 7. Deals/Discounts Section
  const renderDealsSection = () => {
    if (!dealsProducts || dealsProducts.length === 0) return null;
    
    return (
      <View style={[styles.sectionContainer, { backgroundColor: colors.background }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Hot Deals & Discounts
          </Text>
          <TouchableOpacity onPress={() => router.push("/marketplace?discount=true")}>
            <Text style={[styles.seeAllText, { color: colors.tint }]}>
              See All
            </Text>
          </TouchableOpacity>
        </View>

        {dealsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
          </View>
        ) : dealsProducts && dealsProducts.length > 0 ? (
          <FlatList
            data={dealsProducts}
            renderItem={({ item }) => (
              <ProductCard
                product={item}
                onPress={() => router.push(`/product/${item.id}`)}
                style={styles.featuredProductCard}
              />
            )}
            keyExtractor={(item) => `deal-${item.id}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredList}
          />
        ) : (
          <Card variant="outlined" style={styles.emptyCard}>
            <Text style={[styles.emptyText, { color: colors.textDim }]}>
              No deals available at the moment
            </Text>
          </Card>
        )}
      </View>
    );
  };

  // 8. Location-Based Listings
  const renderNearbyItemsSection = () => {
    if (!userLocation || !nearbyItems || nearbyItems.length === 0) return null;
    
    return (
      <View style={[styles.sectionContainer, { backgroundColor: colors.background }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Items Near You
          </Text>
          <TouchableOpacity onPress={() => router.push("/marketplace?nearby=true")}>
            <Text style={[styles.seeAllText, { color: colors.tint }]}>
              See All
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={nearbyItems}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => router.push(`/product/${item.id}`)}
              style={styles.featuredProductCard}
            />
          )}
          keyExtractor={(item) => `nearby-${item.id}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredList}
          ListEmptyComponent={() => (
            <Text style={[styles.emptyText, { color: colors.textDim, padding: 20 }]}>
              No items near your location
            </Text>
          )}
        />
      </View>
    );
  };

  // 9. Search History
  const renderSearchHistorySection = () => {
    if (searchHistory.length === 0) return null;
    
    return (
      <View style={styles.searchHistoryContainer}>
        <Text style={[styles.searchHistoryTitle, { color: colors.textDim }]}>
          Recent Searches
        </Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.searchHistoryContent}
        >
          {searchHistory.map((term, index) => (
            <TouchableOpacity 
              key={`search-${index}`} 
              style={[styles.searchHistoryItem, { backgroundColor: colors.neutral2 }]}
              onPress={() => {
                setSearchQuery(term);
                router.push({
                  pathname: "/marketplace",
                  params: { search: term },
                });
              }}
            >
              <Ionicons name="search-outline" size={14} color={colors.text} />
              <Text style={[styles.searchHistoryText, { color: colors.text }]}>
                {term}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // 10. Popular/Trending Items
  const renderTrendingSection = () => {
    return (
      <View style={[styles.sectionContainer, { backgroundColor: colors.background }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="trending-up" size={22} color={colors.tint} style={styles.sectionIcon} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Trending Now
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.seeAllButton}
            onPress={() => router.push("/marketplace?trending=true")}
          >
            <Text style={[styles.seeAllText, { color: colors.tint }]}>
              See All
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.tint} />
          </TouchableOpacity>
        </View>

        {trendingLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
          </View>
        ) : trendingProducts && trendingProducts.length > 0 ? (
          <FlatList
            data={trendingProducts}
            renderItem={({ item }) => (
              <ProductCard
                product={item}
                onPress={() => router.push(`/product/${item.id}`)}
                style={styles.featuredProductCard}
              />
            )}
            keyExtractor={(item) => `trending-${item.id}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredList}
          />
        ) : (
          <Card variant="outlined" style={styles.emptyCard}>
            <Text style={[styles.emptyText, { color: colors.textDim }]}>
              No trending items available
            </Text>
          </Card>
        )}
      </View>
    )
  };

  return (
    <ScreenContainer scrollable refreshing={refreshing} onRefresh={onRefresh}>
      <View style={styles.container}>
        {renderWelcomeSection()}

        {/* Search History */}
        {searchHistory.length > 0 && renderSearchHistorySection()}
        
        {/* Banner Carousel */}
        {bannersLoading ? (
          <View style={[styles.bannerPlaceholder, { backgroundColor: colors.neutral2 }]}>
            <ActivityIndicator size="large" color={colors.tint} />
          </View>
        ) : banners &&
          banners.filter((b) => b.type === "carousel").length > 0 ? (
          <BannerCarousel
            banners={banners.filter((b) => b.type === "carousel")}
            onBannerPress={handleBannerPress}
          />
        ) : null}

        {/* Quick Filters */}
        {renderQuickFiltersSection()}

        {/* Categories */}
        {renderCategoriesSection()}
        
        {/* User Activity Dashboard for logged in users */}
        {user && renderUserActivitySection()}
        
        {/* Trending Now */}
        {renderTrendingSection()}

        {/* Featured Items */}
        {renderFeaturedSection()}
        
        {/* Deals & Discounts */}
        {dealsProducts && dealsProducts.length > 0 && renderDealsSection()}
        
        {/* Promotional Banner */}
        {renderPromotionalBanner()}
        
        {/* Personalized Recommendations */}
        {recommendedProducts && recommendedProducts.length > 0 && renderRecommendationsSection()}
        
        {/* Items Near You */}
        {nearbyItems && nearbyItems.length > 0 && renderNearbyItemsSection()}
        
        {/* Recently Viewed */}
        {recentlyViewed.length > 0 && renderRecentlyViewedSection()}
        
        {/* Recent Items */}
        {renderRecentSection()}
        
        {/* Wishlist */}
        {savedItems.length > 0 && renderSavedItemsSection()}
        
        {/* Notifications */}
        {notifications.length > 0 && renderNotificationsSection()}
        
        {/* Sell Section */}
        {renderSellSection()}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 32,
  },
  welcomeSection: {
    padding: 24,
    paddingTop: 32,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "bold",
    fontFamily: "Poppins-Bold",
    marginBottom: 18,
  },
  searchContainer: {
    marginBottom: 12,
  },
  bannerPlaceholder: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    marginHorizontal: 16,
  },
  sectionContainer: {
    marginTop: 24,
    marginHorizontal: 12,
    borderRadius: 24,
    overflow: 'hidden',
    paddingVertical: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "Poppins-SemiBold",
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: 'transparent',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  seeAllText: {
    fontSize: 15,
    fontFamily: "Poppins-Regular",
    marginRight: 4,
  },
  featuredList: {
    paddingHorizontal: 12,
  },
  featuredProductCard: {
    width: 220,
    marginHorizontal: 10,
  },
  recentProductsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  productCardContainer: {
    width: '50%', 
    padding: 8,
    marginBottom: 16,
    minHeight: 320,
  },
  recentProductCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  viewMoreButton: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 16,
    borderRadius: 16,
    paddingVertical: 12,
  },
  sellCard: {
    margin: 20,
    borderRadius: 22,
    overflow: "hidden",
    padding: 0,
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  sellCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 24,
    borderRadius: 22,
    backgroundColor: 'rgba(44, 182, 125, 0.1)', // Light tint color background
  },
  sellCardTextContainer: {
    flex: 1,
    marginRight: 18,
  },
  sellCardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "Poppins-Bold",
    marginBottom: 6,
  },
  sellCardDescription: {
    fontSize: 15,
    fontFamily: "Poppins-Regular",
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  activityCard: {
    margin: 20,
    borderRadius: 22,
    overflow: "hidden",
    padding: 0,
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 5,
  },
  activityTitle: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "Poppins-Bold",
    marginBottom: 12,
    padding: 24,
  },
  activityGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  activityItem: {
    alignItems: "center",
    width: '30%',
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  activityCount: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "Poppins-Bold",
    marginLeft: 12,
  },
  activityLabel: {
    fontSize: 15,
    fontFamily: "Poppins-Regular",
  },
  notificationsCard: {
    margin: 20,
    borderRadius: 22,
    overflow: "hidden",
    padding: 0,
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 24,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationContent: {
    flex: 1,
    marginLeft: 12,
  },
  notificationText: {
    fontSize: 15,
    fontFamily: "Poppins-Regular",
  },
  notificationTime: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
  },
  quickFiltersContainer: {
    margin: 20,
    padding: 16,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  quickFiltersContent: {
    paddingVertical: 8,
  },
  quickFilterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  quickFilterIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  quickFilterText: {
    fontSize: 15,
    fontFamily: "Poppins-Regular",
  },
  searchHistoryContainer: {
    margin: 20,
    borderRadius: 22,
    overflow: "hidden",
    padding: 0,
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  searchHistoryTitle: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "Poppins-Bold",
    marginBottom: 12,
    padding: 24,
  },
  searchHistoryContent: {
    padding: 24,
  },
  searchHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    marginRight: 12,
  },
  searchHistoryText: {
    fontSize: 15,
    fontFamily: "Poppins-Regular",
    marginLeft: 6,
  },
  sellButton: {
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  loader: {
    padding: 24,
  },
  emptyCard: {
    marginHorizontal: 20,
    alignItems: "center",
    padding: 32,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: "Poppins-Regular",
  },
  badgeContainer: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#4CAF50", // Green
    borderRadius: 10,
    padding: 2,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "Poppins-Bold",
    color: "#FFFFFF", // White
  },
});
