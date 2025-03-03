/**
 *src/hooks/api/clinic/useClinicAnalytics.ts
 *
 * Provides a single, streamlined approach to fetching various clinic-level stats from Supabase
 * via RPC functions. Uses the consolidated get_clinic_table_stats function for efficiency.
 */

import { useQuery } from '@tanstack/react-query';
import { useClinicTableStats } from '@/hooks/api/clinic/useClinicData';
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
import { useClinicTimeSeriesData } from './useClinicData';

/**
 * Helper function to convert weekly studies data to the format needed for charts
 */
function convertToWeeklyHistogramPoints(data: WeeklyMonthlyStudies[]): WeeklyHistogramPoint[] {
    return data
        .filter(item => item.week_start !== null)
        .map(item => ({
            week_start: item.week_start as string,
            value: item.open_studies
        }));
}

/**
 * Helper function to convert weekly quality data to the format needed for charts
 */
function convertToWeeklyQualityHistogramPoints(data: WeeklyMonthlyQuality[]): WeeklyHistogramPoint[] {
    return data
        .filter(item => item.week_start !== null)
        .map(item => ({
            week_start: item.week_start as string,
            value: item.average_quality
        }));
}

/**
 * Function to create a clinic breakdown object from table stats
 */
function createClinicBreakdown(clinicData: ClinicTableStat) {
    return [{
        clinic_id: clinicData.clinic_id,
        clinic_name: clinicData.clinic_name,
        totalStudies: clinicData.total_studies,
        openStudies: clinicData.open_studies,
        averageQuality: clinicData.average_quality,
        goodCount: clinicData.good_count,
        sosoCount: clinicData.soso_count,
        badCount: clinicData.bad_count,
        criticalCount: clinicData.critical_count,
        averageQualityHours: clinicData.average_quality_hours,
        recentAlerts: Array.isArray(clinicData.recent_alerts) ? clinicData.recent_alerts : null,
        interveneCount: clinicData.intervene_count,
        monitorCount: clinicData.monitor_count,
        onTargetCount: clinicData.on_target_count,
        nearCompletionCount: clinicData.near_completion_count,
        needsExtensionCount: clinicData.needs_extension_count,
        completedCount: clinicData.completed_count,
        extendedCount: clinicData.extended_count
    }];
}

/**
 * Hook to fetch and process clinic analytics data
 * Uses the consolidated get_clinic_table_stats RPC function and time series data
 */
