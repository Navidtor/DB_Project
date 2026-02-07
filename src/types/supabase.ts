// Supabase generated types placeholder
// This file should contain auto-generated types from Supabase
// Run `npx supabase gen types typescript` to generate actual types

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          user_id: string
          name: string
          username: string
          email: string
          phone: string | null
          password_hash: string
          profile_image: string | null
          created_at: string
          user_type: 'regular' | 'moderator' | 'admin'
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      profiles: {
        Row: {
          profile_id: string
          user_id: string
          bio: string | null
          cover_image: string | null
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'profile_id'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      posts: {
        Row: {
          post_id: string
          user_id: string
          place_id: string | null
          city_id: string | null
          title: string
          content: string
          experience_type: 'visited' | 'imagined'
          approval_status: 'pending' | 'approved' | 'rejected'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['posts']['Row'], 'post_id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['posts']['Insert']>
      }
      comments: {
        Row: {
          comment_id: string
          post_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['comments']['Row'], 'comment_id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['comments']['Insert']>
      }
      ratings: {
        Row: {
          user_id: string
          post_id: string
          score: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['ratings']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['ratings']['Insert']>
      }
      follows: {
        Row: {
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['follows']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['follows']['Insert']>
      }
      companion_requests: {
        Row: {
          request_id: string
          user_id: string
          destination_place_id: string | null
          destination_city_id: string | null
          travel_date: string
          description: string
          status: 'active' | 'completed' | 'cancelled'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['companion_requests']['Row'], 'request_id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['companion_requests']['Insert']>
      }
      companion_matches: {
        Row: {
          match_id: string
          request_id: string
          companion_user_id: string
          status: 'pending' | 'accepted' | 'rejected'
          message: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['companion_matches']['Row'], 'match_id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['companion_matches']['Insert']>
      }
      cities: {
        Row: {
          city_id: string
          name: string
          province: string
          description: string | null
        }
        Insert: Omit<Database['public']['Tables']['cities']['Row'], 'city_id'>
        Update: Partial<Database['public']['Tables']['cities']['Insert']>
      }
      places: {
        Row: {
          place_id: string
          city_id: string
          name: string
          description: string | null
          latitude: number | null
          longitude: number | null
          map_url: string | null
        }
        Insert: Omit<Database['public']['Tables']['places']['Row'], 'place_id'>
        Update: Partial<Database['public']['Tables']['places']['Insert']>
      }
    }
    Views: {
      profiles_with_counts: {
        Row: {
          profile_id: string
          user_id: string
          bio: string | null
          cover_image: string | null
          followers_count: number
          following_count: number
        }
      }
      posts_with_rating: {
        Row: {
          post_id: string
          user_id: string
          place_id: string | null
          city_id: string | null
          title: string
          content: string
          experience_type: 'visited' | 'imagined'
          approval_status: 'pending' | 'approved' | 'rejected'
          created_at: string
          avg_rating: number
          rating_count: number
        }
      }
    }
    Functions: Record<string, never>
    Enums: {
      user_type: 'regular' | 'moderator' | 'admin'
      experience_type: 'visited' | 'imagined'
      approval_status: 'pending' | 'approved' | 'rejected'
      request_status: 'active' | 'completed' | 'cancelled'
      match_status: 'pending' | 'accepted' | 'rejected'
      experience_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
      access_level: 'limited' | 'standard' | 'full'
    }
  }
}
