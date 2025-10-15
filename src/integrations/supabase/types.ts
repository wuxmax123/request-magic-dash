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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          code: string | null
          created_at: string | null
          id: number
          level: number
          name_cn: string
          name_en: string
          parent_id: number | null
          path: string | null
          sort: number | null
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          id: number
          level: number
          name_cn: string
          name_en: string
          parent_id?: number | null
          path?: string | null
          sort?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          id?: number
          level?: number
          name_cn?: string
          name_en?: string
          parent_id?: number | null
          path?: string | null
          sort?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      category_attributes: {
        Row: {
          attr_code: string
          attr_name: string
          attr_sort: number | null
          category_id: number
          created_at: string | null
          help_text: string | null
          id: string
          input_type: string
          options_json: Json | null
          required: number | null
          unit: string | null
          updated_at: string | null
          visible_on_quote: number | null
        }
        Insert: {
          attr_code: string
          attr_name: string
          attr_sort?: number | null
          category_id: number
          created_at?: string | null
          help_text?: string | null
          id?: string
          input_type: string
          options_json?: Json | null
          required?: number | null
          unit?: string | null
          updated_at?: string | null
          visible_on_quote?: number | null
        }
        Update: {
          attr_code?: string
          attr_name?: string
          attr_sort?: number | null
          category_id?: number
          created_at?: string | null
          help_text?: string | null
          id?: string
          input_type?: string
          options_json?: Json | null
          required?: number | null
          unit?: string | null
          updated_at?: string | null
          visible_on_quote?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "category_attributes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      category_feature_binding: {
        Row: {
          category_id: number
          created_at: string | null
          feature_code: string
          id: string
        }
        Insert: {
          category_id: number
          created_at?: string | null
          feature_code: string
          id?: string
        }
        Update: {
          category_id?: number
          created_at?: string | null
          feature_code?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_feature_binding_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_feature_binding_feature_code_fkey"
            columns: ["feature_code"]
            isOneToOne: false
            referencedRelation: "feature_modules"
            referencedColumns: ["feature_code"]
          },
        ]
      }
      feature_attributes: {
        Row: {
          attr_code: string
          attr_name: string
          attr_sort: number | null
          created_at: string | null
          feature_code: string
          help_text: string | null
          id: string
          input_type: string
          options_json: Json | null
          required: number | null
          unit: string | null
          updated_at: string | null
          visible_on_quote: number | null
        }
        Insert: {
          attr_code: string
          attr_name: string
          attr_sort?: number | null
          created_at?: string | null
          feature_code: string
          help_text?: string | null
          id?: string
          input_type: string
          options_json?: Json | null
          required?: number | null
          unit?: string | null
          updated_at?: string | null
          visible_on_quote?: number | null
        }
        Update: {
          attr_code?: string
          attr_name?: string
          attr_sort?: number | null
          created_at?: string | null
          feature_code?: string
          help_text?: string | null
          id?: string
          input_type?: string
          options_json?: Json | null
          required?: number | null
          unit?: string | null
          updated_at?: string | null
          visible_on_quote?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_attributes_feature_code_fkey"
            columns: ["feature_code"]
            isOneToOne: false
            referencedRelation: "feature_modules"
            referencedColumns: ["feature_code"]
          },
        ]
      }
      feature_modules: {
        Row: {
          created_at: string | null
          description: string | null
          feature_code: string
          feature_name: string
          feature_name_en: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          feature_code: string
          feature_name: string
          feature_name_en?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          feature_code?: string
          feature_name?: string
          feature_name_en?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rate_matrix: {
        Row: {
          additional_fee_per_step: number
          additional_weight_step_kg: number
          channel_id: string
          created_at: string
          currency: string
          destination_country: string
          effective_from: string
          effective_until: string | null
          estimated_delivery_days_max: number
          estimated_delivery_days_min: number
          first_weight_fee: number
          first_weight_kg: number
          fuel_surcharge_percent: number
          id: string
          is_active: boolean
          min_charge: number
          notes: string | null
          remote_area_surcharge: number
          updated_at: string
          warehouse_id: string
          weight_max_kg: number
          weight_min_kg: number
        }
        Insert: {
          additional_fee_per_step: number
          additional_weight_step_kg: number
          channel_id: string
          created_at?: string
          currency?: string
          destination_country: string
          effective_from?: string
          effective_until?: string | null
          estimated_delivery_days_max: number
          estimated_delivery_days_min: number
          first_weight_fee: number
          first_weight_kg: number
          fuel_surcharge_percent?: number
          id?: string
          is_active?: boolean
          min_charge?: number
          notes?: string | null
          remote_area_surcharge?: number
          updated_at?: string
          warehouse_id: string
          weight_max_kg: number
          weight_min_kg: number
        }
        Update: {
          additional_fee_per_step?: number
          additional_weight_step_kg?: number
          channel_id?: string
          created_at?: string
          currency?: string
          destination_country?: string
          effective_from?: string
          effective_until?: string | null
          estimated_delivery_days_max?: number
          estimated_delivery_days_min?: number
          first_weight_fee?: number
          first_weight_kg?: number
          fuel_surcharge_percent?: number
          id?: string
          is_active?: boolean
          min_charge?: number
          notes?: string | null
          remote_area_surcharge?: number
          updated_at?: string
          warehouse_id?: string
          weight_max_kg?: number
          weight_min_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "rate_matrix_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "shipping_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rate_matrix_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      rfq_shipping_quotes: {
        Row: {
          base_freight: number
          calculated_at: string
          calculation_details: Json | null
          channel_id: string
          created_at: string
          currency: string
          destination_country: string
          estimated_delivery_days_max: number
          estimated_delivery_days_min: number
          fuel_surcharge: number
          id: string
          is_manual: boolean
          is_selected: boolean
          product_weight_kg: number
          remote_surcharge: number
          rfq_id: string
          total_freight: number
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          base_freight: number
          calculated_at?: string
          calculation_details?: Json | null
          channel_id: string
          created_at?: string
          currency?: string
          destination_country: string
          estimated_delivery_days_max: number
          estimated_delivery_days_min: number
          fuel_surcharge: number
          id?: string
          is_manual?: boolean
          is_selected?: boolean
          product_weight_kg: number
          remote_surcharge?: number
          rfq_id: string
          total_freight: number
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          base_freight?: number
          calculated_at?: string
          calculation_details?: Json | null
          channel_id?: string
          created_at?: string
          currency?: string
          destination_country?: string
          estimated_delivery_days_max?: number
          estimated_delivery_days_min?: number
          fuel_surcharge?: number
          id?: string
          is_manual?: boolean
          is_selected?: boolean
          product_weight_kg?: number
          remote_surcharge?: number
          rfq_id?: string
          total_freight?: number
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfq_shipping_quotes_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "shipping_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_shipping_quotes_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_shipping_quotes_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      rfqs: {
        Row: {
          attachments: string[] | null
          attributes: Json | null
          category_l1: number | null
          category_l2: number | null
          category_l3: number | null
          created_at: string | null
          currency: string
          customer_links: string[] | null
          default_warehouse_id: string | null
          feature_attributes: Json | null
          feature_modules: string[] | null
          id: string
          images: string[] | null
          include_shipping: boolean
          inquiry_id: string
          notes: string | null
          product_name: string | null
          reference_number: string | null
          source_links: string[] | null
          status: string
          target_country: string
          target_price: number | null
          target_weight_kg: number | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attachments?: string[] | null
          attributes?: Json | null
          category_l1?: number | null
          category_l2?: number | null
          category_l3?: number | null
          created_at?: string | null
          currency: string
          customer_links?: string[] | null
          default_warehouse_id?: string | null
          feature_attributes?: Json | null
          feature_modules?: string[] | null
          id?: string
          images?: string[] | null
          include_shipping?: boolean
          inquiry_id: string
          notes?: string | null
          product_name?: string | null
          reference_number?: string | null
          source_links?: string[] | null
          status: string
          target_country: string
          target_price?: number | null
          target_weight_kg?: number | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attachments?: string[] | null
          attributes?: Json | null
          category_l1?: number | null
          category_l2?: number | null
          category_l3?: number | null
          created_at?: string | null
          currency?: string
          customer_links?: string[] | null
          default_warehouse_id?: string | null
          feature_attributes?: Json | null
          feature_modules?: string[] | null
          id?: string
          images?: string[] | null
          include_shipping?: boolean
          inquiry_id?: string
          notes?: string | null
          product_name?: string | null
          reference_number?: string | null
          source_links?: string[] | null
          status?: string
          target_country?: string
          target_price?: number | null
          target_weight_kg?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfqs_default_warehouse_id_fkey"
            columns: ["default_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_carriers: {
        Row: {
          carrier_code: string
          carrier_name_cn: string
          carrier_name_en: string
          carrier_type: string
          created_at: string
          id: string
          is_active: boolean
          sort: number
          updated_at: string
          website: string | null
        }
        Insert: {
          carrier_code: string
          carrier_name_cn: string
          carrier_name_en: string
          carrier_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          sort?: number
          updated_at?: string
          website?: string | null
        }
        Update: {
          carrier_code?: string
          carrier_name_cn?: string
          carrier_name_en?: string
          carrier_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          sort?: number
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      shipping_channels: {
        Row: {
          carrier_id: string
          channel_code: string
          channel_name_cn: string
          channel_name_en: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          sort: number
          updated_at: string
        }
        Insert: {
          carrier_id: string
          channel_code: string
          channel_name_cn: string
          channel_name_en: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          sort?: number
          updated_at?: string
        }
        Update: {
          carrier_id?: string
          channel_code?: string
          channel_name_cn?: string
          channel_name_en?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          sort?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_channels_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "shipping_carriers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          city: string | null
          contact: string | null
          created_at: string | null
          email: string | null
          id: string
          link_1688: string | null
          name: string
          phone: string | null
          province: string | null
          quotes: Json | null
          rating: number | null
          rating_1688: number | null
          rfq_id: string | null
          supplier_id: number
          tags: string[] | null
          wechat: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          link_1688?: string | null
          name: string
          phone?: string | null
          province?: string | null
          quotes?: Json | null
          rating?: number | null
          rating_1688?: number | null
          rfq_id?: string | null
          supplier_id: number
          tags?: string[] | null
          wechat?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          contact?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          link_1688?: string | null
          name?: string
          phone?: string | null
          province?: string | null
          quotes?: Json | null
          rating?: number | null
          rating_1688?: number | null
          rfq_id?: string | null
          supplier_id?: number
          tags?: string[] | null
          wechat?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      warehouses: {
        Row: {
          address: string | null
          city: string | null
          country: string
          created_at: string
          id: string
          is_active: boolean
          name_cn: string
          name_en: string
          province: string | null
          sort: number
          updated_at: string
          warehouse_code: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          country: string
          created_at?: string
          id?: string
          is_active?: boolean
          name_cn: string
          name_en: string
          province?: string | null
          sort?: number
          updated_at?: string
          warehouse_code: string
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name_cn?: string
          name_en?: string
          province?: string | null
          sort?: number
          updated_at?: string
          warehouse_code?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: { check_role: string; check_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    },
  },
} as const
