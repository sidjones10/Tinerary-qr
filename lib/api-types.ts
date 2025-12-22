// API Response Types
export interface ApiResponse<T> {
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  meta?: {
    pagination?: {
      total: number
      page: number
      pageSize: number
      pageCount: number
    }
  }
}

// Authentication Types
export interface User {
  id: string
  email: string
  name: string
  username: string
  avatar?: string
  createdAt: string
  preferences?: UserPreferences
}

export interface UserPreferences {
  currency: string
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
  }
  theme: "light" | "dark" | "system"
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
  username?: string
}

export interface AuthResponse {
  user: User
  token: string
}

// Itinerary Types
export interface Itinerary {
  id: string
  title: string
  description?: string
  type: "trip" | "event"
  startDate: string
  endDate?: string
  location: string
  coverImage?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  isPublic: boolean
  isPromoted: boolean
  activities: Activity[]
  collaborators: Collaborator[]
  expenses?: Expense[]
  likes: number
  saves: number
  views: number
  customization?: ItineraryCustomization
}

export interface ItineraryCustomization {
  background?: {
    type: "gradient" | "image" | "color"
    value: string
  }
  effects?: {
    opacity: number
    blur: number
  }
  theme?: string
}

export interface Activity {
  id: string
  itineraryId: string
  title: string
  description?: string
  location?: string
  date: string
  time?: string
  day?: string
  duration?: number
  type?: string
  requiresRsvp?: boolean
  rsvp?: {
    yes: number
    no: number
    maybe: number
  }
}

export interface Collaborator {
  id: string
  userId: string
  itineraryId: string
  name: string
  email: string
  role: "owner" | "editor" | "viewer"
  status: "accepted" | "pending" | "declined"
  invitedAt: string
  respondedAt?: string
}

export interface CreateItineraryRequest {
  title: string
  description?: string
  type: "trip" | "event"
  startDate: string
  endDate?: string
  location: string
  coverImage?: string
  isPublic?: boolean
  activities?: Omit<Activity, "id" | "itineraryId">[]
  collaborators?: {
    email: string
    role: "editor" | "viewer"
  }[]
}

export interface UpdateItineraryRequest {
  title?: string
  description?: string
  startDate?: string
  endDate?: string
  location?: string
  coverImage?: string
  isPublic?: boolean
  customization?: ItineraryCustomization
}

// Expense Types
export interface Expense {
  id: string
  itineraryId: string
  name: string
  amount: number
  currency: string
  category: string
  date: string
  paidBy: string
  splitBetween: string[]
  receipt?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface CreateExpenseRequest {
  itineraryId: string
  name: string
  amount: number
  currency: string
  category: string
  date: string
  paidBy: string
  splitBetween: string[]
  receipt?: string
  notes?: string
}

// Packing List Types
export interface PackingItem {
  id: string
  itineraryId: string
  name: string
  category: string
  packed: boolean
  url?: string
  assignedTo?: string
  createdAt: string
  updatedAt: string
}

export interface CreatePackingItemRequest {
  itineraryId: string
  name: string
  category: string
  url?: string
  assignedTo?: string
}

// Photo Gallery Types
export interface Photo {
  id: string
  itineraryId: string
  url: string
  caption?: string
  day?: string
  location?: string
  uploadedBy: string
  createdAt: string
}

// Promotion Types
export interface Promotion {
  id: string
  type: "business" | "personal"
  title: string
  description?: string
  location: string
  startDate: string
  endDate: string
  website?: string
  image?: string
  budget: number
  duration: number
  targeting?: {
    ageRange?: [number, number]
    interests?: string[]
    geography?: "local" | "regional" | "national" | "international"
    travelStatus?: "planning" | "currently" | "both"
  }
  status: "active" | "pending" | "completed" | "rejected"
  createdBy: string
  createdAt: string
  updatedAt: string
  impressions: number
  clicks: number
  saves: number
}

export interface CreatePromotionRequest {
  type: "business" | "personal"
  title: string
  description?: string
  location: string
  startDate: string
  endDate: string
  website?: string
  image?: string
  budget: number
  duration: number
  targeting?: {
    ageRange?: [number, number]
    interests?: string[]
    geography?: "local" | "regional" | "national" | "international"
    travelStatus?: "planning" | "currently" | "both"
  }
}

// Deal Types
export interface Deal {
  id: string
  title: string
  type: "hotel" | "flight" | "activity" | "restaurant"
  image: string
  location: string
  price: number
  originalPrice: number
  discount: number
  validUntil: string
  description: string
  provider: string
  rating: number
  url?: string
  createdAt: string
  updatedAt: string
}

// Comment Types
export interface Comment {
  id: string
  itineraryId: string
  userId: string
  userName: string
  userAvatar?: string
  content: string
  createdAt: string
  updatedAt?: string
}

export interface CreateCommentRequest {
  itineraryId: string
  content: string
}

// Search Types
export interface SearchRequest {
  query: string
  filters?: {
    type?: "trip" | "event" | "business"
    location?: string
    startDate?: string
    endDate?: string
    category?: string
  }
  page?: number
  pageSize?: number
}

export interface SearchResponse {
  results: (Itinerary | Deal | Promotion)[]
  meta: {
    pagination: {
      total: number
      page: number
      pageSize: number
      pageCount: number
    }
  }
}
