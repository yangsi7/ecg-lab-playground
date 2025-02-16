// src/hooks/useSingleStudy.ts
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface SingleStudyRow {
    study_id: string;
    pod_id: string | null;
    clinic_id: string | null;
    start_timestamp: string | null;
    end_timestamp: string | null;
    earliest_time: string | null;
    latest_time: string | null;
}

export function useSingleStudy(studyId?: string) {
    const [study, setStudy] = useState<SingleStudyRow | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let canceled = false;
        if (!studyId) {
            setLoading(false);
            return;
        }
        async function fetchStudy() {
            setLoading(true);
            setError(null);
            try {
                const { data, error: rpcErr } = await supabase
                    .rpc('get_study_details_with_earliest_latest', { p_study_id: studyId });
                if (rpcErr) throw new Error(rpcErr.message);

                if (!data || data.length === 0) {
                    setStudy(null);
                } else {
                    setStudy(data[0]);
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load study');
            } finally {
                if (!canceled) setLoading(false);
            }
        }
        fetchStudy();
        return () => {
            canceled = true;
        };
    }, [studyId]);

    return { study, loading, error };
}
