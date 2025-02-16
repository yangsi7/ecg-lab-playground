export interface StudyWithDetails {
  study_id: string;
  pod_id: string;
  start_timestamp: string;
  end_timestamp: string;
  clinic_id?: string;
  user_id?: string;
  study_type?: string;
}

export interface AggregatedBucket {
  time_bucket: string;
  lead_on_p_1: number;
  lead_on_p_2: number;
  lead_on_p_3: number;
  lead_on_n_1: number;
  lead_on_n_2: number;
  lead_on_n_3: number;
  quality_1_percent: number;
  quality_2_percent: number;
  quality_3_percent: number;
}
