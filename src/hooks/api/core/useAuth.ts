import { useEffect, useState } from 'react';
import { supabase } from '@/hooks/api/core/supabase';
import type { User, AuthError } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<AuthError | null>(null);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (error) {
                logger.error('Failed to get session', { error });
                setError(error);
            } else {
                setUser(session?.user ?? null);
            }
            setIsLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setIsLoading(false);
            setError(null); // Clear any previous errors on successful auth change
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return {
        user,
        isLoading,
        error
    };
} 