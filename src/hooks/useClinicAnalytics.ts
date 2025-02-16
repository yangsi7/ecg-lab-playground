/**
 * src/hooks/useClinicAnalytics.ts
 *
 * Provides a single, streamlined approach to fetching various clinic-level stats from Supabase
 * via the following RPC calls:
 *   - get_clinic_overview
 *   - get_clinic_status_breakdown
 *   - get_clinic_quality_breakdown
 *   - get_clinic_weekly_quality
 *   - get_clinic_monthly_quality
 *   - get_clinic_weekly_studies
 *   - get_clinic_monthly_studies
 *   - get_weekly_active_studies  (from useClinicLabStats)
 *   - get_weekly_avg_quality    (from useClinicLabStats)
 *   - get_per_clinic_breakdown   (from useClinicLabStats)
 *   - get_new_studies_and_growth (from useClinicLabStats)
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger'

// Overview shape
type ClinicOverview = {
  active_studies: number
  total_studies: number
  average_quality_hours: number
  recent_alerts: Array<{
    alert_id: string
    message: string
  }>
}

// "Status breakdown" shape
type ClinicStatusRow = {
  clinic_id: string | null
  clinic_name: string | null
  total_studies: number
  open_studies: number
  intervene_count: number
  monitor_count: number
  on_target_count: number
  to_completion_count: number
  needs_extension_count: number
}

// "Quality breakdown" shape
type ClinicQualityRow = {
  clinic_id: string | null
  clinic_name: string | null
  total_studies: number
  open_studies: number
  avg_quality_fraction: number
  good_count: number
  soso_count: number
  bad_count: number
  critical_count: number
}

// Weekly/Monthly timeseries shapes
type WeeklyMonthlyQuality = {
  week_start?: string
  month_start?: string
  average_quality: number
}

type WeeklyMonthlyStudies = {
  week_start?: string
  month_start?: string
  open_studies: number
}

// --- Shapes from useClinicLabStats ---
export interface WeeklyHistogramPoint {
  weekStart: string
  activeStudyCount: number
  averageQuality: number
}

export interface ClinicStatsRow {
  clinic_id: string
  clinic_name: string
  totalActiveStudies: number
  interveneCount: number
  monitorCount: number
  onTargetCount: number
  averageQuality: number
}
// --- End shapes from useClinicLabStats ---

// The final shape returned by our hook
export interface ClinicAnalyticsResult {
  loading: boolean
  error: string | null
  overview: ClinicOverview | null
  statusBreakdown: ClinicStatusRow[] | null
  qualityBreakdown: ClinicQualityRow[] | null
  weeklyQuality: WeeklyMonthlyQuality[]
  monthlyQuality: WeeklyMonthlyQuality[]
  weeklyStudies: WeeklyMonthlyStudies[]
  monthlyStudies: WeeklyMonthlyStudies[]
  // --- From useClinicLabStats ---
  weeklyActiveStudies: WeeklyHistogramPoint[]
  weeklyAvgQuality: WeeklyHistogramPoint[]
  clinicBreakdown: ClinicStatsRow[]
  newStudiesLast3mo: number
  growthPercent: number
  // --- End from useClinicLabStats ---
}

// Hook: useClinicAnalytics
// Allows an optional clinicId argument. If omitted => fetch data for all clinics.
export function useClinicAnalytics(clinicId?: string): ClinicAnalyticsResult {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [overview, setOverview] = useState<ClinicOverview | null>(null)
  const [statusBreakdown, setStatusBreakdown] = useState<ClinicStatusRow[] | null>(null)
  const [qualityBreakdown, setQualityBreakdown] = useState<ClinicQualityRow[] | null>(null)
  const [weeklyQuality, setWeeklyQuality] = useState<WeeklyMonthlyQuality[]>([])
  const [monthlyQuality, setMonthlyQuality] = useState<WeeklyMonthlyQuality[]>([])
  const [weeklyStudies, setWeeklyStudies] = useState<WeeklyMonthlyStudies[]>([])
  const [monthlyStudies, setMonthlyStudies] = useState<WeeklyMonthlyStudies[]>([])

  // --- State from useClinicLabStats ---
  const [weeklyActiveStudies, setWeeklyActiveStudies] = useState<WeeklyHistogramPoint[]>([])
  const [weeklyAvgQuality, setWeeklyAvgQuality] = useState<WeeklyHistogramPoint[]>([])
  const [clinicBreakdown, setClinicBreakdown] = useState<ClinicStatsRow[]>([])
  const [newStudiesLast3mo, setNewStudiesLast3mo] = useState<number>(0)
  const [growthPercent, setGrowthPercent] = useState<number>(0)
  // --- End state from useClinicLabStats ---

  useEffect(() => {
    let canceled = false
    setLoading(true)
    setError(null)

    async function fetchData() {
      try {
        logger.info('useClinicAnalytics: fetching stats', { clinicId })

        // 1) get_clinic_overview
        const { data: ovData, error: ovErr } = await supabase.rpc('get_clinic_overview', {
          _clinic_id: clinicId || null
        })
        if (ovErr) throw ovErr
        if (Array.isArray(ovData) && ovData.length > 0) {
          setOverview(ovData[0])
        } else {
          setOverview(null)
        }

        // 2) get_clinic_status_breakdown
        const { data: stData, error: stErr } = await supabase.rpc('get_clinic_status_breakdown', {
          _clinic_id: clinicId || null
        })
        if (stErr) throw stErr
        setStatusBreakdown(Array.isArray(stData) ? stData : null)

        // 3) get_clinic_quality_breakdown
        const { data: qbData, error: qbErr } = await supabase.rpc('get_clinic_quality_breakdown', {
          _clinic_id: clinicId || null
        })
        if (qbErr) throw qbErr
        setQualityBreakdown(Array.isArray(qbData) ? qbData : null)

        // 4) get_clinic_weekly_quality
        const { data: wqData, error: wqErr } = await supabase.rpc('get_clinic_weekly_quality', {
          _clinic_id: clinicId || null
        })
        if (wqErr) throw wqErr
        if (Array.isArray(wqData)) {
          setWeeklyQuality(
            wqData.map((x: any) => ({
              week_start: x.week_start,
              average_quality: x.average_quality
            }))
          )
        }

        // 5) get_clinic_monthly_quality
        const { data: mqData, error: mqErr } = await supabase.rpc('get_clinic_monthly_quality', {
          _clinic_id: clinicId || null
        })
        if (mqErr) throw mqErr
        if (Array.isArray(mqData)) {
          setMonthlyQuality(
            mqData.map((x: any) => ({
              month_start: x.month_start,
              average_quality: x.average_quality
            }))
          )
        }

        // 6) get_clinic_weekly_studies
        const { data: wsData, error: wsErr } = await supabase.rpc('get_clinic_weekly_studies', {
          _clinic_id: clinicId || null
        })
        if (wsErr) throw wsErr
        if (Array.isArray(wsData)) {
          setWeeklyStudies(
            wsData.map((x: any) => ({
              week_start: x.week_start,
              open_studies: x.open_studies
            }))
          )
        }

        // 7) get_clinic_monthly_studies
        const { data: msData, error: msErr } = await supabase.rpc('get_clinic_monthly_studies', {
          _clinic_id: clinicId || null
        })
        if (msErr) throw msErr
        if (Array.isArray(msData)) {
          setMonthlyStudies(
            msData.map((x: any) => ({
              month_start: x.month_start,
              open_studies: x.open_studies
            }))
          )
        }

        // --- Calls from useClinicLabStats ---
        const { data: wActiveData, error: wErr } = await supabase.rpc('get_weekly_active_studies')
        if (wErr) throw wErr
        const { data: wQualityData, error: wQErr } = await supabase.rpc('get_weekly_avg_quality')
        if (wQErr) throw wQErr
        const { data: cBreakdown, error: cbErr } = await supabase.rpc('get_per_clinic_breakdown')
        if (cbErr) throw cbErr
        const { data: growthData, error: gErr } = await supabase.rpc('get_new_studies_and_growth')
        if (gErr) throw gErr
        // --- End calls from useClinicLabStats ---

        if (!canceled) {
          // --- Set state from useClinicLabStats ---
          setWeeklyActiveStudies(Array.isArray(wActiveData) ? wActiveData.map((d: any) => ({
            weekStart: d.week_start || '',
            activeStudyCount: d.active_study_count || 0,
            averageQuality: 0
          })) : [])

          setWeeklyAvgQuality(Array.isArray(wQualityData) ? wQualityData.map((d: any) => ({
            weekStart: d.week_start || '',
            activeStudyCount: 0,
            averageQuality: d.average_quality || 0
          })) : [])

          setClinicBreakdown(Array.isArray(cBreakdown) ? cBreakdown.map((d: any) => ({
            clinic_id: d.clinic_id || '',
            clinic_name: d.clinic_name || 'N/A',
            totalActiveStudies: d.total_active_studies || 0,
            interveneCount: d.intervene_count || 0,
            monitorCount: d.monitor_count || 0,
            onTargetCount: d.on_target_count || 0,
            averageQuality: d.average_quality || 0
          })) : [])

          setNewStudiesLast3mo(growthData?.newStudies ?? 0)
          setGrowthPercent(growthData?.growthPercent ?? 0)
          // --- End set state from useClinicLabStats ---
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
    // --- Return values from useClinicLabStats ---
    weeklyActiveStudies,
    weeklyAvgQuality,
    clinicBreakdown,
    newStudiesLast3mo,
    growthPercent
    // --- End return values from useClinicLabStats ---
  }
}
