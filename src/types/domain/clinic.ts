/**
 * Domain types for clinics
 * These types extend or transform the database types with business logic
 */

import type { Database } from '../database.types';
import type { TypeGuard, Transform } from '../utils';

// Raw database types from generated types
export type ClinicRow = Database['public']['Tables']['clinics']['Row'];

// RPC function return types
export type ClinicOverviewRow = Database['public']['Functions']['get_clinic_overview']['Returns'][0];
export type ClinicStatusBreakdownRow = Database['public']['Functions']['get_clinic_status_breakdown']['Returns'][0];
export type ClinicQualityBreakdownRow = Database['public']['Functions']['get_clinic_quality_breakdown']['Returns'][0];
export type ClinicWeeklyQualityRow = Database['public']['Functions']['get_clinic_weekly_quality']['Returns'][0];
export type ClinicMonthlyQualityRow = Database['public']['Functions']['get_clinic_monthly_quality']['Returns'][0];
export type ClinicWeeklyStudiesRow = Database['public']['Functions']['get_clinic_weekly_studies']['Returns'][0];
export type ClinicMonthlyStudiesRow = Database['public']['Functions']['get_clinic_monthly_studies']['Returns'][0];
export type ClinicAnalyticsRow = Database['public']['Functions']['get_clinic_analytics']['Returns'][0];

// Domain-specific Clinic type with required fields
export interface Clinic {
    id: string;
    name: string;
}

// Type guard to check if a value is a Clinic
export const isClinic: TypeGuard<Clinic> = (value): value is Clinic => {
    if (!value || typeof value !== 'object') return false;
    
    const clinic = value as Partial<Clinic>;
    return typeof clinic.id === 'string' &&
           typeof clinic.name === 'string' &&
           clinic.name.length > 0;
};

// Transform database row to domain type
export const toClinic: Transform<ClinicRow, Clinic> = (row) => {
    if (!row.name) {
        throw new Error('Clinic name is required');
    }
    
    return {
        id: row.id,
        name: row.name
    };
};

// Analytics types using RPC return types
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
    clinic_id: string;
    clinic_name: string;
    total_studies: number;
    open_studies: number;
    closed: number;
    intervene_count: number;
    monitor_count: number;
    on_target_count: number;
    near_completion_count: number;
    needs_extension_count: number;
}

export interface ClinicQualityBreakdown {
    clinic_id: string;
    clinic_name: string;
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
    week_start: string;
    value: number;
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