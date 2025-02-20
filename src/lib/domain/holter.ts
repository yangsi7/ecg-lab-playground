import type { HolterStudy, HolterStudyRow } from '../../types/domain/holter';

// Transformation functions
export function transformHolterStudy(row: HolterStudyRow): HolterStudy {
  return {
    ...row,
    qualityFraction: calculateQualityFraction(row),
    totalHours: calculateTotalHours(row),
    daysRemaining: calculateDaysRemaining(row),
    interruptions: calculateInterruptions(row),
    qualityVariance: calculateQualityVariance(row),
  };
}

// Helper functions for transformations
function calculateQualityFraction(row: HolterStudyRow): number {
  return row.quality_minutes / (row.total_minutes || 1);
}

function calculateTotalHours(row: HolterStudyRow): number {
  return row.total_minutes / 60;
}

function calculateDaysRemaining(row: HolterStudyRow): number {
  const now = new Date();
  const end = new Date(row.end_timestamp);
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function calculateInterruptions(row: HolterStudyRow): number {
  return row.interruption_count || 0;
}

function calculateQualityVariance(row: HolterStudyRow): number {
  return row.quality_variance || 0;
}

// Validation functions
export function validateHolterStudy(study: HolterStudy): string[] {
  const errors: string[] = [];

  if (study.qualityFraction < 0 || study.qualityFraction > 1) {
    errors.push('Quality fraction must be between 0 and 1');
  }

  if (study.totalHours < 0) {
    errors.push('Total hours cannot be negative');
  }

  if (study.interruptions < 0) {
    errors.push('Interruptions cannot be negative');
  }

  return errors;
}

// Constants and configurations
export const QUALITY_THRESHOLDS = {
  LOW: 0.6,
  MEDIUM: 0.8,
  HIGH: 0.9,
} as const;

export const STUDY_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  INTERRUPTED: 'interrupted',
  FAILED: 'failed',
} as const;

export type StudyStatus = typeof STUDY_STATUS[keyof typeof STUDY_STATUS]; 