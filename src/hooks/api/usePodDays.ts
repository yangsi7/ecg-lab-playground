/* ===========================================
   src/hooks/usePodDays.ts
   (Ensures we have a function returning all valid days)
   =========================================== */
   import { useQuery } from '@tanstack/react-query'
   import { supabase } from '@/hooks/api/supabase'
   import type { Database } from '../../types/database.types'
   
   type PodDay = Database['public']['Functions']['get_pod_days']['Returns'][0]
   
   export function usePodDays(podId: string) {
       return useQuery({
           queryKey: ['pod-days', podId],
           queryFn: async () => {
               const { data, error } = await supabase
                   .rpc('get_pod_days', {
                       p_pod_id: podId
                   })
   
               if (error) throw error
               return data as PodDay[]
           },
           enabled: !!podId
       })
   }
