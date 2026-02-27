export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          name: string | null
          username: string | null
          bio: string | null
          location: string | null
          website: string | null
          avatar_url: string | null
          phone: string | null
          is_admin: boolean
          followers_count: number
          following_count: number
          date_of_birth: string | null
          account_type: "minor" | "standard" | "business" | null
          tos_accepted_at: string | null
          tos_version: string | null
          privacy_policy_accepted_at: string | null
          privacy_policy_version: string | null
          parental_consent: boolean | null
          location_tracking_consent: boolean | null
          marketing_consent: boolean | null
          activity_digest_consent: boolean | null
          data_processing_consent: boolean | null
          browsing_emails_consent: boolean | null
          email_notifications: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          name?: string | null
          username?: string | null
          bio?: string | null
          location?: string | null
          website?: string | null
          avatar_url?: string | null
          phone?: string | null
          is_admin?: boolean
          followers_count?: number
          following_count?: number
          date_of_birth?: string | null
          account_type?: "minor" | "standard" | "business" | null
          tos_accepted_at?: string | null
          tos_version?: string | null
          privacy_policy_accepted_at?: string | null
          privacy_policy_version?: string | null
          parental_consent?: boolean | null
          location_tracking_consent?: boolean | null
          marketing_consent?: boolean | null
          activity_digest_consent?: boolean | null
          data_processing_consent?: boolean | null
          browsing_emails_consent?: boolean | null
          email_notifications?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          name?: string | null
          username?: string | null
          bio?: string | null
          location?: string | null
          website?: string | null
          avatar_url?: string | null
          phone?: string | null
          is_admin?: boolean
          followers_count?: number
          following_count?: number
          date_of_birth?: string | null
          account_type?: "minor" | "standard" | "business" | null
          tos_accepted_at?: string | null
          tos_version?: string | null
          privacy_policy_accepted_at?: string | null
          privacy_policy_version?: string | null
          parental_consent?: boolean | null
          location_tracking_consent?: boolean | null
          marketing_consent?: boolean | null
          activity_digest_consent?: boolean | null
          data_processing_consent?: boolean | null
          browsing_emails_consent?: boolean | null
          email_notifications?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      itineraries: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          destination: string | null
          location: string | null
          start_date: string | null
          end_date: string | null
          is_public: boolean
          image_url: string | null
          theme: string | null
          font: string | null
          currency: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          destination?: string | null
          location?: string | null
          start_date?: string | null
          end_date?: string | null
          is_public?: boolean
          image_url?: string | null
          theme?: string | null
          font?: string | null
          currency?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          destination?: string | null
          location?: string | null
          start_date?: string | null
          end_date?: string | null
          is_public?: boolean
          image_url?: string | null
          theme?: string | null
          font?: string | null
          currency?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      activities: {
        Row: {
          id: string
          itinerary_id: string
          title: string
          description: string | null
          location: string | null
          start_time: string | null
          end_time: string | null
          day_number: number | null
          order_index: number
          category: string | null
          cost: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          itinerary_id: string
          title: string
          description?: string | null
          location?: string | null
          start_time?: string | null
          end_time?: string | null
          day_number?: number | null
          order_index?: number
          category?: string | null
          cost?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          itinerary_id?: string
          title?: string
          description?: string | null
          location?: string | null
          start_time?: string | null
          end_time?: string | null
          day_number?: number | null
          order_index?: number
          category?: string | null
          cost?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          itinerary_id: string
          user_id: string
          parent_comment_id: string | null
          content: string
          is_edited: boolean
          edited_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          itinerary_id: string
          user_id: string
          parent_comment_id?: string | null
          content: string
          is_edited?: boolean
          edited_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          itinerary_id?: string
          user_id?: string
          parent_comment_id?: string | null
          content?: string
          is_edited?: boolean
          edited_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          link_url: string | null
          image_url: string | null
          metadata: Json | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          link_url?: string | null
          image_url?: string | null
          metadata?: Json | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          link_url?: string | null
          image_url?: string | null
          metadata?: Json | null
          is_read?: boolean
          created_at?: string
        }
      }
      saved_itineraries: {
        Row: {
          id: string
          user_id: string
          itinerary_id: string
          type: "like" | "save"
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          itinerary_id: string
          type: "like" | "save"
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          itinerary_id?: string
          type?: "like" | "save"
          created_at?: string
        }
      }
      user_follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
      }
      itinerary_metrics: {
        Row: {
          id: string
          itinerary_id: string
          view_count: number
          like_count: number
          save_count: number
          comment_count: number
          share_count: number
          trending_score: number | null
          updated_at: string
        }
        Insert: {
          id?: string
          itinerary_id: string
          view_count?: number
          like_count?: number
          save_count?: number
          comment_count?: number
          share_count?: number
          trending_score?: number | null
          updated_at?: string
        }
        Update: {
          id?: string
          itinerary_id?: string
          view_count?: number
          like_count?: number
          save_count?: number
          comment_count?: number
          share_count?: number
          trending_score?: number | null
          updated_at?: string
        }
      }
      itinerary_categories: {
        Row: {
          id: string
          itinerary_id: string
          category: string
          created_at: string
        }
        Insert: {
          id?: string
          itinerary_id: string
          category: string
          created_at?: string
        }
        Update: {
          id?: string
          itinerary_id?: string
          category?: string
          created_at?: string
        }
      }
      consent_records: {
        Row: {
          id: string
          user_id: string
          consent_type: string
          consent_version: string
          consent_given: boolean
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          consent_type: string
          consent_version: string
          consent_given: boolean
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          consent_type?: string
          consent_version?: string
          consent_given?: boolean
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      user_behavior: {
        Row: {
          id: string
          user_id: string
          viewed_itineraries: string[] | null
          saved_itineraries: string[] | null
          liked_itineraries: string[] | null
          search_history: string[] | null
          last_active_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          viewed_itineraries?: string[] | null
          saved_itineraries?: string[] | null
          liked_itineraries?: string[] | null
          search_history?: string[] | null
          last_active_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          viewed_itineraries?: string[] | null
          saved_itineraries?: string[] | null
          liked_itineraries?: string[] | null
          search_history?: string[] | null
          last_active_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          itinerary_id: string
          title: string | null
          description: string | null
          amount: number
          currency: string
          category: string | null
          paid_by: string | null
          split_between: string[] | null
          date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          itinerary_id: string
          title?: string | null
          description?: string | null
          amount: number
          currency?: string
          category?: string | null
          paid_by?: string | null
          split_between?: string[] | null
          date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          itinerary_id?: string
          title?: string | null
          description?: string | null
          amount?: number
          currency?: string
          category?: string | null
          paid_by?: string | null
          split_between?: string[] | null
          date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      businesses: {
        Row: {
          id: string
          name: string
          description: string | null
          logo: string | null
          website: string | null
          category: string
          subcategory: string | null
          rating: number | null
          review_count: number | null
          created_at: string
          updated_at: string
          user_id: string
          business_tier: "basic" | "premium" | "enterprise"
          branding_config: Json | null
          account_manager_id: string | null
          report_config: Json | null
          api_key: string | null
          api_enabled: boolean
          enterprise_badge_enabled: boolean
          priority_placement: boolean
          unlimited_mentions: boolean
          mention_highlights_used: number
          mention_highlights_reset_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          logo?: string | null
          website?: string | null
          category: string
          subcategory?: string | null
          rating?: number | null
          review_count?: number | null
          created_at?: string
          updated_at?: string
          user_id: string
          business_tier?: "basic" | "premium" | "enterprise"
          branding_config?: Json | null
          account_manager_id?: string | null
          report_config?: Json | null
          api_key?: string | null
          api_enabled?: boolean
          enterprise_badge_enabled?: boolean
          priority_placement?: boolean
          unlimited_mentions?: boolean
          mention_highlights_used?: number
          mention_highlights_reset_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          logo?: string | null
          website?: string | null
          category?: string
          subcategory?: string | null
          rating?: number | null
          review_count?: number | null
          created_at?: string
          updated_at?: string
          user_id?: string
          business_tier?: "basic" | "premium" | "enterprise"
          branding_config?: Json | null
          account_manager_id?: string | null
          report_config?: Json | null
          api_key?: string | null
          api_enabled?: boolean
          enterprise_badge_enabled?: boolean
          priority_placement?: boolean
          unlimited_mentions?: boolean
          mention_highlights_used?: number
          mention_highlights_reset_at?: string | null
        }
      }
      promotions: {
        Row: {
          id: string
          title: string
          description: string | null
          type: string
          category: string
          subcategory: string | null
          business_id: string
          location: string
          price: number | null
          currency: string | null
          discount: number | null
          original_price: number | null
          start_date: string
          end_date: string
          image: string | null
          images: string[] | null
          tags: string[] | null
          features: Json | null
          rank_score: number
          is_featured: boolean
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          type: string
          category: string
          subcategory?: string | null
          business_id: string
          location: string
          price?: number | null
          currency?: string | null
          discount?: number | null
          original_price?: number | null
          start_date: string
          end_date: string
          image?: string | null
          images?: string[] | null
          tags?: string[] | null
          features?: Json | null
          rank_score?: number
          is_featured?: boolean
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          type?: string
          category?: string
          subcategory?: string | null
          business_id?: string
          location?: string
          price?: number | null
          currency?: string | null
          discount?: number | null
          original_price?: number | null
          start_date?: string
          end_date?: string
          image?: string | null
          images?: string[] | null
          tags?: string[] | null
          features?: Json | null
          rank_score?: number
          is_featured?: boolean
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      promotion_metrics: {
        Row: {
          promotion_id: string
          views: number
          clicks: number
          saves: number
          shares: number
          ctr: number
          updated_at: string
        }
        Insert: {
          promotion_id: string
          views?: number
          clicks?: number
          saves?: number
          shares?: number
          ctr?: number
          updated_at?: string
        }
        Update: {
          promotion_id?: string
          views?: number
          clicks?: number
          saves?: number
          shares?: number
          ctr?: number
          updated_at?: string
        }
      }
      countdown_reminders: {
        Row: {
          id: string
          itinerary_id: string
          user_id: string
          reminder_type: string
          scheduled_for: string
          sent_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          itinerary_id: string
          user_id: string
          reminder_type: string
          scheduled_for: string
          sent_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          itinerary_id?: string
          user_id?: string
          reminder_type?: string
          scheduled_for?: string
          sent_at?: string | null
          created_at?: string
        }
      }
      business_subscriptions: {
        Row: {
          id: string
          business_id: string
          tier: "basic" | "premium" | "enterprise"
          status: "active" | "canceled" | "past_due"
          mention_highlights_used: number
          mention_highlights_reset_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          tier: "basic" | "premium" | "enterprise"
          status?: "active" | "canceled" | "past_due"
          mention_highlights_used?: number
          mention_highlights_reset_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          tier?: "basic" | "premium" | "enterprise"
          status?: "active" | "canceled" | "past_due"
          mention_highlights_used?: number
          mention_highlights_reset_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          promotion_id: string
          quantity: number
          total_price: number
          currency: string | null
          attendee_names: string | null
          attendee_emails: string | null
          special_requests: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          promotion_id: string
          quantity: number
          total_price: number
          currency?: string | null
          attendee_names?: string | null
          attendee_emails?: string | null
          special_requests?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          promotion_id?: string
          quantity?: number
          total_price?: number
          currency?: string | null
          attendee_names?: string | null
          attendee_emails?: string | null
          special_requests?: string | null
          status?: string
          created_at?: string
        }
      }
    }
    Functions: {
      toggle_like: {
        Args: { user_uuid: string; itinerary_uuid: string }
        Returns: { is_liked: boolean; new_like_count: number }[]
      }
      increment_promotion_views: {
        Args: { p_id: string }
        Returns: void
      }
      increment_promotion_clicks: {
        Args: { p_id: string }
        Returns: void
      }
      calculate_promotion_rank: {
        Args: { p_id: string }
        Returns: void
      }
    }
  }
}

// Helper types for easier use
export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type Itinerary = Database["public"]["Tables"]["itineraries"]["Row"]
export type Activity = Database["public"]["Tables"]["activities"]["Row"]
export type Comment = Database["public"]["Tables"]["comments"]["Row"]
export type Notification = Database["public"]["Tables"]["notifications"]["Row"]
export type SavedItinerary = Database["public"]["Tables"]["saved_itineraries"]["Row"]
export type UserFollow = Database["public"]["Tables"]["user_follows"]["Row"]
export type ItineraryMetrics = Database["public"]["Tables"]["itinerary_metrics"]["Row"]
export type Expense = Database["public"]["Tables"]["expenses"]["Row"]
export type BusinessSubscription = Database["public"]["Tables"]["business_subscriptions"]["Row"]
export type Booking = Database["public"]["Tables"]["bookings"]["Row"]
