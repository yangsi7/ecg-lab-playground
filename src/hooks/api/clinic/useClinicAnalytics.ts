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

// Get the RPC function return types directly from database.types.ts
type ClinicOverviewRow = Database['public']['Functions']['get_clinic_overview']['Returns'][0];
type ClinicQualityBreakdownRow = Database['public']['Functions']['get_clinic_quality_breakdown']['Returns'][0];
type ClinicStatusBreakdownRow = Database['public']['Functions']['get_clinic_status_breakdown']['Returns'][0];
type ClinicWeeklyQualityRow = Database['public']['Functions']['get_clinic_weekly_quality']['Returns'][0];
type ClinicMonthlyQualityRow = Database['public']['Functions']['get_clinic_monthly_quality']['Returns'][0];
type ClinicWeeklyStudiesRow = Database['public']['Functions']['get_clinic_weekly_studies']['Returns'][0];
type ClinicMonthlyStudiesRow = Database['public']['Functions']['get_clinic_monthly_studies']['Returns'][0];

export interface ClinicAnalyticsResult {
    overview: ClinicOverviewRow | null;
    qualityBreakdown: ClinicQualityBreakdownRow[] | null;
    statusBreakdown: ClinicStatusBreakdownRow[] | null;
    weeklyQuality: ClinicWeeklyQualityRow[];
    monthlyQuality: ClinicMonthlyQualityRow[];
    weeklyStudies: ClinicWeeklyStudiesRow[];
    monthlyStudies: ClinicMonthlyStudiesRow[];
}

export function useClinicAnalytics(clinicId: string | null) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['clinic-analytics', clinicId],
        queryFn: async (): Promise<ClinicAnalyticsResult> => {
            if (!clinicId) {
                return {
                    overview: null,
                    qualityBreakdown: null,
                    statusBreakdown: null,
                    weeklyQuality: [],
                    monthlyQuality: [],
                    weeklyStudies: [],
                    monthlyStudies: []
                };
            }

            try {
                // Fetch overview
                const { data: overviewData, error: overviewError } = await supabase
                    .rpc('get_clinic_overview', { _clinic_id: clinicId });
                if (overviewError) throw overviewError;

                // Fetch quality breakdown
                const { data: qualityData, error: qualityError } = await supabase
                    .rpc('get_clinic_quality_breakdown', { _clinic_id: clinicId });
                if (qualityError) throw qualityError;

                // Fetch status breakdown
                const { data: statusData, error: statusError } = await supabase
                    .rpc('get_clinic_status_breakdown', { _clinic_id: clinicId });
                if (statusError) throw statusError;

                // Fetch weekly quality
                const { data: weeklyQualityData, error: weeklyQualityError } = await supabase
                    .rpc('get_clinic_weekly_quality', { _clinic_id: clinicId });
                if (weeklyQualityError) throw weeklyQualityError;

                // Fetch monthly quality
                const { data: monthlyQualityData, error: monthlyQualityError } = await supabase
                    .rpc('get_clinic_monthly_quality', { _clinic_id: clinicId });
                if (monthlyQualityError) throw monthlyQualityError;

                // Fetch weekly studies
                const { data: weeklyStudiesData, error: weeklyStudiesError } = await supabase
                    .rpc('get_clinic_weekly_studies', { _clinic_id: clinicId });
                if (weeklyStudiesError) throw weeklyStudiesError;

                // Fetch monthly studies
                const { data: monthlyStudiesData, error: monthlyStudiesError } = await supabase
                    .rpc('get_clinic_monthly_studies', { _clinic_id: clinicId });
                if (monthlyStudiesError) throw monthlyStudiesError;

                return {
                    overview: overviewData?.[0] ?? null,
                    qualityBreakdown: qualityData ?? null,
                    statusBreakdown: statusData ?? null,
                    weeklyQuality: weeklyQualityData ?? [],
                    monthlyQuality: monthlyQualityData ?? [],
                    weeklyStudies: weeklyStudiesData ?? [],
                    monthlyStudies: monthlyStudiesData ?? []
                };
            } catch (err) {
                logger.error('Failed to fetch clinic analytics', { error: err, clinicId });
                throw err;
            }
        },
        enabled: true, // Always enabled, handle null clinicId in the query function
        staleTime: 30000, // Consider data fresh for 30 seconds
    });

    return {
        data,
        isLoading,
        error: error instanceof Error ? error.message : 'An error occurred'
    };
}
