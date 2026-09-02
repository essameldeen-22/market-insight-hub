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
      analysis_usage: {
        Row: {
          count: number
          day: string
          updated_at: string
          user_id: string
        }
        Insert: {
          count?: number
          day: string
          updated_at?: string
          user_id: string
        }
        Update: {
          count?: number
          day?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      competitor_analyses: {
        Row: {
          created_at: string
          id: string
          product_name: string
          result: Json | null
          reviews_hash: string | null
          reviews_text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_name?: string
          result?: Json | null
          reviews_hash?: string | null
          reviews_text?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_name?: string
          result?: Json | null
          reviews_hash?: string | null
          reviews_text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      pending_suggestions: {
        Row: {
          category: string
          created_at: string
          difficulty: string
          from_tool: string
          id: string
          notes: string | null
          review_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          save_pct: number
          status: string
          to_tool: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          difficulty: string
          from_tool: string
          id?: string
          notes?: string | null
          review_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          save_pct: number
          status?: string
          to_tool: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          difficulty?: string
          from_tool?: string
          id?: string
          notes?: string | null
          review_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          save_pct?: number
          status?: string
          to_tool?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pricing_states: {
        Row: {
          state: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          state?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          state?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          has_seen_onboarding: boolean
          id: string
          plan: string
          preferred_currency: string
          preferred_language: string
          theme: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          has_seen_onboarding?: boolean
          id: string
          plan?: string
          preferred_currency?: string
          preferred_language?: string
          theme?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          has_seen_onboarding?: boolean
          id?: string
          plan?: string
          preferred_currency?: string
          preferred_language?: string
          theme?: string
          updated_at?: string
        }
        Relationships: []
      }
      roi_states: {
        Row: {
          state: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          state?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          state?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saas_alternatives: {
        Row: {
          category: string
          created_at: string
          difficulty: string
          from_tool: string
          id: string
          notes: string | null
          save_pct: number
          to_tool: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          difficulty: string
          from_tool: string
          id?: string
          notes?: string | null
          save_pct: number
          to_tool: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          difficulty?: string
          from_tool?: string
          id?: string
          notes?: string | null
          save_pct?: number
          to_tool?: string
          updated_at?: string
        }
        Relationships: []
      }
      saas_stacks: {
        Row: {
          tools: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          tools?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          tools?: Json
          updated_at?: string
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
      value_props: {
        Row: {
          created_at: string
          differentiator: string
          id: string
          pains: string
          product: string
          result: Json | null
          target: string
          user_id: string
        }
        Insert: {
          created_at?: string
          differentiator?: string
          id?: string
          pains?: string
          product?: string
          result?: Json | null
          target?: string
          user_id: string
        }
        Update: {
          created_at?: string
          differentiator?: string
          id?: string
          pains?: string
          product?: string
          result?: Json | null
          target?: string
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
