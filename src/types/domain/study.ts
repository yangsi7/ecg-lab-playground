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

import type { Database } from '@/types/database.types';
import type { TypeGuard, Transform } from '@/types/utils';

// Base study type from DB
export type StudyRow = Database['public']['Tables']['study']['Row'];
export type StudyReadingRow = Database['public']['Tables']['study_readings']['Row'];

// Enhanced study type with required fields
export type Study = {
    study_id: string;
    clinic_id: string;
    pod_id: string;
    start_timestamp: string;
    end_timestamp: string;
    expected_end_timestamp: string;
    duration: number;
    study_type: string;
    aggregated_quality_minutes: number;
    aggregated_total_minutes: number;
    created_at: string;
    created_by: string;
    updated_at: string;
    user_id: string;
    status: 'active' | 'completed' | 'error' | 'interrupted';
};

// Study with readings
export interface StudyWithReadings extends Study {
    readings: StudyReadingRow[];
}

// Type guard
export const isStudy: TypeGuard<Study> = (value): value is Study => {
    if (!value || typeof value !== 'object') return false;
    
    const study = value as Partial<Study>;
    return typeof study.study_id === 'string' &&
           typeof study.clinic_id === 'string' &&
           typeof study.pod_id === 'string' &&
           typeof study.start_timestamp === 'string' &&
           typeof study.end_timestamp === 'string';
};

// Domain transformations
export const toStudy: Transform<StudyRow, Study> = (row) => {
    if (!row.study_id || !row.pod_id || !row.clinic_id) {
        throw new Error('Invalid study row: missing required fields');
    }
    
    return {
        study_id: row.study_id,
        clinic_id: row.clinic_id,
        pod_id: row.pod_id,
        start_timestamp: row.start_timestamp ?? '',
        end_timestamp: row.end_timestamp ?? '',
        expected_end_timestamp: row.expected_end_timestamp ?? '',
        duration: row.duration ?? 0,
        study_type: row.study_type ?? '',
        aggregated_quality_minutes: row.aggregated_quality_minutes ?? 0,
        aggregated_total_minutes: row.aggregated_total_minutes ?? 0,
        created_at: row.created_at ?? '',
        created_by: row.created_by ?? '',
        updated_at: row.updated_at ?? '',
        user_id: row.user_id ?? '',
        status: row.study_type === 'completed' ? 'completed' : 'active'
    };
};

// Types from RPC functions
export type StudiesWithTimesRow = Database['public']['Functions']['get_studies_with_pod_times']['Returns'][0];
export type StudyDetailsWithTimes = Database['public']['Functions']['get_study_details_with_earliest_latest']['Returns'][0];
export type StudyListRow = Database['public']['Functions']['get_study_list_with_earliest_latest']['Returns'][0]; 