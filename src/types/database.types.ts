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
      ecg_data: {
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
          quality_1: boolean | null
          quality_2: boolean | null
          quality_3: boolean | null
          time: string
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
          quality_1?: boolean | null
          quality_2?: boolean | null
          quality_3?: boolean | null
          time: string
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
          quality_1?: boolean | null
          quality_2?: boolean | null
          quality_3?: boolean | null
          time?: string
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
          time: string
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
          time: string
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
          time?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecg_sample_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pod"
            referencedColumns: ["id"]
          },
        ]
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
          },
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
          },
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
          },
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
      add_dimension:
        | {
            Args: {
              hypertable: unknown
              column_name: unknown
              number_partitions?: number
              chunk_time_interval?: unknown
              partitioning_func?: unknown
              if_not_exists?: boolean
            }
            Returns: {
              dimension_id: number
              schema_name: unknown
              table_name: unknown
              column_name: unknown
              created: boolean
            }[]
          }
        | {
            Args: {
              hypertable: unknown
              dimension: unknown
              if_not_exists?: boolean
            }
            Returns: {
              dimension_id: number
              created: boolean
            }[]
          }
      add_job: {
        Args: {
          proc: unknown
          schedule_interval: unknown
          config?: Json
          initial_start?: string
          scheduled?: boolean
          check_config?: unknown
          fixed_schedule?: boolean
          timezone?: string
        }
        Returns: number
      }
      add_reorder_policy: {
        Args: {
          hypertable: unknown
          index_name: unknown
          if_not_exists?: boolean
          initial_start?: string
          timezone?: string
        }
        Returns: number
      }
      add_retention_policy: {
        Args: {
          relation: unknown
          drop_after?: unknown
          if_not_exists?: boolean
          schedule_interval?: unknown
          initial_start?: string
          timezone?: string
          drop_created_before?: unknown
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
      alter_job: {
        Args: {
          job_id: number
          schedule_interval?: unknown
          max_runtime?: unknown
          max_retries?: number
          retry_period?: unknown
          scheduled?: boolean
          config?: Json
          next_start?: string
          if_exists?: boolean
          check_config?: unknown
          fixed_schedule?: boolean
          initial_start?: string
          timezone?: string
        }
        Returns: {
          job_id: number
          schedule_interval: unknown
          max_runtime: unknown
          max_retries: number
          retry_period: unknown
          scheduled: boolean
          config: Json
          next_start: string
          check_config: string
          fixed_schedule: boolean
          initial_start: string
          timezone: string
        }[]
      }
      approximate_row_count: {
        Args: {
          relation: unknown
        }
        Returns: number
      }
      attach_tablespace: {
        Args: {
          tablespace: unknown
          hypertable: unknown
          if_not_attached?: boolean
        }
        Returns: undefined
      }
      by_hash: {
        Args: {
          column_name: unknown
          number_partitions: number
          partition_func?: unknown
        }
        Returns: unknown
      }
      by_range: {
        Args: {
          column_name: unknown
          partition_interval?: unknown
          partition_func?: unknown
        }
        Returns: unknown
      }
      chunk_compression_stats: {
        Args: {
          hypertable: unknown
        }
        Returns: {
          chunk_schema: unknown
          chunk_name: unknown
          compression_status: string
          before_compression_table_bytes: number
          before_compression_index_bytes: number
          before_compression_toast_bytes: number
          before_compression_total_bytes: number
          after_compression_table_bytes: number
          after_compression_index_bytes: number
          after_compression_toast_bytes: number
          after_compression_total_bytes: number
          node_name: unknown
        }[]
      }
      chunks_detailed_size: {
        Args: {
          hypertable: unknown
        }
        Returns: {
          chunk_schema: unknown
          chunk_name: unknown
          table_bytes: number
          index_bytes: number
          toast_bytes: number
          total_bytes: number
          node_name: unknown
        }[]
      }
      compress_chunk: {
        Args: {
          uncompressed_chunk: unknown
          if_not_compressed?: boolean
          recompress?: boolean
        }
        Returns: unknown
      }
      create_hypertable:
        | {
            Args: {
              relation: unknown
              dimension: unknown
              create_default_indexes?: boolean
              if_not_exists?: boolean
              migrate_data?: boolean
            }
            Returns: {
              hypertable_id: number
              created: boolean
            }[]
          }
        | {
            Args: {
              relation: unknown
              time_column_name: unknown
              partitioning_column?: unknown
              number_partitions?: number
              associated_schema_name?: unknown
              associated_table_prefix?: unknown
              chunk_time_interval?: unknown
              create_default_indexes?: boolean
              if_not_exists?: boolean
              partitioning_func?: unknown
              migrate_data?: boolean
              chunk_target_size?: string
              chunk_sizing_func?: unknown
              time_partitioning_func?: unknown
            }
            Returns: {
              hypertable_id: number
              schema_name: unknown
              table_name: unknown
              created: boolean
            }[]
          }
      create_temp_table: {
        Args: {
          table_name: string
          columns: Json
        }
        Returns: undefined
      }
      decompress_chunk: {
        Args: {
          uncompressed_chunk: unknown
          if_compressed?: boolean
        }
        Returns: unknown
      }
      delete_job: {
        Args: {
          job_id: number
        }
        Returns: undefined
      }
      detach_tablespace: {
        Args: {
          tablespace: unknown
          hypertable?: unknown
          if_attached?: boolean
        }
        Returns: number
      }
      detach_tablespaces: {
        Args: {
          hypertable: unknown
        }
        Returns: number
      }
      disable_chunk_skipping: {
        Args: {
          hypertable: unknown
          column_name: unknown
          if_not_exists?: boolean
        }
        Returns: {
          hypertable_id: number
          column_name: unknown
          disabled: boolean
        }[]
      }
      downsample_ecg: {
        Args: {
          p_pod_id: string
          p_time_start: string
          p_time_end: string
          p_factor?: number
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
      downsample_ecg_boxcar: {
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
      downsample_ecg_naive: {
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
      drop_chunks: {
        Args: {
          relation: unknown
          older_than?: unknown
          newer_than?: unknown
          verbose?: boolean
          created_before?: unknown
          created_after?: unknown
        }
        Returns: string[]
      }
      enable_chunk_skipping: {
        Args: {
          hypertable: unknown
          column_name: unknown
          if_not_exists?: boolean
        }
        Returns: {
          column_stats_id: number
          enabled: boolean
        }[]
      }
      get_clinic_monthly_quality: {
        Args: {
          _clinic_id: string
        }
        Returns: {
          month_start: string
          average_quality: number
        }[]
      }
      get_clinic_monthly_studies: {
        Args: {
          _clinic_id: string
        }
        Returns: {
          month_start: string
          open_studies: number
        }[]
      }
      get_clinic_overview: {
        Args: {
          _clinic_id: string
        }
        Returns: {
          active_studies: number
          total_studies: number
          average_quality_hours: number
          recent_alerts: Json
        }[]
      }
      get_clinic_quality_breakdown:
        | {
            Args: Record<PropertyKey, never>
            Returns: {
              clinic_id: string
              clinic_name: string
              total_studies: number
              open_studies: number
              average_quality: number
              good_count: number
              soso_count: number
              bad_count: number
              critical_count: number
            }[]
          }
        | {
            Args: {
              _clinic_id?: string
            }
            Returns: {
              clinic_id: string
              clinic_name: string
              total_studies: number
              open_studies: number
              average_quality: number
              good_count: number
              soso_count: number
              bad_count: number
              critical_count: number
            }[]
          }
      get_clinic_status_breakdown:
        | {
            Args: Record<PropertyKey, never>
            Returns: {
              clinic_id: string
              clinic_name: string
              total_studies: number
              open_studies: number
              intervene_count: number
              monitor_count: number
              on_target_count: number
              near_completion_count: number
              needs_extension_count: number
            }[]
          }
        | {
            Args: {
              _clinic_id?: string
            }
            Returns: {
              clinic_id: string
              clinic_name: string
              total_studies: number
              open_studies: number
              closed: number
              intervene_count: number
              monitor_count: number
              on_target_count: number
              near_completion_count: number
              needs_extension_count: number
            }[]
          }
      get_clinic_weekly_quality:
        | {
            Args: Record<PropertyKey, never>
            Returns: {
              clinic_id: string
              clinic_name: string
              week_start: string
              average_quality: number
            }[]
          }
        | {
            Args: {
              _clinic_id: string
            }
            Returns: {
              week_start: string
              average_quality: number
            }[]
          }
      get_clinic_weekly_studies: {
        Args: {
          _clinic_id: string
        }
        Returns: {
          week_start: string
          open_studies: number
        }[]
      }
      get_earliest_latest_for_pod: {
        Args: {
          p_pod_id: string
        }
        Returns: {
          earliest_time: string
          latest_time: string
        }[]
      }
      get_new_studies_and_growth: {
        Args: Record<PropertyKey, never>
        Returns: {
          new_studies: number
          growth_percent: number
        }[]
      }
      get_per_clinic_breakdown: {
        Args: Record<PropertyKey, never>
        Returns: {
          clinic_id: string
          clinic_name: string
          total_active_studies: number
          intervene_count: number
          monitor_count: number
          on_target_count: number
          average_quality: number
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
      get_quality_threshold: {
        Args: {
          threshold: number
        }
        Returns: number
      }
      get_studies_with_aggregates: {
        Args: Record<PropertyKey, never>
        Returns: {
          study_id: string
          study_type: string
          clinic_id: string
          user_id: string
          aggregated_quality_minutes: number
          aggregated_total_minutes: number
          earliest_time: string
          latest_time: string
          clinic_name: string
        }[]
      }
      get_studies_with_pod_times: {
        Args: Record<PropertyKey, never>
        Returns: {
          study_id: string
          clinic_id: string
          pod_id: string
          user_id: string
          aggregated_quality_minutes: number
          aggregated_total_minutes: number
          duration: number
          end_timestamp: string
          expected_end_timestamp: string
          start_timestamp: string
          study_type: string
          updated_at: string
          created_at: string
          created_by: string
          earliest_time: string
          latest_time: string
          clinic_name: string
          pod_status: string
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
      get_study_list_with_earliest_latest: {
        Args: {
          p_search?: string
          p_offset?: number
          p_limit?: number
        }
        Returns: {
          study_id: string
          pod_id: string
          start_timestamp: string
          end_timestamp: string
          earliest_time: string
          latest_time: string
          total_count: number
        }[]
      }
      get_telemetry_report: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_weekly_active_studies: {
        Args: Record<PropertyKey, never>
        Returns: {
          week_start: string
          active_study_count: number
        }[]
      }
      get_weekly_avg_quality: {
        Args: Record<PropertyKey, never>
        Returns: {
          week_start: string
          average_quality: number
        }[]
      }
      hypertable_approximate_detailed_size: {
        Args: {
          relation: unknown
        }
        Returns: {
          table_bytes: number
          index_bytes: number
          toast_bytes: number
          total_bytes: number
        }[]
      }
      hypertable_approximate_size: {
        Args: {
          hypertable: unknown
        }
        Returns: number
      }
      hypertable_compression_stats: {
        Args: {
          hypertable: unknown
        }
        Returns: {
          total_chunks: number
          number_compressed_chunks: number
          before_compression_table_bytes: number
          before_compression_index_bytes: number
          before_compression_toast_bytes: number
          before_compression_total_bytes: number
          after_compression_table_bytes: number
          after_compression_index_bytes: number
          after_compression_toast_bytes: number
          after_compression_total_bytes: number
          node_name: unknown
        }[]
      }
      hypertable_detailed_size: {
        Args: {
          hypertable: unknown
        }
        Returns: {
          table_bytes: number
          index_bytes: number
          toast_bytes: number
          total_bytes: number
          node_name: unknown
        }[]
      }
      hypertable_index_size: {
        Args: {
          index_name: unknown
        }
        Returns: number
      }
      hypertable_size: {
        Args: {
          hypertable: unknown
        }
        Returns: number
      }
      interpolate:
        | {
            Args: {
              value: number
              prev?: Record<string, unknown>
              next?: Record<string, unknown>
            }
            Returns: number
          }
        | {
            Args: {
              value: number
              prev?: Record<string, unknown>
              next?: Record<string, unknown>
            }
            Returns: number
          }
        | {
            Args: {
              value: number
              prev?: Record<string, unknown>
              next?: Record<string, unknown>
            }
            Returns: number
          }
        | {
            Args: {
              value: number
              prev?: Record<string, unknown>
              next?: Record<string, unknown>
            }
            Returns: number
          }
        | {
            Args: {
              value: number
              prev?: Record<string, unknown>
              next?: Record<string, unknown>
            }
            Returns: number
          }
      locf: {
        Args: {
          value: unknown
          prev?: unknown
          treat_null_as_missing?: boolean
        }
        Returns: unknown
      }
      merge_temp_ecg_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      move_chunk: {
        Args: {
          chunk: unknown
          destination_tablespace: unknown
          index_destination_tablespace?: unknown
          reorder_index?: unknown
          verbose?: boolean
        }
        Returns: undefined
      }
      peak_preserving_downsample_ecg: {
        Args: {
          p_pod_id: string
          p_time_start: string
          p_time_end: string
          p_max_pts: number
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
      remove_compression_policy: {
        Args: {
          hypertable: unknown
          if_exists?: boolean
        }
        Returns: boolean
      }
      remove_continuous_aggregate_policy: {
        Args: {
          continuous_aggregate: unknown
          if_not_exists?: boolean
          if_exists?: boolean
        }
        Returns: undefined
      }
      remove_reorder_policy: {
        Args: {
          hypertable: unknown
          if_exists?: boolean
        }
        Returns: undefined
      }
      remove_retention_policy: {
        Args: {
          relation: unknown
          if_exists?: boolean
        }
        Returns: undefined
      }
      reorder_chunk: {
        Args: {
          chunk: unknown
          index?: unknown
          verbose?: boolean
        }
        Returns: undefined
      }
      set_adaptive_chunking: {
        Args: {
          hypertable: unknown
          chunk_target_size: string
        }
        Returns: Record<string, unknown>
      }
      set_chunk_time_interval: {
        Args: {
          hypertable: unknown
          chunk_time_interval: unknown
          dimension_name?: unknown
        }
        Returns: undefined
      }
      set_integer_now_func: {
        Args: {
          hypertable: unknown
          integer_now_func: unknown
          replace_if_exists?: boolean
        }
        Returns: undefined
      }
      set_number_partitions: {
        Args: {
          hypertable: unknown
          number_partitions: number
          dimension_name?: unknown
        }
        Returns: undefined
      }
      set_partitioning_interval: {
        Args: {
          hypertable: unknown
          partition_interval: unknown
          dimension_name?: unknown
        }
        Returns: undefined
      }
      show_chunks: {
        Args: {
          relation: unknown
          older_than?: unknown
          newer_than?: unknown
          created_before?: unknown
          created_after?: unknown
        }
        Returns: unknown[]
      }
      show_tablespaces: {
        Args: {
          hypertable: unknown
        }
        Returns: unknown[]
      }
      time_bucket:
        | {
            Args: {
              bucket_width: number
              ts: number
            }
            Returns: number
          }
        | {
            Args: {
              bucket_width: number
              ts: number
            }
            Returns: number
          }
        | {
            Args: {
              bucket_width: number
              ts: number
            }
            Returns: number
          }
        | {
            Args: {
              bucket_width: number
              ts: number
              offset: number
            }
            Returns: number
          }
        | {
            Args: {
              bucket_width: number
              ts: number
              offset: number
            }
            Returns: number
          }
        | {
            Args: {
              bucket_width: number
              ts: number
              offset: number
            }
            Returns: number
          }
        | {
            Args: {
              bucket_width: unknown
              ts: string
            }
            Returns: string
          }
        | {
            Args: {
              bucket_width: unknown
              ts: string
            }
            Returns: string
          }
        | {
            Args: {
              bucket_width: unknown
              ts: string
            }
            Returns: string
          }
        | {
            Args: {
              bucket_width: unknown
              ts: string
              offset: unknown
            }
            Returns: string
          }
        | {
            Args: {
              bucket_width: unknown
              ts: string
              offset: unknown
            }
            Returns: string
          }
        | {
            Args: {
              bucket_width: unknown
              ts: string
              offset: unknown
            }
            Returns: string
          }
        | {
            Args: {
              bucket_width: unknown
              ts: string
              origin: string
            }
            Returns: string
          }
        | {
            Args: {
              bucket_width: unknown
              ts: string
              origin: string
            }
            Returns: string
          }
        | {
            Args: {
              bucket_width: unknown
              ts: string
              origin: string
            }
            Returns: string
          }
        | {
            Args: {
              bucket_width: unknown
              ts: string
              timezone: string
              origin?: string
              offset?: unknown
            }
            Returns: string
          }
      time_bucket_gapfill:
        | {
            Args: {
              bucket_width: number
              ts: number
              start?: number
              finish?: number
            }
            Returns: number
          }
        | {
            Args: {
              bucket_width: number
              ts: number
              start?: number
              finish?: number
            }
            Returns: number
          }
        | {
            Args: {
              bucket_width: number
              ts: number
              start?: number
              finish?: number
            }
            Returns: number
          }
        | {
            Args: {
              bucket_width: unknown
              ts: string
              start?: string
              finish?: string
            }
            Returns: string
          }
        | {
            Args: {
              bucket_width: unknown
              ts: string
              start?: string
              finish?: string
            }
            Returns: string
          }
        | {
            Args: {
              bucket_width: unknown
              ts: string
              start?: string
              finish?: string
            }
            Returns: string
          }
        | {
            Args: {
              bucket_width: unknown
              ts: string
              timezone: string
              start?: string
              finish?: string
            }
            Returns: string
          }
      timescaledb_post_restore: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      timescaledb_pre_restore: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      get_edge_function_stats: {
        Args: {
          p_function_name: string;
          p_time_start: string;
          p_time_end: string;
        };
        Returns: {
          function_name: string;
          total_invocations: number;
          average_duration_ms: number;
          error_count: number;
          success_rate: number;
          memory_usage: number;
          cpu_time: number;
          last_invocation: string;
          peak_concurrent_executions: number;
        }[];
      };
      get_database_stats: {
        Args: {
          p_table_name?: string;
        };
        Returns: {
          table_name: string;
          row_count: number;
          size_bytes: number;
          last_vacuum: string;
          last_analyze: string;
          index_usage: {
            index_name: string;
            scan_count: number;
            size_bytes: number;
          }[];
          query_stats: {
            query_pattern: string;
            calls: number;
            total_time: number;
            rows_processed: number;
          }[];
        }[];
      };
      get_ecg_diagnostics: {
        Args: {
          p_pod_id: string;
          p_time_start: string;
          p_time_end: string;
        };
        Returns: {
          signal_quality: {
            snr: number;
            baseline_wander: number;
            noise_level: number;
            quality_scores: {
              channel_1: number;
              channel_2: number;
              channel_3: number;
            };
          };
          connection_stats: {
            total_samples: number;
            missing_samples: number;
            connection_drops: number;
            sampling_frequency: number;
          };
          data_quality: {
            recording_gaps: number;
            all_leads_connected_percent: number;
            max_continuous_segment_seconds: number;
          };
        }[];
      };
      get_clinic_analytics: {
        Args: {
          clinic_id?: string;
        };
        Returns: {
          totalPatients: number;
          activePatients: number;
          totalStudies: number;
          activeStudies: number;
        }[];
      };
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
