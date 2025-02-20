/**
 * src/hooks/useClinicAnalytics.ts
 *
 * Provides a single, streamlined approach to fetching various clinic-level stats from Supabase
 * via RPC functions
 */

import { useState, useEffect } from 'react'
import { logger } from '../../lib/logger'
import { callRPC } from './core/utils'
import type { Database } from '../../types/database.types'
import type {
  ClinicAnalyticsResult,
  ClinicOverview,
  ClinicStatusBreakdown,
  ClinicQualityBreakdown,
  WeeklyMonthlyQuality,
  WeeklyMonthlyStudies,
  WeeklyHistogramPoint,
  ClinicStatsRow
} from '../../types/domain/clinic'

// Database function return types
type ClinicOverviewRow = Database['public']['Functions']['get_clinic_overview']['Returns'][0]
type ClinicStatusRow = Database['public']['Functions']['get_clinic_status_breakdown']['Returns'][0]
type ClinicQualityRow = Database['public']['Functions']['get_clinic_quality_breakdown']['Returns'][0]
type WeeklyQualityRow = Database['public']['Functions']['get_clinic_weekly_quality']['Returns'][0]
type MonthlyQualityRow = Database['public']['Functions']['get_clinic_monthly_quality']['Returns'][0]
type WeeklyStudiesRow = Database['public']['Functions']['get_clinic_weekly_studies']['Returns'][0]
type MonthlyStudiesRow = Database['public']['Functions']['get_clinic_monthly_studies']['Returns'][0]
type WeeklyActiveStudiesRow = Database['public']['Functions']['get_weekly_active_studies']['Returns'][0]

type ClinicBreakdownRow = Database['public']['Functions']['get_per_clinic_breakdown']['Returns'][0]
type GrowthDataRow = Database['public']['Functions']['get_new_studies_and_growth']['Returns'][0]

// Hook: useClinicAnalytics
// Allows an optional clinicId argument. If omitted => fetch data for all clinics.
export function useClinicAnalytics(clinicId?: string): ClinicAnalyticsResult {
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
  })

  useEffect(() => {
    let mounted = true

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
          callRPC('get_clinic_overview', { _clinic_id: clinicId || null }),
          callRPC('get_clinic_status_breakdown', { _clinic_id: clinicId || null }),
          callRPC('get_clinic_quality_breakdown', { _clinic_id: clinicId || null }),
          callRPC('get_clinic_weekly_quality', { _clinic_id: clinicId || null }),
          callRPC('get_clinic_monthly_quality', { _clinic_id: clinicId || null }),
          callRPC('get_clinic_weekly_studies', { _clinic_id: clinicId || null }),
          callRPC('get_clinic_monthly_studies', { _clinic_id: clinicId || null }),
          callRPC('get_weekly_active_studies', {}),
          callRPC('get_weekly_avg_quality', {}),
          callRPC('get_per_clinic_breakdown', {}),
          callRPC('get_new_studies_and_growth', {})
        ])

        if (!mounted) return

        const overview = overviewData?.[0] ? {
          active_studies: overviewData[0].active_studies,
          total_studies: overviewData[0].total_studies,
          average_quality_hours: overviewData[0].average_quality_hours,
          recent_alerts: overviewData[0].recent_alerts ? 
            JSON.parse(overviewData[0].recent_alerts as string) : null
        } as ClinicOverview : null;

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
          weeklyActiveStudies: weeklyActiveData
            ? weeklyActiveData.map(row => ({
              weekStart: row.week_start || '',
              activeStudyCount: row.active_study_count || 0,
              averageQuality: 0
            }))
            : [],
          weeklyAvgQuality: weeklyQualityData2
            ? weeklyQualityData2.map(row => ({
              weekStart: row.week_start || '',
              activeStudyCount: 0,
              averageQuality: row.average_quality || 0
            }))
            : [],
          clinicBreakdown: clinicBreakdownData
            ? clinicBreakdownData.map(row => ({
              clinic_id: row.clinic_id || '',
              clinic_name: row.clinic_name || 'N/A',
              totalActiveStudies: row.total_active_studies || 0,
              interveneCount: row.intervene_count || 0,
              monitorCount: row.monitor_count || 0,
              onTargetCount: row.on_target_count || 0,
              averageQuality: row.average_quality || 0
            }))
            : [],
          newStudiesLast3mo: growthData?.[0]?.new_studies || 0,
          growthPercent: growthData?.[0]?.growth_percent || 0
        })
      } catch (error) {
        if (!mounted) return
        logger.error('Error in useClinicAnalytics:', error)
        setResult(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch clinic data'
        }))
      }
    }

    setResult(prev => ({ ...prev, loading: true }))
    fetchAllClinicData()

    return () => {
      mounted = false
    }
  }, [clinicId])

  return result
}