export function useClinicAnalytics(clinicId: string | null) {
    // Get clinic table stats from the shared hook
    const { 
        rawData: allClinicsData, 
        isLoading: isLoadingStats, 
        error: statsError 
    } = useClinicTableStats();
    
    // Get time series data for charts
    const { 
        weeklyQuality, 
        weeklyStudies,
        isLoading: isLoadingTimeSeries,
        error: timeSeriesError
    } = useClinicTimeSeriesData(clinicId);

    // Process the data into the expected format
    const data = useQuery({
        queryKey: ['clinic-analytics-processed', clinicId, allClinicsData, weeklyQuality.data, weeklyStudies.data],
        queryFn: (): ClinicAnalyticsResult => {
            logger.debug('useClinicAnalytics: Processing data', { 
                clinicId, 
                hasAllClinicsData: !!allClinicsData, 
                clinicsCount: allClinicsData?.length || 0,
                hasWeeklyQualityData: !!weeklyQuality.data,
                weeklyQualityCount: weeklyQuality.data?.length || 0,
                hasWeeklyStudiesData: !!weeklyStudies.data,
                weeklyStudiesCount: weeklyStudies.data?.length || 0
            });
            
            // Even if clinicId is null, we should still process the data
            // We'll use the first clinic as a fallback
            if (!allClinicsData || allClinicsData.length === 0) {
                logger.debug('useClinicAnalytics: No clinic data available');
                // Return a default structure with empty arrays instead of null
                // This allows the UI to render empty states instead of nothing
                return {
                    loading: false,
                    error: null,
                    overview: {
                        active_studies: 0,
                        total_studies: 0,
                        average_quality_hours: 0,
                        recent_alerts: []
                    },
                    qualityBreakdown: [],
                    statusBreakdown: [],
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
                // If clinicId is null, use the first clinic in the list
                let clinicData: ClinicTableStat;
                
                if (clinicId === null) {
                    // Use the first clinic as a fallback
                    clinicData = allClinicsData[0];
                    logger.debug('Using first clinic as fallback', { clinicId: clinicData.clinic_id });
                } else {
                    // Find the specific clinic data
                    const foundClinic = allClinicsData.find(
                        (clinic: ClinicTableStat) => clinic.clinic_id === clinicId
                    );
                    
                    if (!foundClinic) {
                        logger.warn(`Clinic not found with ID: ${clinicId}, using first clinic as fallback`);
                        clinicData = allClinicsData[0];
                    } else {
                        clinicData = foundClinic;
                    }
                }

                // Log the clinic data we're using
                logger.debug('Using clinic data', { 
                    clinic_id: clinicData.clinic_id,
                    clinic_name: clinicData.clinic_name,
                    total_studies: clinicData.total_studies,
                    open_studies: clinicData.open_studies
                });

                // Process the weekly quality data
                const processedWeeklyQuality = weeklyQuality.data && weeklyQuality.data.length > 0
                    ? weeklyQuality.data.map(item => ({
                        week_start: item.week_start,
                        month_start: null,
                        average_quality: item.average_quality
                      }))
                    : [];
                
                // Process the weekly studies data
                const processedWeeklyStudies = weeklyStudies.data && weeklyStudies.data.length > 0
                    ? weeklyStudies.data.map(item => ({
                        week_start: item.week_start,
                        month_start: null,
                        open_studies: item.open_studies
                      }))
                    : [];

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

                // Log the breakdown objects
                logger.debug('useClinicAnalytics: Breakdown objects', {
                    statusBreakdown,
                    qualityBreakdown
                });

                // Create a dummy clinic for testing if there's no data
                const dummyClinic: ClinicStatusBreakdown = {
                    clinic_id: 'dummy-clinic',
                    clinic_name: 'Dummy Clinic',
                    total_studies: 10,
                    open_studies: 5,
                    closed: 5,
                    intervene_count: 1,
                    monitor_count: 2,
                    on_target_count: 1,
                    near_completion_count: 1,
                    needs_extension_count: 0
                };

                const dummyQuality: ClinicQualityBreakdown = {
                    clinic_id: 'dummy-clinic',
                    clinic_name: 'Dummy Clinic',
                    total_studies: 10,
                    open_studies: 5,
                    average_quality: 0.75,
                    good_count: 3,
                    soso_count: 1,
                    bad_count: 1,
                    critical_count: 0
                };

                // Remove dummy data and map all clinic data
                const statusBreakdowns = allClinicsData.map(clinic => ({
                    clinic_id: clinic.clinic_id,
                    clinic_name: clinic.clinic_name,
                    total_studies: clinic.total_studies,
                    open_studies: clinic.open_studies,
                    closed: clinic.total_studies - clinic.open_studies,
                    intervene_count: clinic.intervene_count,
                    monitor_count: clinic.monitor_count,
                    on_target_count: clinic.on_target_count,
                    near_completion_count: clinic.near_completion_count,
                    needs_extension_count: clinic.needs_extension_count
                }));
                
                const qualityBreakdowns = allClinicsData.map(clinic => ({
                    clinic_id: clinic.clinic_id,
                    clinic_name: clinic.clinic_name,
                    total_studies: clinic.total_studies,
                    open_studies: clinic.open_studies,
                    average_quality: clinic.average_quality,
                    good_count: clinic.good_count,
                    soso_count: clinic.soso_count,
                    bad_count: clinic.bad_count,
                    critical_count: clinic.critical_count
                }));

                return {
                    loading: false,
                    error: null,
                    overview: overview,
                    qualityBreakdown: qualityBreakdowns,
                    statusBreakdown: statusBreakdowns,
                    weeklyQuality: processedWeeklyQuality,
                    monthlyQuality: [], // We'll add this in useClinicDetails
                    weeklyStudies: processedWeeklyStudies,
                    monthlyStudies: [], // We'll add this in useClinicDetails
                    weeklyActiveStudies: convertToWeeklyHistogramPoints(processedWeeklyStudies),
                    weeklyAvgQuality: convertToWeeklyQualityHistogramPoints(processedWeeklyQuality),
                    clinicBreakdown: createClinicBreakdown(clinicData),
                    newStudiesLast3mo: 0, // This might need another call or calculation
                    growthPercent: 0 // This might need another call or calculation
                };
            } catch (err) {
                logger.error('Failed to process clinic analytics', { error: err, clinicId });
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
        // Enable the query regardless of clinicId, but only when we have the necessary data
        enabled: !isLoadingStats && !isLoadingTimeSeries && !!allClinicsData,
        staleTime: 60000, // Data is fresh for 1 minute
    });

    // Log the enabled state to see if the query is being triggered
    logger.debug('useClinicAnalytics: Query enabled state', {
        clinicIdPresent: clinicId !== null,
        isLoadingStats,
        isLoadingTimeSeries,
        hasAllClinicsData: !!allClinicsData,
        queryEnabled: !isLoadingStats && !isLoadingTimeSeries && !!allClinicsData
    });

    const isLoading = isLoadingStats || isLoadingTimeSeries || data.isLoading;
    const error = statsError || timeSeriesError || data.error;

    // Log the final result state
    logger.debug('useClinicAnalytics: Final result state', {
        isLoading,
        hasError: !!error,
        hasData: !!data.data,
        hasOverview: !!data.data?.overview,
        hasStatusBreakdown: !!data.data?.statusBreakdown,
        hasQualityBreakdown: !!data.data?.qualityBreakdown
    });

    return {
        data: data.data, 
        isLoading,
        error: error ? (error instanceof Error ? error.message : String(error)) : null
    };
}
