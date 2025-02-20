/**
 * Domain types for clinics
 * These types extend or transform the database types with business logic
 */

import type { Database } from '../database.types';
import type { TableRow, TypeGuard, Transform, NonNullRequired } from '../utils';

// Raw database type
type ClinicRow = TableRow<'clinics'>;

/**
 * Domain-specific Clinic type
 * Enforces non-null name field unlike the database type
 */
export interface Clinic extends NonNullRequired<ClinicRow> {
  id: string;
  name: string;
}

/**
 * Analytics types for clinics
 */
export interface ClinicOverview {
  active_studies: number;
  total_studies: number;
  average_quality_hours: number;
  recent_alerts: Array<{
    alert_id: string;
    message: string;
  }> | null;
}

export interface ClinicStatusBreakdown {
  clinic_id: string | null;
  clinic_name: string | null;
  total_studies: number;
  open_studies: number;
  intervene_count: number;
  monitor_count: number;
  on_target_count: number;
  near_completion_count: number;
  needs_extension_count: number;
}

export interface ClinicQualityBreakdown {
  clinic_id: string | null;
  clinic_name: string | null;
  total_studies: number;
  open_studies: number;
  average_quality: number;
  good_count: number;
  soso_count: number;
  bad_count: number;
  critical_count: number;
}

export interface WeeklyMonthlyQuality {
  week_start?: string | null;
  month_start?: string | null;
  average_quality: number;
}

export interface WeeklyMonthlyStudies {
  week_start?: string | null;
  month_start?: string | null;
  open_studies: number;
}

export interface WeeklyHistogramPoint {
  weekStart: string;
  activeStudyCount: number;
  averageQuality: number;
}

export interface ClinicStatsRow {
  clinic_id: string;
  clinic_name: string;
  totalActiveStudies: number;
  interveneCount: number;
  monitorCount: number;
  onTargetCount: number;
  averageQuality: number;
}

export interface ClinicAnalyticsResult {
  loading: boolean;
  error: string | null;
  overview: ClinicOverview | null;
  statusBreakdown: ClinicStatusBreakdown[] | null;
  qualityBreakdown: ClinicQualityBreakdown[] | null;
  weeklyQuality: WeeklyMonthlyQuality[];
  monthlyQuality: WeeklyMonthlyQuality[];
  weeklyStudies: WeeklyMonthlyStudies[];
  monthlyStudies: WeeklyMonthlyStudies[];
  weeklyActiveStudies: WeeklyHistogramPoint[];
  weeklyAvgQuality: WeeklyHistogramPoint[];
  clinicBreakdown: ClinicStatsRow[];
  newStudiesLast3mo: number;
  growthPercent: number;
}

/**
 * Type guard to check if a value is a Clinic
 */
export const isClinic: TypeGuard<Clinic> = (value): value is Clinic => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    typeof value.name === 'string' &&
    value.name.length > 0
  );
};

/**
 * Transform database row to domain type
 * Throws an error if name is null as it's required in the domain type
 */
export const toClinic: Transform<ClinicRow, Clinic> = (row) => {
  if (!row.name) {
    throw new Error('Clinic name is required');
  }

  return {
    id: row.id,
    name: row.name,
  };
}; 