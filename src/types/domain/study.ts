/**
 * Domain types for studies
 * 
 * This module provides:
 * 1. Domain-specific Study and StudyReading types
 * 2. Type guards for runtime type checking
 * 3. Transform functions to convert database rows to domain types
 * 4. Validation schemas for type safety
 * 
 * @module
 */

import type { Database } from '../database.types';
import type { TypeGuard, Transform } from '../utils';
import { TransformError } from '../utils';

// Raw database types from generated types
export type StudyRow = Database['public']['Tables']['study']['Row'];
export type StudyReadingRow = Database['public']['Tables']['study_readings']['Row'];

/**
 * Domain-specific Study type with computed fields and transformations
 * Represents a complete study with all required fields and computed values
 */
export interface Study {
  // Required fields (will throw TransformError if missing)
  study_id: string;
  clinic_id: string;
  pod_id: string;
  duration_days: number;  // Computed from duration

  // Timestamps (ISO 8601 format)
  start_timestamp: string;
  end_timestamp: string;
  expected_end_timestamp: string;
  created_at: string;
  updated_at: string;

  // Metrics (defaults to 0 if missing)
  aggregated_quality_minutes: number;
  aggregated_total_minutes: number;

  // Metadata (defaults to empty string if missing)
  study_type: string;
  user_id: string;
  created_by: string;
}

/**
 * Domain-specific StudyReading type
 * Represents a single reading from a study with quality metrics
 */
export interface StudyReading {
  // Required fields (will throw TransformError if missing)
  id: string;
  study_id: string;
  timestamp: string;

  // Metrics (defaults to 0 if missing)
  quality_minutes: number;
  total_minutes: number;
  battery_level: number;

  // Metadata (defaults to empty string if missing)
  status: string;
  created_at: string;
  created_by: string;
}

/**
 * Type guard to check if a value is a Study
 * @throws {TransformError} If required fields are missing or invalid
 */
export const isStudy: TypeGuard<Study> = (value): value is Study => {
  if (typeof value !== 'object' || value === null) {
    throw new TransformError('Value must be an object');
  }

  // Check required fields
  const requiredFields = ['study_id', 'clinic_id', 'pod_id', 'duration_days'];
  const missingFields = requiredFields.filter(field => !(field in value));
  
  if (missingFields.length > 0) {
    throw new TransformError('Missing required fields', {
      missing: missingFields.join(', ')
    });
  }

  // Validate field types
  if (typeof (value as any).duration_days !== 'number') {
    throw new TransformError('duration_days must be a number');
  }

  return true;
};

/**
 * Type guard to check if a value is a StudyReading
 * @throws {TransformError} If required fields are missing or invalid
 */
export const isStudyReading: TypeGuard<StudyReading> = (value): value is StudyReading => {
  if (typeof value !== 'object' || value === null) {
    throw new TransformError('Value must be an object');
  }

  // Check required fields
  const requiredFields = ['id', 'study_id', 'timestamp'];
  const missingFields = requiredFields.filter(field => !(field in value));
  
  if (missingFields.length > 0) {
    throw new TransformError('Missing required fields', {
      missing: missingFields.join(', ')
    });
  }

  return true;
};

/**
 * Transform database row to domain Study type
 * @throws {TransformError} If required fields are missing or invalid
 */
export const toStudy: Transform<StudyRow, Study> = (row) => {
  // Validate required fields
  if (!row.study_id) {
    throw new TransformError('study_id is required');
  }

  // Calculate duration_days
  const duration_days = row.duration ? Math.ceil(row.duration / (24 * 60)) : 0;

  return {
    // Required fields
    study_id: row.study_id,
    clinic_id: row.clinic_id ?? '',
    pod_id: row.pod_id ?? '',
    duration_days,

    // Timestamps
    start_timestamp: row.start_timestamp ?? '',
    end_timestamp: row.end_timestamp ?? '',
    expected_end_timestamp: row.expected_end_timestamp ?? '',
    created_at: row.created_at ?? '',
    updated_at: row.updated_at ?? '',

    // Metrics
    aggregated_quality_minutes: row.aggregated_quality_minutes ?? 0,
    aggregated_total_minutes: row.aggregated_total_minutes ?? 0,

    // Metadata
    study_type: row.study_type ?? '',
    user_id: row.user_id ?? '',
    created_by: row.created_by ?? '',
  };
};

/**
 * Transform database row to domain StudyReading type
 * @throws {TransformError} If required fields are missing or invalid
 */
export const toStudyReading: Transform<StudyReadingRow, StudyReading> = (row) => {
  return {
    // Required fields (non-nullable in database)
    id: row.id,
    study_id: row.study_id,
    timestamp: row.timestamp,

    // Metrics (nullable with defaults)
    quality_minutes: row.quality_minutes ?? 0,
    total_minutes: row.total_minutes ?? 0,
    battery_level: row.battery_level ?? 0,

    // Metadata (nullable with defaults)
    status: row.status ?? '',
    created_at: row.created_at ?? '',
    created_by: row.created_by ?? '',
  };
};

export interface StudiesWithTimesRow {
    study_id: string;
    pod_id: string;
    start_timestamp: string;
    end_timestamp: string;
    earliest_time: string;
    latest_time: string;
    total_count: number;
}

export interface StudyListRow {
    study_id: string;
    pod_id: string;
    start_time: string;
    end_time: string;
    clinic_name: string;
    patient_id: string;
} 