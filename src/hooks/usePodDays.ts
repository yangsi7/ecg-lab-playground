/* ===========================================
   src/hooks/usePodDays.ts
   (Ensures we have a function returning all valid days)
   =========================================== */
   import { useState, useEffect } from 'react'
   import { supabase } from '../lib/supabase'
   import { logger } from '../lib/logger'
   
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
                   if (rpcError) throw new Error(rpcError.message)
                   if (!Array.isArray(data)) {
                       throw new Error('Invalid data from get_pod_days')
                   }
                   if (!canceled) {
                       const validDays = data
                           .map((d: { day_value: string }) => new Date(`${d.day_value}T00:00:00Z`))
                           .sort((a, b) => a.getTime() - b.getTime())
                       setDays(validDays)
                   }
               } catch (err: any) {
                   if (!canceled) {
                       logger.error('usePodDays error', err)
                       setError(err.message || 'Failed to fetch pod days')
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
