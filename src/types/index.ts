// Common Types
export type Clinic = {
  id: string;
  name: string;
};

export type Study = {
  study_id: string;
  clinic_id: string;
  pod_id: string;
  aggregated_quality_minutes: number;
  aggregated_total_minutes: number;
  duration_days: number;
  end_timestamp: string;
  expected_end_timestamp: string;
  start_timestamp: string;
  study_type: string;
  updated_at: string;
  user_id: string;
  created_at: string;
  created_by: string;
};

export type StudyReading = {
  id: string;
  created_at: string;
  created_by: string;
  quality_minutes: number;
  status: string;
  study_id: string;
  timestamp: string;
  total_minutes: number;
  battery_level: number;
};

export interface ECGData {
  sample_time: string;
  downsampled_channel_1: number;
  downsampled_channel_2: number;
  downsampled_channel_3: number;
  lead_on_p_1: boolean;
  lead_on_p_2: boolean;
  lead_on_p_3: boolean;
  lead_on_n_1: boolean;
  lead_on_n_2: boolean;
  lead_on_n_3: boolean;
  quality_1: boolean;
  quality_2: boolean;
  quality_3: boolean;
}

export interface ECGQueryOptions {
  pod_id: string;
  time_start: string;
  time_end: string;
  max_pts?: number;
}
