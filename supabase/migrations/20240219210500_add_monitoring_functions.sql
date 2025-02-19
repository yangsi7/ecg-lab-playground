-- Enable the pg_stat_statements extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Create edge_function_stats table
CREATE TABLE IF NOT EXISTS public.edge_function_stats (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    function_name text NOT NULL,
    execution_duration interval NOT NULL,
    success boolean NOT NULL DEFAULT true,
    error_message text,
    created_at timestamptz NOT NULL DEFAULT now(),
    request_id text,
    memory_usage bigint,
    cpu_time interval
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_edge_function_stats_function_name ON public.edge_function_stats(function_name);
CREATE INDEX IF NOT EXISTS idx_edge_function_stats_created_at ON public.edge_function_stats(created_at);

-- Create the database stats function
CREATE OR REPLACE FUNCTION public.get_database_stats()
RETURNS TABLE(
    stat_type text,
    rolname text,
    query text,
    calls bigint,
    total_time numeric,
    min_time numeric,
    max_time numeric,
    mean_time numeric,
    avg_rows numeric,
    prop_total_time text,
    hit_rate numeric
) AS $$
BEGIN
    -- Get most time-consuming queries
    RETURN QUERY
    SELECT
        'Most Time Consuming Queries' AS stat_type,
        roles.rolname,
        statements.query,
        statements.calls,
        statements.total_exec_time + statements.total_plan_time AS total_time,
        statements.min_exec_time + statements.min_plan_time AS min_time,
        statements.max_exec_time + statements.max_plan_time AS max_time,
        statements.mean_exec_time + statements.mean_plan_time AS mean_time,
        statements.rows / NULLIF(statements.calls, 0) AS avg_rows,
        NULL AS prop_total_time,
        NULL::numeric AS hit_rate
    FROM
        pg_stat_statements AS statements
    INNER JOIN
        pg_roles AS roles ON statements.userid = roles.oid
    ORDER BY
        total_time DESC
    LIMIT 100;

    -- Get proportion of total execution time for the most time-consuming queries
    RETURN QUERY
    SELECT
        'Cumulative Total Execution Time' AS stat_type,
        roles.rolname,
        statements.query,
        statements.calls,
        statements.total_exec_time + statements.total_plan_time AS total_time,
        NULL AS min_time,
        NULL AS max_time,
        NULL AS mean_time,
        NULL AS avg_rows,
        TO_CHAR(
            (
                (statements.total_exec_time + statements.total_plan_time) / SUM(statements.total_exec_time + statements.total_plan_time) OVER ()
            ) * 100,
            'FM90D0'
        ) || '%' AS prop_total_time,
        NULL::numeric AS hit_rate
    FROM
        pg_stat_statements AS statements
    INNER JOIN
        pg_roles AS roles ON statements.userid = roles.oid
    ORDER BY
        total_time DESC
    LIMIT 100;

    -- Get cache hit rates
    RETURN QUERY
    SELECT
        'Cache Hit Rates' AS stat_type,
        NULL AS rolname,
        NULL AS query,
        NULL AS calls,
        NULL AS total_time,
        NULL AS min_time,
        NULL AS max_time,
        NULL AS mean_time,
        NULL AS avg_rows,
        NULL AS prop_total_time,
        (SUM(idx_blks_hit) / NULLIF(SUM(idx_blks_hit + idx_blks_read), 0)) * 100 AS hit_rate
    FROM
        pg_statio_user_indexes
    UNION ALL
    SELECT
        'Table Hit Rate' AS stat_type,
        NULL AS rolname,
        NULL AS query,
        NULL AS calls,
        NULL AS total_time,
        NULL AS min_time,
        NULL AS max_time,
        NULL AS mean_time,
        NULL AS avg_rows,
        NULL AS prop_total_time,
        (SUM(heap_blks_hit) / NULLIF(SUM(heap_blks_hit) + SUM(heap_blks_read), 0)) * 100 AS hit_rate
    FROM
        pg_statio_user_tables;
END;
$$ LANGUAGE plpgsql;

-- Create the edge function stats function
CREATE OR REPLACE FUNCTION public.get_edge_function_stats(
    p_function_name text,
    p_time_start timestamptz,
    p_time_end timestamptz
)
RETURNS TABLE (
    function_name text,
    total_invocations bigint,
    success_rate numeric,
    average_duration_ms numeric,
    memory_usage bigint,
    cpu_time interval,
    peak_concurrent_executions bigint,
    last_invocation timestamptz
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT
            efs.function_name,
            COUNT(*) AS total_invocations,
            AVG(EXTRACT(EPOCH FROM execution_duration) * 1000) AS average_duration_ms,
            COUNT(*) FILTER (WHERE success) / COUNT(*)::numeric AS success_rate,
            MAX(memory_usage) AS memory_usage,
            MAX(cpu_time) AS cpu_time,
            COUNT(*) FILTER (
                WHERE created_at >= p_time_start 
                AND created_at < p_time_start + interval '1 minute'
            ) AS peak_concurrent,
            MAX(created_at) AS last_invocation
        FROM
            public.edge_function_stats efs
        WHERE
            (p_function_name IS NULL OR efs.function_name = p_function_name)
            AND (
                created_at >= p_time_start
                AND created_at <= p_time_end
            )
        GROUP BY
            efs.function_name
    )
    SELECT
        s.function_name,
        s.total_invocations,
        s.success_rate,
        s.average_duration_ms,
        s.memory_usage,
        s.cpu_time,
        s.peak_concurrent AS peak_concurrent_executions,
        s.last_invocation
    FROM
        stats s
    ORDER BY
        s.total_invocations DESC;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies
ALTER TABLE public.edge_function_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to authenticated users"
    ON public.edge_function_stats
    FOR SELECT
    TO authenticated
    USING (true);

-- Add comments
COMMENT ON FUNCTION public.get_database_stats IS 'Returns detailed database performance statistics including query times and cache hit rates';
COMMENT ON FUNCTION public.get_edge_function_stats IS 'Returns performance statistics for edge functions within a specified time range';
COMMENT ON TABLE public.edge_function_stats IS 'Stores execution statistics for edge functions'; 