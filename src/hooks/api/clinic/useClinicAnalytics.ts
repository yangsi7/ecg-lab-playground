import { useState, useEffect } from 'react';
import { logger } from '../../../lib/logger';
import { useRPC } from '../core/useRPC';
import type { Database, Json } from '../../../types/database.types';

type RPCFunctionName = keyof Database['public']['Functions'];
type RPCFunctionArgs<T extends RPCFunctionName> = Database['public']['Functions'][T]['Args'];
type RPCFunctionReturns<T extends RPCFunctionName> = Database['public']['Functions'][T]['Returns'];

export interface ClinicAnalyticsResult {
  loading: boolean;
  error: string | null;
  overview: RPCFunctionReturns<'get_clinic_overview'>[0] | null;
  statusBreakdown: RPCFunctionReturns<'get_clinic_status_breakdown'> | null;
  qualityBreakdown: RPCFunctionReturns<'get_clinic_quality_breakdown'> | null;
  weeklyQuality: RPCFunctionReturns<'get_clinic_weekly_quality'>;
  monthlyQuality: RPCFunctionReturns<'get_clinic_monthly_quality'>;
  weeklyStudies: RPCFunctionReturns<'get_clinic_weekly_studies'>;
  monthlyStudies: RPCFunctionReturns<'get_clinic_monthly_studies'>;
  weeklyActiveStudies: RPCFunctionReturns<'get_weekly_active_studies'>;
  weeklyAvgQuality: RPCFunctionReturns<'get_weekly_avg_quality'>;
  clinicBreakdown: RPCFunctionReturns<'get_per_clinic_breakdown'>;
  newStudiesLast3mo: number;
  growthPercent: number;
}

// Hook: useClinicAnalytics
// Allows an optional clinicId argument. If omitted => fetch data for all clinics.
export function useClinicAnalytics(clinicId?: string): ClinicAnalyticsResult {
  const { callRPC } = useRPC();
  const [result, setResult] = useState<ClinicAnalyticsResult>({
    loading: true,
    error: null,
    overview: null,
    statusBreakdown: null,
    qualityBreakdown: null,
    weeklyQuality: [],
    monthlyQuality: [],
    weeklyStudies: [],
    monthlyStudies: [],
    weeklyActiveStudies: [],
    weeklyAvgQuality: [],
    clinicBreakdown: [],
    newStudiesLast3mo: 0,
    growthPercent: 0
  });

  useEffect(() => {
    let mounted = true;

    async function fetchAllClinicData() {
      try {
        const [
          overviewData,
          statusData,
          qualityData,
          weeklyQualityData,
          monthlyQualityData,
          weeklyStudiesData,
          monthlyStudiesData,
          weeklyActiveData,
          weeklyQualityData2,
          clinicBreakdownData,
          growthData
        ] = await Promise.all([
          // If clinicId is provided, fetch specific clinic data, otherwise fetch all clinics
          callRPC('get_clinic_overview', clinicId ? { _clinic_id: clinicId } : undefined),
          callRPC('get_clinic_status_breakdown', clinicId ? { _clinic_id: clinicId } : undefined),
          callRPC('get_clinic_quality_breakdown', clinicId ? { _clinic_id: clinicId } : undefined),
          callRPC('get_clinic_weekly_quality', clinicId ? { _clinic_id: clinicId } : undefined),
          callRPC('get_clinic_monthly_quality', clinicId ? { _clinic_id: clinicId } : undefined),
          callRPC('get_clinic_weekly_studies', clinicId ? { _clinic_id: clinicId } : undefined),
          callRPC('get_clinic_monthly_studies', clinicId ? { _clinic_id: clinicId } : undefined),
          callRPC('get_weekly_active_studies', undefined),
          callRPC('get_weekly_avg_quality', undefined),
          callRPC('get_per_clinic_breakdown', undefined),
          callRPC('get_new_studies_and_growth', undefined)
        ]);

        if (!mounted) return;

        const overview = overviewData?.[0] ? {
          active_studies: overviewData[0].active_studies,
          total_studies: overviewData[0].total_studies,
          average_quality_hours: overviewData[0].average_quality_hours,
          recent_alerts: overviewData[0].recent_alerts
        } : null;

        setResult({
          loading: false,
          error: null,
          overview,
          statusBreakdown: statusData || null,
          qualityBreakdown: qualityData || null,
          weeklyQuality: weeklyQualityData || [],
          monthlyQuality: monthlyQualityData || [],
          weeklyStudies: weeklyStudiesData || [],
          monthlyStudies: monthlyStudiesData || [],
          weeklyActiveStudies: weeklyActiveData || [],
          weeklyAvgQuality: weeklyQualityData2 || [],
          clinicBreakdown: clinicBreakdownData || [],
          newStudiesLast3mo: growthData?.[0]?.new_studies || 0,
          growthPercent: growthData?.[0]?.growth_percent || 0
        });
      } catch (error: unknown) {
        if (!mounted) return;
        const errorContext = error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : { error: String(error) };
        logger.error('Error in useClinicAnalytics:', errorContext);
        setResult(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : String(error)
        }));
      }
    }

    setResult(prev => ({ ...prev, loading: true }));
    fetchAllClinicData();

    return () => {
      mounted = false;
    };
  }, [clinicId, callRPC]);

  return result;
} 