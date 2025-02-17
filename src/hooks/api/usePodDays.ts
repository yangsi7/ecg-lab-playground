/* ===========================================
   src/hooks/usePodDays.ts
   (Ensures we have a function returning all valid days)
   =========================================== */
   import { useState, useEffect } from 'react'
   import { useQuery } from '@tanstack/react-query'
   import { supabase } from '../../lib/supabase'
   import { logger } from '../../lib/logger'
   
   interface PodDayResponse {
       day_value: string
   }
   
   interface PodDaysResult {
       days: Date[]
       loading: boolean
       error: string | null
   }
   
   export function usePodDays(podId: string): PodDaysResult {
       const [days, setDays] = useState<Date[]>([])
       const [loading, setLoading] = useState(true)
       const [error, setError] = useState<string | null>(null)
   
       useEffect(() => {
           if (!podId) {
               setDays([])
               setLoading(false)
               return
           }
           let canceled = false
           ;(async () => {
               setLoading(true)
               setError(null)
               try {
                   const { data, error: rpcError } = await supabase
                       .rpc('get_pod_days', { p_pod_id: podId })
                   if (rpcError) throw rpcError
                   if (!data) {
                       setDays([])
                       return
                   }
                   if (!canceled) {
                       const parsedDays = (data as PodDayResponse[])
                           .map((d: PodDayResponse) => new Date(d.day_value))
                           .sort((a: Date, b: Date) => a.getTime() - b.getTime())
                       setDays(parsedDays)
                   }
               } catch (err: any) {
                   if (!canceled) {
                       logger.error('Failed to fetch pod days', { error: err.message })
                       setError(err.message)
                       setDays([])
                   }
               } finally {
                   if (!canceled) setLoading(false)
               }
           })()
           return () => {
               canceled = true
           }
       }, [podId])
   
       return { days, loading, error }
   }
