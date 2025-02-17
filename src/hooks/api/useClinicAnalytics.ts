/**
 * src/hooks/useClinicAnalytics.ts
 *
 * Provides a single, streamlined approach to fetching various clinic-level stats from Supabase
 * via RPC functions
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger'
import type { Database } from '../types/database.types'
import type {
  ClinicAnalyticsResult,
  ClinicOverview,
  ClinicStatusBreakdown,
  ClinicQualityBreakdown,
  WeeklyMonthlyQuality,
  WeeklyMonthlyStudies,
  WeeklyHistogramPoint,
  ClinicStatsRow
} from '../types/domain/clinic'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [overview, setOverview] = useState<ClinicOverview | null>(null)
  const [statusBreakdown, setStatusBreakdown] = useState<ClinicStatusBreakdown[] | null>(null)
  const [qualityBreakdown, setQualityBreakdown] = useState<ClinicQualityBreakdown[] | null>(null)
  const [weeklyQuality, setWeeklyQuality] = useState<WeeklyMonthlyQuality[]>([])
  const [monthlyQuality, setMonthlyQuality] = useState<WeeklyMonthlyQuality[]>([])
  const [weeklyStudies, setWeeklyStudies] = useState<WeeklyMonthlyStudies[]>([])
  const [monthlyStudies, setMonthlyStudies] = useState<WeeklyMonthlyStudies[]>([])
  const [weeklyActiveStudies, setWeeklyActiveStudies] = useState<WeeklyHistogramPoint[]>([])
  const [weeklyAvgQuality, setWeeklyAvgQuality] = useState<WeeklyHistogramPoint[]>([])
  const [clinicBreakdown, setClinicBreakdown] = useState<ClinicStatsRow[]>([])
  const [newStudiesLast3mo, setNewStudiesLast3mo] = useState<number>(0)
  const [growthPercent, setGrowthPercent] = useState<number>(0)

  useEffect(() => {
    let canceled = false
    setLoading(true)
    setError(null)

    async function fetchData() {
      try {
        logger.info('useClinicAnalytics: fetching stats', { clinicId })

        // 1) get_clinic_overview
        const { data: ovData, error: ovErr } = await supabase.rpc('get_clinic_overview', {
          _clinic_id: clinicId as string
        })
        if (ovErr) throw ovErr
        if (Array.isArray(ovData) && ovData.length > 0) {
          const row = ovData[0] as ClinicOverviewRow
          setOverview({
            active_studies: row.active_studies,
            total_studies: row.total_studies,
            average_quality_hours: row.average_quality_hours,
            recent_alerts: row.recent_alerts ? JSON.parse(row.recent_alerts as string) : null
          })
        } else {
          setOverview(null)
        }

        // 2) get_clinic_status_breakdown
        const { data: stData, error: stErr } = await supabase.rpc('get_clinic_status_breakdown', {
          _clinic_id: clinicId
        })
        if (stErr) throw stErr
        setStatusBreakdown(Array.isArray(stData) ? stData.map((row: ClinicStatusRow) => ({
          clinic_id: row.clinic_id,
          clinic_name: row.clinic_name,
          total_studies: row.total_studies,
          open_studies: row.open_studies,
          intervene_count: row.intervene_count,
          monitor_count: row.monitor_count,
          on_target_count: row.on_target_count,
          near_completion_count: row.near_completion_count,
          needs_extension_count: row.needs_extension_count
        })) : null)

        // 3) get_clinic_quality_breakdown
        const { data: qbData, error: qbErr } = await supabase.rpc('get_clinic_quality_breakdown', {
          _clinic_id: clinicId
        })
        if (qbErr) throw qbErr
        setQualityBreakdown(Array.isArray(qbData) ? qbData.map((row: ClinicQualityRow) => ({
          clinic_id: row.clinic_id,
          clinic_name: row.clinic_name,
          total_studies: row.total_studies,
          open_studies: row.open_studies,
          average_quality: row.average_quality,
          good_count: row.good_count,
          soso_count: row.soso_count,
          bad_count: row.bad_count,
          critical_count: row.critical_count
        })) : null)

        // 4) get_clinic_weekly_quality
        const { data: wqData, error: wqErr } = await supabase.rpc('get_clinic_weekly_quality', {
          _clinic_id: clinicId as string
        })
        if (wqErr) throw wqErr
        if (Array.isArray(wqData)) {
          setWeeklyQuality(wqData.map((row: WeeklyQualityRow) => ({
            week_start: row.week_start,
            average_quality: row.average_quality
          })))
        }

        // 5) get_clinic_monthly_quality
        const { data: mqData, error: mqErr } = await supabase.rpc('get_clinic_monthly_quality', {
          _clinic_id: clinicId as string
        })
        if (mqErr) throw mqErr
        if (Array.isArray(mqData)) {
          setMonthlyQuality(mqData.map((row: MonthlyQualityRow) => ({
            month_start: row.month_start,
            average_quality: row.average_quality
          })))
        }

        // 6) get_clinic_weekly_studies
        const { data: wsData, error: wsErr } = await supabase.rpc('get_clinic_weekly_studies', {
          _clinic_id: clinicId as string
        })
        if (wsErr) throw wsErr
        if (Array.isArray(wsData)) {
          setWeeklyStudies(wsData.map((row: WeeklyStudiesRow) => ({
            week_start: row.week_start,
            open_studies: row.open_studies
          })))
        }

        // 7) get_clinic_monthly_studies
        const { data: msData, error: msErr } = await supabase.rpc('get_clinic_monthly_studies', {
          _clinic_id: clinicId as string
        })
        if (msErr) throw msErr
        if (Array.isArray(msData)) {
          setMonthlyStudies(msData.map((row: MonthlyStudiesRow) => ({
            month_start: row.month_start,
            open_studies: row.open_studies
          })))
        }

        // Calls from useClinicLabStats
        const { data: wActiveData, error: wErr } = await supabase.rpc('get_weekly_active_studies')
        if (wErr) throw wErr
        const { data: wQualityData, error: wQErr } = await supabase.rpc('get_weekly_avg_quality')
        if (wQErr) throw wQErr
        const { data: cBreakdown, error: cbErr } = await supabase.rpc('get_per_clinic_breakdown')
        if (cbErr) throw cbErr
        const { data: growthData, error: gErr } = await supabase.rpc('get_new_studies_and_growth')
        if (gErr) throw gErr

        if (!canceled) {
          setWeeklyActiveStudies(Array.isArray(wActiveData) ? wActiveData.map((row: WeeklyActiveStudiesRow) => ({
            weekStart: row.week_start || '',
            activeStudyCount: row.active_study_count || 0,
            averageQuality: 0
          })) : [])

          setWeeklyAvgQuality(Array.isArray(wQualityData) ? wQualityData.map((row: WeeklyAvgQualityRow) => ({
            weekStart: row.week_start || '',
            activeStudyCount: 0,
            averageQuality: row.average_quality || 0
          })) : [])

          setClinicBreakdown(Array.isArray(cBreakdown) ? cBreakdown.map((row: ClinicBreakdownRow) => ({
            clinic_id: row.clinic_id || '',
            clinic_name: row.clinic_name || 'N/A',
            totalActiveStudies: row.total_active_studies || 0,
            interveneCount: row.intervene_count || 0,
            monitorCount: row.monitor_count || 0,
            onTargetCount: row.on_target_count || 0,
            averageQuality: row.average_quality || 0
          })) : [])

          if (Array.isArray(growthData) && growthData.length > 0) {
            const row = growthData[0] as GrowthDataRow
            setNewStudiesLast3mo(row.new_studies)
            setGrowthPercent(row.growth_percent)
          }
        }

      } catch (err: any) {
        logger.error('useClinicAnalytics error', err)
        if (!canceled) setError(err.message || 'Failed to fetch clinic analytics')
      } finally {
        if (!canceled) setLoading(false)
      }
    }

    fetchData()
    return () => { canceled = true }
  }, [clinicId])

  return {
    loading,
    error,
    overview,
    statusBreakdown,
    qualityBreakdown,
    weeklyQuality,
    monthlyQuality,
    weeklyStudies,
    monthlyStudies,
    weeklyActiveStudies,
    weeklyAvgQuality,
    clinicBreakdown,
    newStudiesLast3mo,
    growthPercent
  }
}
