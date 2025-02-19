/**
 * src/hooks/useClinicAnalytics.ts
 *
 * Provides a single, streamlined approach to fetching various clinic-level stats from Supabase
 * via RPC functions
 */

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { logger } from '../../lib/logger'
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
type WeeklyAvgQualityRow = Database['public']['Functions']['get_weekly_avg_quality']['Returns'][0]
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
        // For functions that require clinicId
        if (!clinicId) {
          setResult(prev => ({
            ...prev,
            loading: false,
            error: null
          }))
          return
        }

        const [
          overviewRes,
          statusRes,
          qualityRes,
          weeklyQualityRes,
          monthlyQualityRes,
          weeklyStudiesRes,
          monthlyStudiesRes,
          weeklyActiveRes,
          weeklyQualityRes2,
          clinicBreakdownRes,
          growthRes
        ] = await Promise.all([
          supabase.rpc('get_clinic_overview', { _clinic_id: clinicId }),
          supabase.rpc('get_clinic_status_breakdown', { _clinic_id: clinicId }),
          supabase.rpc('get_clinic_quality_breakdown', { _clinic_id: clinicId }),
          supabase.rpc('get_clinic_weekly_quality', { _clinic_id: clinicId }),
          supabase.rpc('get_clinic_monthly_quality', { _clinic_id: clinicId }),
          supabase.rpc('get_clinic_weekly_studies', { _clinic_id: clinicId }),
          supabase.rpc('get_clinic_monthly_studies', { _clinic_id: clinicId }),
          supabase.rpc('get_weekly_active_studies', {}),
          supabase.rpc('get_weekly_avg_quality', {}),
          supabase.rpc('get_per_clinic_breakdown', {}),
          supabase.rpc('get_new_studies_and_growth', {})
        ])

        if (!mounted) return

        const growthData = Array.isArray(growthRes) && growthRes.length > 0 ? growthRes[0] : null;

        setResult({
          loading: false,
          error: null,
          overview: Array.isArray(overviewRes) && overviewRes.length > 0 ? overviewRes[0] : null,
          statusBreakdown: Array.isArray(statusRes) ? statusRes : null,
          qualityBreakdown: Array.isArray(qualityRes) ? qualityRes : null,
          weeklyQuality: Array.isArray(weeklyQualityRes) ? weeklyQualityRes : [],
          monthlyQuality: Array.isArray(monthlyQualityRes) ? monthlyQualityRes : [],
          weeklyStudies: Array.isArray(weeklyStudiesRes) ? weeklyStudiesRes : [],
          monthlyStudies: Array.isArray(monthlyStudiesRes) ? monthlyStudiesRes : [],
          weeklyActiveStudies: Array.isArray(weeklyActiveRes) 
            ? weeklyActiveRes.map(row => ({
              weekStart: row.week_start || '',
              activeStudyCount: row.active_study_count || 0,
              averageQuality: 0
            }))
            : [],
          weeklyAvgQuality: Array.isArray(weeklyQualityRes2)
            ? weeklyQualityRes2.map(row => ({
              weekStart: row.week_start || '',
              activeStudyCount: 0,
              averageQuality: row.average_quality || 0
            }))
            : [],
          clinicBreakdown: Array.isArray(clinicBreakdownRes)
            ? clinicBreakdownRes.map(row => ({
              clinic_id: row.clinic_id || '',
              clinic_name: row.clinic_name || 'N/A',
              totalActiveStudies: row.total_active_studies || 0,
              interveneCount: row.intervene_count || 0,
              monitorCount: row.monitor_count || 0,
              onTargetCount: row.on_target_count || 0,
              averageQuality: row.average_quality || 0
            }))
            : [],
          newStudiesLast3mo: growthData?.new_studies || 0,
          growthPercent: growthData?.growth_percent || 0
        })
      } catch (error) {
        if (!mounted) return
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
