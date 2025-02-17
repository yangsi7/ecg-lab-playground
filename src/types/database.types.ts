export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      clinics: {
        Row: {
          id: string
          name: string | null
        }
        Insert: {
          id: string
          name?: string | null
        }
        Update: {
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      ecg_sample: {
        Row: {
          channel_1: number | null
          channel_2: number | null
          channel_3: number | null
          lead_on_n_1: boolean | null
          lead_on_n_2: boolean | null
          lead_on_n_3: boolean | null
          lead_on_p_1: boolean | null
          lead_on_p_2: boolean | null
          lead_on_p_3: boolean | null
          pod_id: string | null
          quality_1: boolean | null
          quality_2: boolean | null
          quality_3: boolean | null
          time: string | null
        }
        Insert: {
          channel_1?: number | null
          channel_2?: number | null
          channel_3?: number | null
          lead_on_n_1?: boolean | null
          lead_on_n_2?: boolean | null
          lead_on_n_3?: boolean | null
          lead_on_p_1?: boolean | null
          lead_on_p_2?: boolean | null
          lead_on_p_3?: boolean | null
          pod_id?: string | null
          quality_1?: boolean | null
          quality_2?: boolean | null
          quality_3?: boolean | null
          time?: string | null
        }
        Update: {
          channel_1?: number | null
          channel_2?: number | null
          channel_3?: number | null
          lead_on_n_1?: boolean | null
          lead_on_n_2?: boolean | null
          lead_on_n_3?: boolean | null
          lead_on_p_1?: boolean | null
          lead_on_p_2?: boolean | null
          lead_on_p_3?: boolean | null
          pod_id?: string | null
          quality_1?: boolean | null
          quality_2?: boolean | null
          quality_3?: boolean | null
          time?: string | null
        }
        Relationships: []
      }
      pod: {
        Row: {
          assigned_study_id: string | null
          assigned_user_id: string | null
          id: string
          status: string | null
          time_since_first_use: number | null
        }
        Insert: {
          assigned_study_id?: string | null
          assigned_user_id?: string | null
          id: string
          status?: string | null
          time_since_first_use?: number | null
        }
        Update: {
          assigned_study_id?: string | null
          assigned_user_id?: string | null
          id?: string
          status?: string | null
          time_since_first_use?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pod_assigned_study_id_fkey"
            columns: ["assigned_study_id"]
            isOneToOne: false
            referencedRelation: "study"
            referencedColumns: ["study_id"]
          }
        ]
      }
      study: {
        Row: {
          aggregated_quality_minutes: number | null
          aggregated_total_minutes: number | null
          clinic_id: string | null
          created_at: string | null
          created_by: string | null
          duration: number | null
          end_timestamp: string | null
          expected_end_timestamp: string | null
          pod_id: string | null
          start_timestamp: string | null
          study_id: string
          study_type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          aggregated_quality_minutes?: number | null
          aggregated_total_minutes?: number | null
          clinic_id?: string | null
          created_at?: string | null
          created_by?: string | null
          duration?: number | null
          end_timestamp?: string | null
          expected_end_timestamp?: string | null
          pod_id?: string | null
          start_timestamp?: string | null
          study_id: string
          study_type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          aggregated_quality_minutes?: number | null
          aggregated_total_minutes?: number | null
          clinic_id?: string | null
          created_at?: string | null
          created_by?: string | null
          duration?: number | null
          end_timestamp?: string | null
          expected_end_timestamp?: string | null
          pod_id?: string | null
          start_timestamp?: string | null
          study_id?: string
          study_type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "study_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pod"
            referencedColumns: ["id"]
          }
        ]
      }
      study_readings: {
        Row: {
          battery_level: number | null
          created_at: string | null
          created_by: string | null
          id: string
          quality_minutes: number | null
          status: string | null
          study_id: string
          timestamp: string
          total_minutes: number | null
        }
        Insert: {
          battery_level?: number | null
          created_at?: string | null
          created_by?: string | null
          id: string
          quality_minutes?: number | null
          status?: string | null
          study_id: string
          timestamp: string
          total_minutes?: number | null
        }
        Update: {
          battery_level?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          quality_minutes?: number | null
          status?: string | null
          study_id?: string
          timestamp?: string
          total_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "study_readings_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "study"
            referencedColumns: ["study_id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_compression_policy: {
        Args: {
          hypertable: unknown
          compress_after?: unknown
          if_not_exists?: boolean
          schedule_interval?: unknown
          initial_start?: string
          timezone?: string
          compress_created_before?: unknown
        }
        Returns: number
      }
      add_continuous_aggregate_policy: {
        Args: {
          continuous_aggregate: unknown
          start_offset: unknown
          end_offset: unknown
          schedule_interval: unknown
          if_not_exists?: boolean
          initial_start?: string
          timezone?: string
        }
        Returns: number
      }
      aggregate_leads: {
        Args: {
          p_pod_id: string
          p_time_start: string
          p_time_end: string
          p_bucket_seconds: number
        }
        Returns: {
          time_bucket: string
          lead_on_p_1: number
          lead_on_p_2: number
          lead_on_p_3: number
          lead_on_n_1: number
          lead_on_n_2: number
          lead_on_n_3: number
          quality_1_percent: number
          quality_2_percent: number
          quality_3_percent: number
        }[]
      }
      downsample_ecg: {
        Args: {
          p_pod_id: string
          p_time_start: string
          p_time_end: string
          p_factor: number
        }
        Returns: {
          sample_time: string
          downsampled_channel_1: number
          downsampled_channel_2: number
          downsampled_channel_3: number
          lead_on_p_1: boolean
          lead_on_p_2: boolean
          lead_on_p_3: boolean
          lead_on_n_1: boolean
          lead_on_n_2: boolean
          lead_on_n_3: boolean
          quality_1: boolean
          quality_2: boolean
          quality_3: boolean
        }[]
      }
      get_pod_days: {
        Args: {
          p_pod_id: string
        }
        Returns: {
          day_value: string
        }[]
      }
      get_pod_earliest_latest: {
        Args: {
          p_pod_id: string
        }
        Returns: {
          earliest_time: string
          latest_time: string
        }[]
      }
      get_study_details_with_earliest_latest: {
        Args: {
          p_study_id: string
        }
        Returns: {
          study_id: string
          clinic_id: string
          pod_id: string
          start_timestamp: string
          end_timestamp: string
          earliest_time: string
          latest_time: string
        }[]
      }
      get_study_diagnostics: {
        Args: {
          p_study_id: string
        }
        Returns: {
          study_id: string
          quality_fraction_variability: number
          total_minute_variability: number
          interruptions: number
          bad_hours: number
        }[]
      }
      get_clinic_overview: {
        Args: { _clinic_id: string };
        Returns: Array<{
          active_studies: number;
          total_studies: number;
          average_quality_hours: number;
          recent_alerts: string | null;
        }>;
      };
      get_clinic_status_breakdown: {
        Args: { _clinic_id: string | null };
        Returns: Array<{
          clinic_id: string | null;
          clinic_name: string | null;
          total_studies: number;
          open_studies: number;
          intervene_count: number;
          monitor_count: number;
          on_target_count: number;
          near_completion_count: number;
          needs_extension_count: number;
        }>;
      };
      get_clinic_quality_breakdown: {
        Args: { _clinic_id: string | null };
        Returns: Array<{
          clinic_id: string | null;
          clinic_name: string | null;
          total_studies: number;
          open_studies: number;
          average_quality: number;
          good_count: number;
          soso_count: number;
          bad_count: number;
          critical_count: number;
        }>;
      };
      get_clinic_weekly_quality: {
        Args: { _clinic_id: string };
        Returns: Array<{
          week_start: string | null;
          average_quality: number;
        }>;
      };
      get_clinic_monthly_quality: {
        Args: { _clinic_id: string };
        Returns: Array<{
          month_start: string | null;
          average_quality: number;
        }>;
      };
      get_clinic_weekly_studies: {
        Args: { _clinic_id: string };
        Returns: Array<{
          week_start: string | null;
          open_studies: number;
        }>;
      };
      get_clinic_monthly_studies: {
        Args: { _clinic_id: string };
        Returns: Array<{
          month_start: string | null;
          open_studies: number;
        }>;
      };
      get_weekly_active_studies: {
        Args: Record<string, never>;
        Returns: Array<{
          week_start: string | null;
          active_study_count: number;
        }>;
      };
      get_weekly_avg_quality: {
        Args: Record<string, never>;
        Returns: Array<{
          week_start: string | null;
          average_quality: number;
        }>;
      };
      get_per_clinic_breakdown: {
        Args: Record<string, never>;
        Returns: Array<{
          clinic_id: string | null;
          clinic_name: string | null;
          total_active_studies: number;
          intervene_count: number;
          monitor_count: number;
          on_target_count: number;
          average_quality: number;
        }>;
      };
      get_new_studies_and_growth: {
        Args: Record<string, never>;
        Returns: Array<{
          new_studies: number;
          growth_percent: number;
        }>;
      };
      get_study_list_with_earliest_latest: {
        Args: {
          p_search: string | undefined;
          p_offset: number;
          p_limit: number;
        };
        Returns: Array<{
          study_id: string;
          pod_id: string;
          start_timestamp: string;
          end_timestamp: string;
          earliest_time: string;
          latest_time: string;
          total_count: number;
        }>;
      };
    }
  }
} 