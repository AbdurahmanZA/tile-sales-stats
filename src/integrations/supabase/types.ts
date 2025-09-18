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
      branches: {
        Row: {
          created_at: string
          id: string
          ip_address: string
          last_sync: string | null
          location: string | null
          name: string
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address: string
          last_sync?: string | null
          location?: string | null
          name: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string
          last_sync?: string | null
          location?: string | null
          name?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      customer_data: {
        Row: {
          branch_id: string | null
          contact_info: string | null
          created_at: string
          customer_name: string
          first_purchase_date: string | null
          id: string
          last_purchase_date: string | null
          lead_source: string | null
          retention_status: string | null
          total_purchases: number | null
        }
        Insert: {
          branch_id?: string | null
          contact_info?: string | null
          created_at?: string
          customer_name: string
          first_purchase_date?: string | null
          id?: string
          last_purchase_date?: string | null
          lead_source?: string | null
          retention_status?: string | null
          total_purchases?: number | null
        }
        Update: {
          branch_id?: string | null
          contact_info?: string | null
          created_at?: string
          customer_name?: string
          first_purchase_date?: string | null
          id?: string
          last_purchase_date?: string | null
          lead_source?: string | null
          retention_status?: string | null
          total_purchases?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_data_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_data: {
        Row: {
          branch_id: string | null
          cost_per_unit: number | null
          created_at: string
          current_stock: number | null
          id: string
          last_turnover_date: string | null
          reorder_level: number | null
          status: string | null
          supplier: string | null
          tile_style: string
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          cost_per_unit?: number | null
          created_at?: string
          current_stock?: number | null
          id?: string
          last_turnover_date?: string | null
          reorder_level?: number | null
          status?: string | null
          supplier?: string | null
          tile_style: string
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          cost_per_unit?: number | null
          created_at?: string
          current_stock?: number | null
          id?: string
          last_turnover_date?: string | null
          reorder_level?: number | null
          status?: string | null
          supplier?: string | null
          tile_style?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_data_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      operations_data: {
        Row: {
          branch_id: string | null
          created_at: string
          date: string
          efficiency_percentage: number | null
          id: string
          installations_completed: number | null
          labor_cost: number | null
          scheduled_installations: number | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          date: string
          efficiency_percentage?: number | null
          id?: string
          installations_completed?: number | null
          labor_cost?: number | null
          scheduled_installations?: number | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          date?: string
          efficiency_percentage?: number | null
          id?: string
          installations_completed?: number | null
          labor_cost?: number | null
          scheduled_installations?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "operations_data_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_data: {
        Row: {
          branch_id: string | null
          created_at: string
          currency: string | null
          customer_name: string | null
          id: string
          margin_percentage: number | null
          quantity_sold: number | null
          tile_style: string | null
          total_amount: number | null
          transaction_date: string
          unit_price: number | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          currency?: string | null
          customer_name?: string | null
          id?: string
          margin_percentage?: number | null
          quantity_sold?: number | null
          tile_style?: string | null
          total_amount?: number | null
          transaction_date: string
          unit_price?: number | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          currency?: string | null
          customer_name?: string | null
          id?: string
          margin_percentage?: number | null
          quantity_sold?: number | null
          tile_style?: string | null
          total_amount?: number | null
          transaction_date?: string
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_data_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
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
