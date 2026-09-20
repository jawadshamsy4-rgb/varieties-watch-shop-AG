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
      brands: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          label: string
          link_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          label?: string
          link_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          label?: string
          link_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      category_discounts: {
        Row: {
          category: string
          discount_type: string
          discount_value: number
          enabled: boolean
          id: string
          updated_at: string
        }
        Insert: {
          category: string
          discount_type?: string
          discount_value?: number
          enabled?: boolean
          id?: string
          updated_at?: string
        }
        Update: {
          category?: string
          discount_type?: string
          discount_value?: number
          enabled?: boolean
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      hero_slides: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          link_url: string | null
          pc_image_url: string | null
          phone_image_url: string | null
          tablet_image_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          link_url?: string | null
          pc_image_url?: string | null
          phone_image_url?: string | null
          tablet_image_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          link_url?: string | null
          pc_image_url?: string | null
          phone_image_url?: string | null
          tablet_image_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          address: string
          created_at: string
          delivery_charge: number
          id: string
          name: string
          order_number: string | null
          phone: string
          product: string
          quantity: number
          selected_perfumes: string[] | null
          status: string
          total_price: number
          variant: string
        }
        Insert: {
          address: string
          created_at?: string
          delivery_charge?: number
          id?: string
          name: string
          order_number?: string | null
          phone: string
          product: string
          quantity?: number
          selected_perfumes?: string[] | null
          status?: string
          total_price?: number
          variant: string
        }
        Update: {
          address?: string
          created_at?: string
          delivery_charge?: number
          id?: string
          name?: string
          order_number?: string | null
          phone?: string
          product?: string
          quantity?: number
          selected_perfumes?: string[] | null
          status?: string
          total_price?: number
          variant?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          badge: string | null
          brand: string
          category: string
          created_at: string
          description: string
          discount_enabled: boolean
          discount_type: string
          discount_value: number
          fragrance_details: Json
          id: string
          image_url: string
          in_stock: boolean
          is_trending: boolean
          name: string
          original_price: number | null
          price: number
          product_images: string[]
          rating: number
          review_count: number
          reviews: Json
          story: string
          tagline: string
          updated_at: string
          variants: Json
        }
        Insert: {
          badge?: string | null
          brand?: string
          category?: string
          created_at?: string
          description?: string
          discount_enabled?: boolean
          discount_type?: string
          discount_value?: number
          fragrance_details?: Json
          id?: string
          image_url?: string
          in_stock?: boolean
          is_trending?: boolean
          name: string
          original_price?: number | null
          price?: number
          product_images?: string[]
          rating?: number
          review_count?: number
          reviews?: Json
          story?: string
          tagline?: string
          updated_at?: string
          variants?: Json
        }
        Update: {
          badge?: string | null
          brand?: string
          category?: string
          created_at?: string
          description?: string
          discount_enabled?: boolean
          discount_type?: string
          discount_value?: number
          fragrance_details?: Json
          id?: string
          image_url?: string
          in_stock?: boolean
          is_trending?: boolean
          name?: string
          original_price?: number | null
          price?: number
          product_images?: string[]
          rating?: number
          review_count?: number
          reviews?: Json
          story?: string
          tagline?: string
          updated_at?: string
          variants?: Json
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string
          created_at: string
          id: string
          name: string
          product_id: string
          rating: number
          verified: boolean
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          name: string
          product_id: string
          rating?: number
          verified?: boolean
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          name?: string
          product_id?: string
          rating?: number
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      track_order_by_number: {
        Args: { p_order_number: string; p_phone: string }
        Returns: {
          address: string
          created_at: string
          delivery_charge: number
          id: string
          name: string
          order_number: string | null
          phone: string
          product: string
          quantity: number
          selected_perfumes: string[] | null
          status: string
          total_price: number
          variant: string
        }[]
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      track_orders_by_phone: {
        Args: { p_phone: string }
        Returns: {
          address: string
          created_at: string
          delivery_charge: number
          id: string
          name: string
          order_number: string | null
          phone: string
          product: string
          quantity: number
          selected_perfumes: string[] | null
          status: string
          total_price: number
          variant: string
        }[]
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
