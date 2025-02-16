// Add Pods table definition.  ADJUST AS NEEDED based on your actual schema.
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
      holter_data: {
        Row: {
          created_at: string
          device_id: string | null
          end_time: string | null
          filename: string | null
          heart_rate: number | null
          id: string
          patient_id: string | null
          start_time: string | null
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          end_time?: string | null
          filename?: string | null
          heart_rate?: number | null
          id?: string
          patient_id?: string | null
          start_time?: string | null
        }
        Update: {
          created_at?: string
          device_id?: string | null
          end_time?: string | null
          filename?: string | null
          heart_rate?: number | null
          id?: string
          patient_id?: string | null
          start_time?: string | null
        }
        Relationships: []
      }
      pods: {
        Row: {
          id: string
          created_at: string
          name: string | null
          description: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name?: string | null
          description?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string | null
          description?: string | null
        }
        Relationships: []
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
