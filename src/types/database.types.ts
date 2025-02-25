import { SupabaseClient } from '@supabase/supabase-js'

declare global {
  interface Database {
    public: {
      Functions: {
        get_clinic_table_stats: {
          Args: Record<string, never>
          Returns: ClinicTableStat[]
        }
        get_clinic_status_breakdown: {
          Args: { _clinic_id: string }
          Returns: ClinicStatusBreakdown[]
        }
        get_clinic_weekly_quality: {
          Args: { _clinic_id: string }
          Returns: WeeklyQualityMetric[]
        }
        get_clinic_weekly_studies: {
          Args: { _clinic_id: string }
          Returns: WeeklyStudyCount[]
        }
      }
    }
  }
}

export interface ClinicTableStat {
  clinic_id: string
  clinic_name: string
  total_studies: number
  open_studies: number
  average_quality: number
  good_count: number
  soso_count: number
  bad_count: number
  critical_count: number
  average_quality_hours: number
  recent_alerts: string[]
}

export interface ClinicStatusBreakdown {
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
}

export interface WeeklyQualityMetric {
  week_start: string
  average_quality: number
}

export interface WeeklyStudyCount {
  week_start: string
  open_studies: number
}
