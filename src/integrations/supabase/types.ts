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
          feature_attributes: Json | null
          feature_modules: string[] | null
          id: string
          images: string[] | null
          inquiry_id: string
          notes: string | null
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
          feature_attributes?: Json | null
          feature_modules?: string[] | null
          id?: string
          images?: string[] | null
          inquiry_id: string
          notes?: string | null
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
          feature_attributes?: Json | null
          feature_modules?: string[] | null
          id?: string
          images?: string[] | null
          inquiry_id?: string
          notes?: string | null
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
        Relationships: []
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
    Enums: {},
  },
} as const
