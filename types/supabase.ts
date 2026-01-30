export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      activities: {
        Row: {
          id: string
          itinerary_id: string
          title: string
          description: string | null
          location: string | null
          start_time: string
          end_time: string | null
          type: string
          cost: number | null
          currency: string | null
          booking_reference: string | null
          booking_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          itinerary_id: string
          title: string
          description?: string | null
          location?: string | null
          start_time: string
          end_time?: string | null
          type: string
          cost?: number | null
          currency?: string | null
          booking_reference?: string | null
          booking_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          itinerary_id?: string
          title?: string
          description?: string | null
          location?: string | null
          start_time?: string
          end_time?: string | null
          type?: string
          cost?: number | null
          currency?: string | null
          booking_reference?: string | null
          booking_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itineraries"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          id: string
          itinerary_id: string
          activity_id: string | null
          title: string
          amount: number
          currency: string
          date: string
          category: string
          paid_by: string | null
          split_with: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          itinerary_id: string
          activity_id?: string | null
          title: string
          amount: number
          currency: string
          date: string
          category: string
          paid_by?: string | null
          split_with?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          itinerary_id?: string
          activity_id?: string | null
          title?: string
          amount?: number
          currency?: string
          date?: string
          category?: string
          paid_by?: string | null
          split_with?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itineraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      itineraries: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          start_date: string
          end_date: string
          location: string | null
          image_url: string | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          start_date: string
          end_date: string
          location?: string | null
          image_url?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          start_date?: string
          end_date?: string
          location?: string | null
          image_url?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "itineraries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary_shares: {
        Row: {
          id: string
          itinerary_id: string
          user_id: string
          permission: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          itinerary_id: string
          user_id: string
          permission?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          itinerary_id?: string
          user_id?: string
          permission?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_shares_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itineraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itinerary_shares_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: string
          read: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: string
          read?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: string
          read?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          id: string
          created_at: string
          phone: string | null
          email: string | null
          name: string | null
          avatar_url: string | null
          updated_at: string
          role: string
          preferences: Json | null
        }
        Insert: {
          id: string
          created_at?: string
          phone: string | null
          email?: string | null
          name?: string | null
          avatar_url?: string | null
          updated_at?: string
          role?: string
          preferences?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          phone: string | null
          email?: string | null
          name?: string | null
          avatar_url?: string | null
          updated_at?: string
          role?: string
          preferences?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
