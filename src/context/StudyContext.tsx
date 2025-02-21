/**
 * StudyContext.tsx
 * Provides context about a single study, including pod_id, earliestTime, latestTime, and availableDays.
 * Uses the RPC get_study_details_with_earliest_latest and get_pod_days.
 */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'

interface StudyContextType {
    studyId: string | null
    podId: string | null
    earliestTime: string | null
    latestTime: string | null
    availableDays: Date[]
    loading: boolean
    error: string | null
}

interface StudyProviderProps {
    studyId: string
    children: ReactNode
}

const StudyContext = createContext<StudyContextType>({
    studyId: null,
    podId: null,
    earliestTime: null,
    latestTime: null,
    availableDays: [],
    loading: true,
    error: null
})

export const useStudyContext = () => useContext(StudyContext)

export function StudyProvider({ studyId, children }: StudyProviderProps) {
    const [podId, setPodId] = useState<string | null>(null)
    const [earliestTime, setEarliestTime] = useState<string | null>(null)
    const [latestTime, setLatestTime] = useState<string | null>(null)
    const [availableDays, setAvailableDays] = useState<Date[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let canceled = false

        const fetchStudy = async () => {
            setLoading(true)
            setError(null)
            try {
                logger.info('StudyContext: get_study_details_with_earliest_latest', { studyId })

                // 1) fetch basic study details
                const { data: detailData, error: detailError } = await supabase
                    .rpc('get_study_details_with_earliest_latest', { p_study_id: studyId })

                if (detailError) throw detailError
                if (!detailData || !detailData.length) {
                    throw new Error(`Study ${studyId} not found.`)
                }
                const s = detailData[0]

                if (!canceled) {
                    setPodId(s.pod_id)
                    setEarliestTime(s.earliest_time || null)
                    setLatestTime(s.latest_time || null)
                }

                // 2) get possible available days
                if (s.pod_id) {
                    logger.info('StudyContext: get_pod_days', { pod_id: s.pod_id })
                    const { data: daysData, error: daysErr } = await supabase
                        .rpc('get_pod_days', { p_pod_id: s.pod_id })

                    if (daysErr) throw daysErr
                    if (Array.isArray(daysData)) {
                        const mappedDays = daysData
                            .map((d: { day_value: string }) => new Date(`${d.day_value}T00:00:00Z`))
                            .sort((a, b) => a.getTime() - b.getTime())

                        if (!canceled) {
                            setAvailableDays(mappedDays)
                        }
                    }
                }
            } catch (err: any) {
                if (!canceled) setError(err.message)
            } finally {
                if (!canceled) setLoading(false)
            }
        }

        fetchStudy()

        return () => {
            canceled = true
        }
    }, [studyId])

    return (
        <StudyContext.Provider
            value={{
                studyId,
                podId,
                earliestTime,
                latestTime,
                availableDays,
                loading,
                error
            }}
        >
            {children}
        </StudyContext.Provider>
    )
}
