export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      articles: {
        Row: {
          author_id: string | null
          category: string | null
          content: string
          cover_image: string | null
          created_at: string
          excerpt: string | null
          id: string
          published: boolean
          published_at: string | null
          slug: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published?: boolean
          published_at?: string | null
          slug: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published?: boolean
          published_at?: string | null
          slug?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          created_by: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          max_uses: number | null
          note: string
          times_used: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          created_by?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          note?: string
          times_used?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          created_by?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          note?: string
          times_used?: number
          updated_at?: string
        }
        Relationships: []
      }
      experts: {
        Row: {
          active: boolean
          answers_count: number
          bio: string
          created_at: string
          followers: string
          id: string
          initials: string
          name: string
          positive: string
          rating: number
          slug: string
          title: string
          tone: string
          updated_at: string
          years: string
        }
        Insert: {
          active?: boolean
          answers_count?: number
          bio?: string
          created_at?: string
          followers?: string
          id?: string
          initials?: string
          name: string
          positive?: string
          rating?: number
          slug: string
          title?: string
          tone?: string
          updated_at?: string
          years?: string
        }
        Update: {
          active?: boolean
          answers_count?: number
          bio?: string
          created_at?: string
          followers?: string
          id?: string
          initials?: string
          name?: string
          positive?: string
          rating?: number
          slug?: string
          title?: string
          tone?: string
          updated_at?: string
          years?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          name: string
          order_id: string
          product_id: string | null
          quantity: number
          subtotal: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          order_id: string
          product_id?: string | null
          quantity?: number
          subtotal?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          order_id?: string
          product_id?: string | null
          quantity?: number
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          coupon_code: string | null
          created_at: string
          currency: string
          customer_email: string
          customer_name: string
          customer_phone: string
          discount: number
          id: string
          notes: string
          order_number: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          shipping_address: string
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          coupon_code?: string | null
          created_at?: string
          currency?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          discount?: number
          id?: string
          notes?: string
          order_number?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          shipping_address?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          coupon_code?: string | null
          created_at?: string
          currency?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          discount?: number
          id?: string
          notes?: string
          order_number?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          shipping_address?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          brand: string | null
          category: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          image_url: string | null
          ingredients: string[]
          name: string
          price: number
          stock: number
          tags: string[]
          updated_at: string
        }
        Insert: {
          active?: boolean
          brand?: string | null
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          image_url?: string | null
          ingredients?: string[]
          name: string
          price?: number
          stock?: number
          tags?: string[]
          updated_at?: string
        }
        Update: {
          active?: boolean
          brand?: string | null
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          image_url?: string | null
          ingredients?: string[]
          name?: string
          price?: number
          stock?: number
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          full_name: string | null
          gender: string | null
          id: string
          onboarding_completed: boolean
          preferred_language: string
          primary_concern: string | null
          skin_goals: string[]
          skin_type: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string | null
          gender?: string | null
          id: string
          onboarding_completed?: boolean
          preferred_language?: string
          primary_concern?: string | null
          skin_goals?: string[]
          skin_type?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          onboarding_completed?: boolean
          preferred_language?: string
          primary_concern?: string | null
          skin_goals?: string[]
          skin_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reminder_logs: {
        Row: {
          created_at: string
          id: string
          reminder_id: string
          scheduled_date: string
          snoozed_until: string | null
          status: Database["public"]["Enums"]["reminder_log_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reminder_id: string
          scheduled_date: string
          snoozed_until?: string | null
          status?: Database["public"]["Enums"]["reminder_log_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reminder_id?: string
          scheduled_date?: string
          snoozed_until?: string | null
          status?: Database["public"]["Enums"]["reminder_log_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_logs_reminder_id_fkey"
            columns: ["reminder_id"]
            isOneToOne: false
            referencedRelation: "reminders"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          active: boolean
          category: Database["public"]["Enums"]["reminder_category"]
          created_at: string
          end_date: string | null
          id: string
          name: string
          note: string | null
          notify_minutes_before: number
          repeat: Database["public"]["Enums"]["reminder_repeat"]
          repeat_days: number[]
          start_date: string
          steps: Json
          time_of_day: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          category?: Database["public"]["Enums"]["reminder_category"]
          created_at?: string
          end_date?: string | null
          id?: string
          name: string
          note?: string | null
          notify_minutes_before?: number
          repeat?: Database["public"]["Enums"]["reminder_repeat"]
          repeat_days?: number[]
          start_date?: string
          steps?: Json
          time_of_day?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          category?: Database["public"]["Enums"]["reminder_category"]
          created_at?: string
          end_date?: string | null
          id?: string
          name?: string
          note?: string | null
          notify_minutes_before?: number
          repeat?: Database["public"]["Enums"]["reminder_repeat"]
          repeat_days?: number[]
          start_date?: string
          steps?: Json
          time_of_day?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      skin_scans: {
        Row: {
          concerns: Json
          created_at: string
          face_fingerprint_hash: string | null
          id: string
          image_hash: string | null
          metrics: Json
          model: string | null
          overall_score: number
          recommendations: Json
          scan_type: string
          share_token: string | null
          skin_age: number | null
          skin_type: string | null
          summary: string | null
          user_id: string
        }
        Insert: {
          concerns?: Json
          created_at?: string
          face_fingerprint_hash?: string | null
          id?: string
          image_hash?: string | null
          metrics?: Json
          model?: string | null
          overall_score: number
          recommendations?: Json
          scan_type?: string
          share_token?: string | null
          skin_age?: number | null
          skin_type?: string | null
          summary?: string | null
          user_id: string
        }
        Update: {
          concerns?: Json
          created_at?: string
          face_fingerprint_hash?: string | null
          id?: string
          image_hash?: string | null
          metrics?: Json
          model?: string | null
          overall_score?: number
          recommendations?: Json
          scan_type?: string
          share_token?: string | null
          skin_age?: number | null
          skin_type?: string | null
          summary?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      redeem_coupon: {
        Args: { _code: string }
        Returns: {
          code: string
          discount_type: string
          discount_value: number
          id: string
          status: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded"
      payment_status: "unpaid" | "paid" | "failed" | "refunded"
      reminder_category: "routine" | "product" | "lifestyle" | "appointment"
      reminder_log_status: "completed" | "missed" | "snoozed" | "upcoming"
      reminder_repeat:
        | "once"
        | "daily"
        | "weekly"
        | "weekdays"
        | "weekends"
        | "custom"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      order_status: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      payment_status: ["unpaid", "paid", "failed", "refunded"],
      reminder_category: ["routine", "product", "lifestyle", "appointment"],
      reminder_log_status: ["completed", "missed", "snoozed", "upcoming"],
      reminder_repeat: [
        "once",
        "daily",
        "weekly",
        "weekdays",
        "weekends",
        "custom",
      ],
    },
  },
} as const
