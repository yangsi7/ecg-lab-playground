/**
 * Domain types for Holter studies
 * These types extend or transform the database types with business logic
 */

import type { Database } from '../database.types';
import type { TableRow, TypeGuard, Transform, NonNullRequired } from '../utils';
import type { Study } from './study';

// Raw database type
type StudyRow = TableRow<'study'>;

/**
 * Status type for Holter studies
 */
export type HolterStatus = 'critical' | 'warning' | 'good' | 'normal';

/**
 * Domain-specific Holter Study type with computed fields
 * Extends Study type but replaces duration_days with Holter-specific fields
 */
export interface HolterStudy extends Omit<Study, 'duration_days'> {
  // Required fields from Study (non-nullable)
  study_id: string;
  clinic_id: string;
  pod_id: string;

  // Holter-specific fields (non-nullable)
  clinic_name: string;
  duration: number;
  daysRemaining: number;

  // Quality metrics (non-nullable)
  totalQualityHours: number;
  qualityFraction: number;
  totalHours: number;
  interruptions: number;
  qualityVariance: number;
  status: HolterStatus;
}

/**
 * Type guard to check if a value is a HolterStudy
 */
export const isHolterStudy: TypeGuard<HolterStudy> = (value): value is HolterStudy => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'study_id' in value &&
    'clinic_name' in value &&
    'duration' in value &&
    'qualityFraction' in value &&
    typeof value.qualityFraction === 'number' &&
    value.qualityFraction >= 0 &&
    value.qualityFraction <= 1
  );
};

/**
 * Calculate Holter study status based on quality metrics
 */
export function calculateHolterStatus(qualityFraction: number): HolterStatus {
  if (qualityFraction < 0.5) return 'critical';
  if (qualityFraction < 0.7) return 'warning';
  if (qualityFraction >= 0.8) return 'good';
  return 'normal';
}

/**
 * Transform database row to domain type
 */
export const toHolterStudy: Transform<StudyRow & { clinic_name: string }, HolterStudy> = (row) => {
  const now = new Date();
  const endDate = row.end_timestamp ? new Date(row.end_timestamp) : now;
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  
  const totalHours = (row.aggregated_total_minutes ?? 0) / 60;
  const qualityHours = (row.aggregated_quality_minutes ?? 0) / 60;
  const qualityFraction = totalHours > 0 ? qualityHours / totalHours : 0;

  // This would need to be calculated based on actual data analysis
  const qualityVariance = 0;
  const interruptions = 0;

  return {
    // Study fields
    study_id: row.study_id,
    clinic_id: row.clinic_id ?? '',
    pod_id: row.pod_id ?? '',
    start_timestamp: row.start_timestamp ?? '',
    end_timestamp: row.end_timestamp ?? '',
    expected_end_timestamp: row.expected_end_timestamp ?? '',
    study_type: row.study_type ?? '',
    user_id: row.user_id ?? '',
    created_at: row.created_at ?? '',
    created_by: row.created_by ?? '',
    updated_at: row.updated_at ?? '',
    aggregated_quality_minutes: row.aggregated_quality_minutes ?? 0,
    aggregated_total_minutes: row.aggregated_total_minutes ?? 0,

    // Holter-specific fields
    clinic_name: row.clinic_name,
    duration: row.duration ?? 0,
    daysRemaining,
    totalQualityHours: qualityHours,
    qualityFraction,
    totalHours,
    interruptions,
    qualityVariance,
    status: calculateHolterStatus(qualityFraction),
  };
}; 