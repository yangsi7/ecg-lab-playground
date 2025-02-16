import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { logger } from '../../lib/logger'

interface AggregatedLeadData {
  time_bucket: string
  lead_on_p_1?: number
  lead_on_n_1?: number
  lead_on_p_2?: number
  lead_on_n_2?: number
  lead_on_p_3?: number
  lead_on_n_3?: number
  quality_1_percent?: number
  quality_2_percent?: number
  quality_3_percent?: number
}

interface DailyECGAggregatorProps {
  podId: string
  date: Date
  onHourSelect: (hour: number) => void
}

/**
 * colorMap => color from 0..100
 */
function colorMap(quality: number) {
  // 0 -> red, 100 -> green
  if (quality < 20) return '#ef4444'
  if (quality < 40) return '#f97316'
  if (quality < 60) return '#f59e0b'
  if (quality < 80) return '#eab308'
  return '#4ade80'
}

/**
 * alphaMap => alpha from lead_on factor (0..1).
 * Minimum alpha=0.3, so alpha = 0.3 + 0.7*(factor).
 */
function alphaFromLeadOn(leadOnFactor: number) {
  const alpha = 0.3 + (0.7 * leadOnFactor)
  return Math.min(1, Math.max(0.3, alpha))
}

export function DailyECGAggregator({ podId, date, onHourSelect }: DailyECGAggregatorProps) {
  const [data, setData] = useState<AggregatedLeadData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let canceled = false

    async function fetchAggregator() {
      setLoading(true)
      setError(null)
      const dayStart = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0,0,0))
      const dayEnd   = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 23,59,59))

      logger.info('Daily aggregator fetch', {podId, dayStart, dayEnd})
      const { data: aggData, error: rpcErr } = await supabase.rpc('aggregate_leads', {
        p_pod_id: podId,
        p_time_start: dayStart.toISOString(),
        p_time_end: dayEnd.toISOString(),
        p_bucket_seconds: 3600
      })

      if (canceled) return
      if (rpcErr) {
        setError(rpcErr.message)
        setData([])
      } else if (!Array.isArray(aggData)) {
        setError('Invalid aggregator data')
        setData([])
      } else {
        setData(aggData)
      }
      setLoading(false)
    }

    fetchAggregator()
    return () => { canceled=true }
  }, [podId, date])

  if (loading) {
    return <div className="text-sm text-gray-400">Loading daily aggregator...</div>
  }
  if (error) {
    return <div className="text-sm text-red-400">{error}</div>
  }

  // Force array of 24 hours
  const hourArray: AggregatedLeadData[] = Array.from({ length: 24 }, () => ({
    time_bucket: '',
    lead_on_p_1: 0, lead_on_n_1: 0,
    lead_on_p_2: 0, lead_on_n_2: 0,
    lead_on_p_3: 0, lead_on_n_3: 0,
    quality_1_percent: 0,
    quality_2_percent: 0,
    quality_3_percent: 0
  }))

  data.forEach(row => {
    const h = new Date(row.time_bucket).getUTCHours()
    hourArray[h] = row
  })

  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-300">
        {date.toDateString()} (3-lead aggregator)
      </div>

      {/* 3 bars => but simpler, we do a single bar with 24 slices for each hour */}
      {/* Or we do 3 rows if you want to separate leads. We'll do single row with color from sum */}
      <div className="flex gap-1 h-6 sm:h-8 overflow-hidden">
        {hourArray.map((hr, idx) => {
          // Sum or average the 3 leads' quality
          const q1 = hr.quality_1_percent ?? 0
          const q2 = hr.quality_2_percent ?? 0
          const q3 = hr.quality_3_percent ?? 0
          const sumQuality = (q1 + q2 + q3) / 3  // average 0..100

          // Sum lead_on factors => do the average for lead_on
          const p1 = (hr.lead_on_p_1 ?? 0)
          const n1 = (hr.lead_on_n_1 ?? 0)
          const p2 = (hr.lead_on_p_2 ?? 0)
          const n2 = (hr.lead_on_n_2 ?? 0)
          const p3 = (hr.lead_on_p_3 ?? 0)
          const n3 = (hr.lead_on_n_3 ?? 0)

          // let's do average leadOn fraction across the 3 leads
          // each lead => average of p + n => so for lead1 => (p1 + n1)/2
          // then sum them & /3
          const leadOn1 = (p1 + n1)/2
          const leadOn2 = (p2 + n2)/2
          const leadOn3 = (p3 + n3)/2
          const avgLeadOn = (leadOn1 + leadOn2 + leadOn3)/3

          const color = colorMap(sumQuality)
          const alpha = alphaFromLeadOn(avgLeadOn)
          const isEmpty = hr.time_bucket === ''

          const finalOpacity = isEmpty ? 0.2 : alpha

          return (
            <div
              key={idx}
              className="flex-1 transition-transform hover:scale-y-110 cursor-pointer"
              style={{ backgroundColor: color, opacity: finalOpacity }}
              title={`Hour ${idx}: ~${sumQuality.toFixed(1)}% Q, leadOn ~${(avgLeadOn*100).toFixed(1)}%`}
              onClick={() => onHourSelect(idx)}
            />
          )
        })}
      </div>
    </div>
  )
}
