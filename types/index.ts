// User types
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: "student" | "admin"
  isVerified: boolean
  profilePicture: string | null
  createdAt: string
  rating?: number
}

// Product types
export type ProductCondition = "new" | "like_new" | "good" | "used" | "worn"

export interface Product {
  id: string
  name: string
  price: number
  description: string
  categoryId: string
  condition: ProductCondition
  images: string[]
  tags: string[]
  isNegotiable: boolean
  isUrgent: boolean
  sellerId: string
  seller?: User
  createdAt: string
  updatedAt: string
  featured?: boolean
}

// Category types
export interface Category {
  id: string
  name: string
  icon: string
}

// Order types
export type OrderStatus = "pending" | "confirmed" | "delivered" | "cancelled"

export interface Order {
  id: string
  productId: string
  product?: Product
  buyerId: string
  buyer?: User
  sellerId: string
  seller?: User
  status: OrderStatus
  price: number
  paymentMethod: string
  deliveryAddress?: string
  deliveryNotes?: string
  createdAt: string
  updatedAt: string
}

// Chat types
export interface Message {
  id: string
  conversationId: string
  senderId: string
  text: string
  timestamp: string
  read: boolean
}

export interface Conversation {
  id: string
  participants: string[]
  otherUser: User
  lastMessage: {
    text: string
    timestamp: string
  }
  unreadCount: number
  productId?: string
  productName?: string
  productImage?: string
}

// Accommodation types
export interface AccommodationType {
  id: string
  name: string
  description?: string
  icon: string
}

export type AmenityCategory = "essential" | "feature" | "safety" | "location"

export interface Amenity {
  id: string
  name: string
  icon: string
  category: AmenityCategory
}

export interface AccommodationListing {
  id: string
  title: string
  description: string
  ownerId: string
  owner?: User
  typeId: string
  type?: AccommodationType
  amenities: string[]
  amenityDetails?: Amenity[]
  pricePerMonth: number
  securityDeposit?: number
  bedrooms: number
  bathrooms: number
  maxOccupants: number
  address: string
  locationLat?: number
  locationLng?: number
  images: string[]
  availableFrom: string
  minimumStayMonths: number
  isFurnished: boolean
  isVerified: boolean
  isActive: boolean
  featured: boolean
  createdAt: string
  updatedAt: string
  distance?: number // Calculated field for location-based searching
}

export type BookingStatus = "pending" | "approved" | "rejected" | "cancelled" | "completed"

export interface AccommodationBooking {
  id: string
  listingId: string
  listing?: AccommodationListing
  tenantId: string
  tenant?: User
  ownerId: string
  owner?: User
  status: BookingStatus
  moveInDate: string
  moveOutDate?: string
  monthlyRent: number
  securityDeposit?: number
  isDepositPaid: boolean
  specialRequests?: string
  createdAt: string
  updatedAt: string
}

export interface AccommodationReview {
  id: string
  listingId: string
  reviewerId: string
  reviewer?: User
  bookingId?: string
  rating: number
  reviewText?: string
  createdAt: string
}

// Filter types
export interface FilterOptions {
  priceRange: [number, number]
  condition: ProductCondition[]
  sortBy: "newest" | "oldest" | "price_low_high" | "price_high_low"
}

export interface AccommodationFilterOptions {
  priceRange: [number, number]
  bedrooms?: number[]
  bathrooms?: number[]
  accommodationType?: string[]
  amenities?: string[]
  availableFrom?: string
  isFurnished?: boolean
  sortBy: "newest" | "oldest" | "price_low_high" | "price_high_low" | "distance"
}

// Empty state types
export type EmptyStateType = 
  | "no_products" 
  | "no_favorites" 
  | "no_messages" 
  | "no_orders" 
  | "no_search_results"
  | "no_notifications"
  | "no_activity"
  | "no_connections"
  | "no_accommodation"
  | "no_bookings"

export interface EmptyState {
  type: EmptyStateType
  icon: string // Feather icon name
  title: string
  message: string
  action?: {
    label: string
    onPress: () => void
  }
}

// Predefined empty states
export const EMPTY_STATES: Record<EmptyStateType, EmptyState> = {
  no_products: {
    type: "no_products",
    icon: "shopping-bag",
    title: "No Products Yet",
    message: "Be the first to list an item for sale in your campus marketplace",
    action: {
      label: "List an Item",
      onPress: () => {} // This will be set dynamically
    }
  },
  no_favorites: {
    type: "no_favorites",
    icon: "heart",
    title: "No Favorites",
    message: "Items you favorite will appear here for quick access",
    action: {
      label: "Browse Products",
      onPress: () => {} // This will be set dynamically
    }
  },
  no_messages: {
    type: "no_messages",
    icon: "message-circle",
    title: "No Messages",
    message: "Start a conversation with sellers or buyers to discuss products",
    action: {
      label: "Browse Products",
      onPress: () => {} // This will be set dynamically
    }
  },
  no_orders: {
    type: "no_orders",
    icon: "package",
    title: "No Orders",
    message: "Your purchase and sale history will appear here",
    action: {
      label: "Start Shopping",
      onPress: () => {} // This will be set dynamically
    }
  },
  no_search_results: {
    type: "no_search_results",
    icon: "search",
    title: "No Results Found",
    message: "Try adjusting your search or filters to find what you're looking for",
    action: {
      label: "Clear Filters",
      onPress: () => {} // This will be set dynamically
    }
  },
  no_notifications: {
    type: "no_notifications",
    icon: "bell",
    title: "No Notifications",
    message: "You'll be notified about new messages, orders, and updates here",
  },
  no_activity: {
    type: "no_activity",
    icon: "activity",
    title: "No Recent Activity",
    message: "Your recent interactions and updates will appear here",
    action: {
      label: "Browse Products",
      onPress: () => {} // This will be set dynamically
    }
  },
  no_connections: {
    type: "no_connections",
    icon: "users",
    title: "No Connections",
    message: "Connect with other students to start trading",
    action: {
      label: "Find Students",
      onPress: () => {} // This will be set dynamically
    }
  },
  no_accommodation: {
    type: "no_accommodation",
    icon: "home",
    title: "No Accommodations Found",
    message: "Be the first to list your accommodation for students on campus",
    action: {
      label: "List Accommodation",
      onPress: () => {} // This will be set dynamically
    }
  },
  no_bookings: {
    type: "no_bookings",
    icon: "calendar",
    title: "No Bookings",
    message: "Your accommodation booking history will appear here",
    action: {
      label: "Find Accommodation",
      onPress: () => {} // This will be set dynamically
    }
  }
}
