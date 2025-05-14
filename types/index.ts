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

// Filter types
export interface FilterOptions {
  priceRange: [number, number]
  condition: ProductCondition[]
  sortBy: "newest" | "oldest" | "price_low_high" | "price_high_low"
}
