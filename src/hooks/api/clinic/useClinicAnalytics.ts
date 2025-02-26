/**
 * src/hooks/useClinicAnalytics.ts
 *
 * Provides a single, streamlined approach to fetching various clinic-level stats from Supabase
 * via RPC functions
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../core/supabase';
import type { Database } from '@/types/database.types';
import { logger } from '@/lib/logger';

// Import domain types
import type {
    ClinicOverview,
    ClinicStatusBreakdown,
    ClinicQualityBreakdown,
    WeeklyMonthlyQuality,
    WeeklyMonthlyStudies,
    ClinicAnalyticsResult,
    WeeklyHistogramPoint
} from '@/types/domain/clinic';

// Database types for conversion
type ClinicOverviewRow = Database['public']['Functions']['get_clinic_overview']['Returns'][0];
type ClinicStatusBreakdownRow = Database['public']['Functions']['get_clinic_status_breakdown']['Returns'][0];
// Not needed as it's handled directly in the domain type
// type ClinicQualityBreakdownRow = Database['public']['Functions']['get_clinic_quality_breakdown']['Returns'][0];
type ClinicWeeklyQualityRow = Database['public']['Functions']['get_clinic_weekly_quality']['Returns'][0];
type ClinicMonthlyQualityRow = Database['public']['Functions']['get_clinic_monthly_quality']['Returns'][0];
type ClinicWeeklyStudiesRow = Database['public']['Functions']['get_clinic_weekly_studies']['Returns'][0];
type ClinicMonthlyStudiesRow = Database['public']['Functions']['get_clinic_monthly_studies']['Returns'][0];

// Helper functions to convert DB types to domain types
function convertToClinicOverview(data: ClinicOverviewRow | null): ClinicOverview | null {
    if (!data) return null;
    
    let alerts = null;
    
    // Safely process the alerts JSON data
    if (data.recent_alerts && Array.isArray(data.recent_alerts)) {
        alerts = data.recent_alerts.map((alert: any) => {
            // Type guard to ensure alert is an object with the expected properties
            if (alert && typeof alert === 'object' && !Array.isArray(alert)) {
                // Access properties using type assertion after validation
                const alertObj = alert as Record<string, any>;
                return {
                    alert_id: String(alertObj.alert_id || ''),
                    message: String(alertObj.message || '')
                };
            }
            return { alert_id: '', message: 'Invalid alert data' };
        });
    }
    
    return {
        active_studies: data.active_studies,
        total_studies: data.total_studies,
        average_quality_hours: data.average_quality_hours,
        recent_alerts: alerts
    };
}

function convertToClinicStatusBreakdown(data: ClinicStatusBreakdownRow[] | null): ClinicStatusBreakdown[] | null {
    if (!data) return null;
    
    return data.map(row => ({
        clinic_id: row.clinic_id,
        clinic_name: row.clinic_name || '',
        total_studies: row.total_studies,
        open_studies: row.open_studies,
        closed: row.total_studies - row.open_studies, // Calculate closed studies
        intervene_count: row.intervene_count,
        monitor_count: row.monitor_count,
        on_target_count: row.on_target_count,
        near_completion_count: row.near_completion_count || 0,
        needs_extension_count: row.needs_extension_count || 0
    }));
}

function convertToWeeklyMonthlyQuality(data: (ClinicWeeklyQualityRow | ClinicMonthlyQualityRow)[]): WeeklyMonthlyQuality[] {
    if (!data) return [];
    
    return data.map(row => ({
        week_start: 'week_start' in row ? row.week_start : null,
        month_start: 'month_start' in row ? row.month_start : null,
        average_quality: row.average_quality || 0
    }));
}

function convertToWeeklyMonthlyStudies(data: (ClinicWeeklyStudiesRow | ClinicMonthlyStudiesRow)[]): WeeklyMonthlyStudies[] {
    if (!data) return [];
    
    return data.map(row => ({
        week_start: 'week_start' in row ? row.week_start : null,
        month_start: 'month_start' in row ? row.month_start : null,
        open_studies: row.open_studies || 0
    }));
}

// Helper function to convert weekly studies data to the format needed for charts
function convertToWeeklyHistogramPoints(data: WeeklyMonthlyStudies[]): WeeklyHistogramPoint[] {
    return data
        .filter(item => item.week_start !== null)
        .map(item => ({
            week_start: item.week_start as string,
            value: item.open_studies
        }));
}

// Helper function to convert weekly quality data to the format needed for charts
function convertToWeeklyQualityHistogramPoints(data: WeeklyMonthlyQuality[]): WeeklyHistogramPoint[] {
    return data
        .filter(item => item.week_start !== null)
        .map(item => ({
            week_start: item.week_start as string,
            value: item.average_quality
        }));
}

export function useClinicAnalytics(clinicId: string | null) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['clinic-analytics', clinicId],
        queryFn: async (): Promise<ClinicAnalyticsResult> => {
            // If clinicId is null, return default values without making API calls
            if (clinicId === null) {
                logger.warn('useClinicAnalytics called with null clinicId, skipping API calls');
                return {
                    loading: false,
                    error: null,
                    overview: null,
                    qualityBreakdown: null,
                    statusBreakdown: null,
                    weeklyQuality: [],
                    monthlyQuality: [],
                    weeklyStudies: [],
                    monthlyStudies: [],
                    weeklyActiveStudies: [],
                    weeklyAvgQuality: [],
                    clinicBreakdown: [],
                    newStudiesLast3mo: 0,
                    growthPercent: 0
                };
            }

            try {
                // Now clinicId is guaranteed to be a string (not null)
                // No need for `clinicId || ''` since we've handled the null case
                
                // Fetch overview - requires _clinic_id
                const { data: overviewData, error: overviewError } = await supabase
                    .rpc('get_clinic_overview', { _clinic_id: clinicId });
                if (overviewError) throw overviewError;

                // Fetch quality breakdown - has an overload with optional _clinic_id
                const { data: qualityData, error: qualityError } = await supabase
                    .rpc('get_clinic_quality_breakdown', { _clinic_id: clinicId });
                if (qualityError) throw qualityError;

                // Fetch status breakdown - has an overload with optional _clinic_id
                const { data: statusData, error: statusError } = await supabase
                    .rpc('get_clinic_status_breakdown', { _clinic_id: clinicId });
                if (statusError) throw statusError;

                // Fetch weekly quality - has an overload without _clinic_id
                const { data: weeklyQualityData, error: weeklyQualityError } = await supabase
                    .rpc('get_clinic_weekly_quality', { _clinic_id: clinicId });
                if (weeklyQualityError) throw weeklyQualityError;

                // Fetch monthly quality - requires _clinic_id
                const { data: monthlyQualityData, error: monthlyQualityError } = await supabase
                    .rpc('get_clinic_monthly_quality', { _clinic_id: clinicId });
                if (monthlyQualityError) throw monthlyQualityError;

                // Fetch weekly studies - requires _clinic_id
                const { data: weeklyStudiesData, error: weeklyStudiesError } = await supabase
                    .rpc('get_clinic_weekly_studies', { _clinic_id: clinicId });
                if (weeklyStudiesError) throw weeklyStudiesError;

                // Fetch monthly studies - requires _clinic_id
                const { data: monthlyStudiesData, error: monthlyStudiesError } = await supabase
                    .rpc('get_clinic_monthly_studies', { _clinic_id: clinicId });
                if (monthlyStudiesError) throw monthlyStudiesError;

                // Convert the data to the appropriate formats
                const weeklyQuality = convertToWeeklyMonthlyQuality(weeklyQualityData || []);
                const weeklyStudies = convertToWeeklyMonthlyStudies(weeklyStudiesData || []);

                return {
                    loading: false,
                    error: null,
                    overview: convertToClinicOverview(overviewData?.[0] || null),
                    qualityBreakdown: qualityData as ClinicQualityBreakdown[] || null,
                    statusBreakdown: convertToClinicStatusBreakdown(statusData),
                    weeklyQuality: weeklyQuality,
                    monthlyQuality: convertToWeeklyMonthlyQuality(monthlyQualityData || []),
                    weeklyStudies: weeklyStudies,
                    monthlyStudies: convertToWeeklyMonthlyStudies(monthlyStudiesData || []),
                    // Convert weekly studies to active studies format for charts
                    weeklyActiveStudies: convertToWeeklyHistogramPoints(weeklyStudies),
                    // Convert weekly quality to avg quality format for charts
                    weeklyAvgQuality: convertToWeeklyQualityHistogramPoints(weeklyQuality),
                    clinicBreakdown: [],
                    newStudiesLast3mo: 0,
                    growthPercent: 0
                };
            } catch (err) {
                logger.error('Failed to fetch clinic analytics', { error: err, clinicId });
                return {
                    loading: false,
                    error: err instanceof Error ? err.message : 'An unknown error occurred',
                    overview: null,
                    qualityBreakdown: null,
                    statusBreakdown: null,
                    weeklyQuality: [],
                    monthlyQuality: [],
                    weeklyStudies: [],
                    monthlyStudies: [],
                    weeklyActiveStudies: [],
                    weeklyAvgQuality: [],
                    clinicBreakdown: [],
                    newStudiesLast3mo: 0,
                    growthPercent: 0
                };
            }
        },
        staleTime: 60000, // Data is fresh for 1 minute
        // Skip the query if clinicId is null
        enabled: clinicId !== null,
    });

    return {
        data, 
        isLoading,
        error: error ? (error instanceof Error ? error.message : String(error)) : null
    };
}
