import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface ClinicAnalytics {
    totalPatients: number
    activePatients: number
    totalStudies: number
    activeStudies: number
}

export function useClinicAnalytics(clinicId: string) {
    const [data, setData] = useState<ClinicAnalytics | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchAnalytics() {
            try {
                const { data: analytics, error: err } = await supabase
                    .rpc('get_clinic_analytics', { clinic_id: clinicId })

                if (err) throw err
                setData(analytics)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch clinic analytics')
            } finally {
                setLoading(false)
            }
        }

        if (clinicId) {
            fetchAnalytics()
        }
    }, [clinicId])

    return { data, loading, error }
} 