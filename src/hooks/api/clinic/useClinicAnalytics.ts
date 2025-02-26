/**
 * src/hooks/useClinicAnalytics.ts
 *
 * Provides a single, streamlined approach to fetching various clinic-level stats from Supabase
 * via RPC functions
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/types/supabase';
import type { ClinicTableStat } from '@/hooks/api/clinic/useClinicData';
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

// Function to create a clinic breakdown object from table stats
function createClinicBreakdown(clinicData: ClinicTableStat) {
    return [{
        // Using any type to bypass type checking
        clinic_id: clinicData.clinic_id,
        clinic_name: clinicData.clinic_name,
        totalActiveStudies: clinicData.open_studies,
        interveneCount: clinicData.intervene_count,
        monitorCount: clinicData.monitor_count,
        onTargetCount: clinicData.on_target_count,
        averageQuality: clinicData.average_quality
    }] as any[];
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
                // Fetch all clinic stats with the consolidated function
                const { data: clinicStatsData, error: clinicStatsError } = await supabase
                    .rpc('get_clinic_table_stats');
                if (clinicStatsError) throw clinicStatsError;

                // Find the specific clinic data
                const clinicData = clinicStatsData.find(
                    (clinic: ClinicTableStat) => clinic.clinic_id === clinicId
                );
                
                if (!clinicData) {
                    throw new Error(`Clinic not found with ID: ${clinicId}`);
                }

                // Fetch weekly quality data - still needed for charts
                const { data: weeklyQualityData, error: weeklyQualityError } = await supabase
                    .rpc('get_clinic_weekly_quality', { _clinic_id: clinicId });
                if (weeklyQualityError) throw weeklyQualityError;

                // Fetch monthly quality data - now fetches all clinics' data
                const { data: allMonthlyQualityData, error: monthlyQualityError } = await supabase
                    .rpc('get_clinic_monthly_quality');
                if (monthlyQualityError) throw monthlyQualityError;
                
                // Filter monthly quality data for the current clinic
                const monthlyQualityData = allMonthlyQualityData.filter(
                    (item: any) => item.clinic_id === clinicId
                );

                // Fetch weekly studies data - still needed for charts
                const { data: weeklyStudiesData, error: weeklyStudiesError } = await supabase
                    .rpc('get_clinic_weekly_studies', { _clinic_id: clinicId });
                if (weeklyStudiesError) throw weeklyStudiesError;

                // Fetch monthly studies data - now fetches all clinics' data
                const { data: allMonthlyStudiesData, error: monthlyStudiesError } = await supabase
                    .rpc('get_clinic_monthly_studies');
                if (monthlyStudiesError) throw monthlyStudiesError;
                
                // Filter monthly studies data for the current clinic
                const monthlyStudiesData = allMonthlyStudiesData.filter(
                    (item: any) => item.clinic_id === clinicId
                );

                // Process the weekly and monthly data
                const weeklyQuality = weeklyQualityData.map((item: any) => ({
                    week_start: item.week_start,
                    month_start: null,
                    average_quality: item.average_quality
                }));
                
                const monthlyQuality = monthlyQualityData.map((item: any) => ({
                    week_start: null,
                    month_start: item.month_start,
                    average_quality: item.average_quality_percent || item.average_quality // Handle different field names
                }));
                
                const weeklyStudies = weeklyStudiesData.map((item: any) => ({
                    week_start: item.week_start,
                    month_start: null,
                    open_studies: item.open_studies
                }));
                
                const monthlyStudies = monthlyStudiesData.map((item: any) => ({
                    week_start: null,
                    month_start: item.month_start,
                    open_studies: item.open_studies
                }));

                // Create an overview object from the consolidated data
                const overview: ClinicOverview = {
                    active_studies: clinicData.open_studies,
                    total_studies: clinicData.total_studies,
                    average_quality_hours: clinicData.average_quality_hours,
                    recent_alerts: Array.isArray(clinicData.recent_alerts) 
                        ? clinicData.recent_alerts.map((alert: any) => ({
                            alert_id: String(alert.alert_id || ''),
                            message: String(alert.message || '')
                          }))
                        : null
                };

                // Create a status breakdown object from the consolidated data
                const statusBreakdown: ClinicStatusBreakdown = {
                    clinic_id: clinicData.clinic_id,
                    clinic_name: clinicData.clinic_name,
                    total_studies: clinicData.total_studies,
                    open_studies: clinicData.open_studies,
                    closed: clinicData.total_studies - clinicData.open_studies,
                    intervene_count: clinicData.intervene_count,
                    monitor_count: clinicData.monitor_count,
                    on_target_count: clinicData.on_target_count,
                    near_completion_count: clinicData.near_completion_count,
                    needs_extension_count: clinicData.needs_extension_count
                };

                // Create a quality breakdown object from the consolidated data
                const qualityBreakdown: ClinicQualityBreakdown = {
                    clinic_id: clinicData.clinic_id,
                    clinic_name: clinicData.clinic_name,
                    total_studies: clinicData.total_studies,
                    open_studies: clinicData.open_studies,
                    average_quality: clinicData.average_quality,
                    good_count: clinicData.good_count,
                    soso_count: clinicData.soso_count,
                    bad_count: clinicData.bad_count,
                    critical_count: clinicData.critical_count
                };

                return {
                    loading: false,
                    error: null,
                    overview: overview,
                    qualityBreakdown: [qualityBreakdown],
                    statusBreakdown: [statusBreakdown],
                    weeklyQuality: weeklyQuality,
                    monthlyQuality: monthlyQuality,
                    weeklyStudies: weeklyStudies,
                    monthlyStudies: monthlyStudies,
                    weeklyActiveStudies: convertToWeeklyHistogramPoints(weeklyStudies),
                    weeklyAvgQuality: convertToWeeklyQualityHistogramPoints(weeklyQuality),
                    clinicBreakdown: createClinicBreakdown(clinicData),
                    newStudiesLast3mo: 0, // This might need another call or calculation
                    growthPercent: 0 // This might need another call or calculation
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
