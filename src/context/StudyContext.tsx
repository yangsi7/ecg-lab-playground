/**
 * StudyContext.tsx
 * Provides context about a single study, including pod_id, earliestTime, latestTime, and availableDays.
 * Uses the RPC get_study_details_with_earliest_latest and get_pod_days.
 */
import { createContext, useContext, useMemo } from 'react'
import { useSingleStudy } from '@/hooks/api/study/useSingleStudy'
import { usePodDays } from '@/hooks/api/study/usePodDays'
import type { ReactNode } from 'react'

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
    const { data: studyDetails, isLoading: studyLoading, error: studyError } = useSingleStudy(studyId)
    const { data: days = [], isLoading: daysLoading, error: daysError } = usePodDays(studyDetails?.pod_id || null)

    const contextValue = useMemo(() => ({
        studyId,
        podId: studyDetails?.pod_id || null,
        earliestTime: studyDetails?.earliest_time || null,
        latestTime: studyDetails?.latest_time || null,
        availableDays: days,
        loading: studyLoading || daysLoading,
        error: studyError?.message || daysError?.message || null,
    }), [studyId, studyDetails, days, studyLoading, daysLoading, studyError, daysError])

    return (
        <StudyContext.Provider value={contextValue}>
            {children}
        </StudyContext.Provider>
    )
}
