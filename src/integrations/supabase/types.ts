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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      alert_incident_map: {
        Row: {
          alert_id: string
          created_at: string
          id: string
          incident_id: string
        }
        Insert: {
          alert_id: string
          created_at?: string
          id?: string
          incident_id: string
        }
        Update: {
          alert_id?: string
          created_at?: string
          id?: string
          incident_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_incident_map_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_incident_map_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          ai_analysis: string | null
          ai_used: boolean
          alert_type: string
          created_at: string
          id: string
          raw_log: Json | null
          risk_score: number | null
          severity: Database["public"]["Enums"]["alert_severity"]
          source_system: string
          status: Database["public"]["Enums"]["alert_status"]
          timestamp: string
          updated_at: string
        }
        Insert: {
          ai_analysis?: string | null
          ai_used?: boolean
          alert_type: string
          created_at?: string
          id?: string
          raw_log?: Json | null
          risk_score?: number | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          source_system: string
          status?: Database["public"]["Enums"]["alert_status"]
          timestamp?: string
          updated_at?: string
        }
        Update: {
          ai_analysis?: string | null
          ai_used?: boolean
          alert_type?: string
          created_at?: string
          id?: string
          raw_log?: Json | null
          risk_score?: number | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          source_system?: string
          status?: Database["public"]["Enums"]["alert_status"]
          timestamp?: string
          updated_at?: string
        }
        Relationships: []
      }
      db_connections: {
        Row: {
          alerts_table_name: string
          connection_url_encrypted: string
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          last_error: string | null
          last_sync_at: string | null
          last_tested_at: string | null
          name: string
          status: string
          sync_interval_minutes: number
          updated_at: string
        }
        Insert: {
          alerts_table_name?: string
          connection_url_encrypted: string
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          last_error?: string | null
          last_sync_at?: string | null
          last_tested_at?: string | null
          name: string
          status?: string
          sync_interval_minutes?: number
          updated_at?: string
        }
        Update: {
          alerts_table_name?: string
          connection_url_encrypted?: string
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          last_error?: string | null
          last_sync_at?: string | null
          last_tested_at?: string | null
          name?: string
          status?: string
          sync_interval_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      external_alert_log: {
        Row: {
          connection_id: string
          external_alert_id: string
          id: string
          ingested_at: string
          local_alert_id: string | null
        }
        Insert: {
          connection_id: string
          external_alert_id: string
          id?: string
          ingested_at?: string
          local_alert_id?: string | null
        }
        Update: {
          connection_id?: string
          external_alert_id?: string
          id?: string
          ingested_at?: string
          local_alert_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "external_alert_log_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "db_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_alert_log_local_alert_id_fkey"
            columns: ["local_alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_activity: {
        Row: {
          action_label: string
          action_type: string
          created_at: string
          id: string
          incident_id: string
          is_demo: boolean
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action_label: string
          action_type: string
          created_at?: string
          id?: string
          incident_id: string
          is_demo?: boolean
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action_label?: string
          action_type?: string
          created_at?: string
          id?: string
          incident_id?: string
          is_demo?: boolean
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_activity_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          ai_summary: string | null
          auto_created: boolean
          created_at: string
          id: string
          incident_reason: string | null
          resolved_at: string | null
          severity: Database["public"]["Enums"]["incident_severity"]
          status: Database["public"]["Enums"]["incident_status"]
          updated_at: string
        }
        Insert: {
          ai_summary?: string | null
          auto_created?: boolean
          created_at?: string
          id?: string
          incident_reason?: string | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"]
          status?: Database["public"]["Enums"]["incident_status"]
          updated_at?: string
        }
        Update: {
          ai_summary?: string | null
          auto_created?: boolean
          created_at?: string
          id?: string
          incident_reason?: string | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"]
          status?: Database["public"]["Enums"]["incident_status"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      assign_default_role: { Args: { _user_id: string }; Returns: undefined }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      promote_to_admin: { Args: { _target_user_id: string }; Returns: boolean }
    }
    Enums: {
      alert_severity: "Low" | "Medium" | "High" | "Critical"
      alert_status: "New" | "Reviewed" | "Correlated"
      app_role: "admin" | "analyst" | "alert_source"
      incident_severity: "Low" | "Medium" | "High" | "Critical"
      incident_status: "Open" | "In Progress" | "Resolved" | "Closed"
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
      alert_severity: ["Low", "Medium", "High", "Critical"],
      alert_status: ["New", "Reviewed", "Correlated"],
      app_role: ["admin", "analyst", "alert_source"],
      incident_severity: ["Low", "Medium", "High", "Critical"],
      incident_status: ["Open", "In Progress", "Resolved", "Closed"],
    },
  },
} as const
