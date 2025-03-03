# SUPABASE, RPC, AND EDGE FUNCTION KNOWLEDGE BASE (COMPLETE)

This document is a comprehensive reference of the **public, user-defined database functions (RPC)** and **Edge Functions** in your Supabase/Postgres environment. It has been fully updated to include:

- The **new columns** in `get_studies_with_pod_times()`.
- The **updated** `downsample_ecg` RPC (returning JSON).
- The **Edge Function** `downsample-ecg`.

No sections are omitted or labeled as “unchanged” here; every RPC is fully listed. You can query function info with:

```sql
SELECT * FROM get_rpc_function_info('FUNCTION_NAME');

which returns:

(function_name text,
 return_type   text,
 arguments     text,
 definition    text,
 function_type text)

1. DATABASE RPC FUNCTIONS

1.1 aggregate_leads(...)

Signature

aggregate_leads(
  p_pod_id uuid,
  p_time_start timestamptz,
  p_time_end timestamptz,
  p_bucket_seconds integer
)

Purpose
Aggregates ECG lead data (e.g. lead-on ratios, quality percentages) over time buckets of p_bucket_seconds length.

Return Schema

Column	Type	Description
time_bucket	timestamptz	Start timestamp for the time bucket (UTC)
lead_on_p_1	float8	Positive lead-on ratio (channel 1)
lead_on_p_2	float8	Positive lead-on ratio (channel 2)
lead_on_p_3	float8	Positive lead-on ratio (channel 3)
lead_on_n_1	float8	Negative lead-on ratio (channel 1)
lead_on_n_2	float8	Negative lead-on ratio (channel 2)
lead_on_n_3	float8	Negative lead-on ratio (channel 3)
quality_1_percent	float8	% good-quality samples for channel 1
quality_2_percent	float8	% good-quality samples for channel 2
quality_3_percent	float8	% good-quality samples for channel 3

1.2 downsample_ecg(...)

Signature

CREATE OR REPLACE FUNCTION downsample_ecg(
    p_pod_id uuid,
    p_time_start timestamp with time zone,
    p_time_end timestamp with time zone,
    p_factor integer DEFAULT 4
)
RETURNS jsonb

Purpose
Downsamples raw ECG data by returning every p_factorth sample (default factor = 4). Also returns lead-on flags, quality flags, etc., as JSON arrays.

Implementation (updated version):

CREATE OR REPLACE FUNCTION downsample_ecg(
    p_pod_id uuid,
    p_time_start timestamp with time zone,
    p_time_end timestamp with time zone,
    p_factor integer DEFAULT 4
)
RETURNS jsonb
AS $$
WITH params AS (
  SELECT GREATEST(1, LEAST(4, p_factor)) AS factor
),
samples AS (
  SELECT
    time,
    channel_1,
    channel_2,
    channel_3,
    lead_on_p_1,
    lead_on_p_2,
    lead_on_p_3,
    lead_on_n_1,
    lead_on_n_2,
    lead_on_n_3,
    quality_1,
    quality_2,
    quality_3,
    ROW_NUMBER() OVER (ORDER BY time) AS rn
  FROM public.ecg_sample
  WHERE pod_id = p_pod_id
    AND time BETWEEN p_time_start AND p_time_end
)
SELECT jsonb_build_object(
  'timestamps',      jsonb_agg(samples.time ORDER BY samples.time),
  'channel_1',       jsonb_agg(samples.channel_1 ORDER BY samples.time),
  'channel_2',       jsonb_agg(samples.channel_2 ORDER BY samples.time),
  'channel_3',       jsonb_agg(samples.channel_3 ORDER BY samples.time),
  'lead_on_p_1',     jsonb_agg(samples.lead_on_p_1 ORDER BY samples.time),
  'lead_on_p_2',     jsonb_agg(samples.lead_on_p_2 ORDER BY samples.time),
  'lead_on_p_3',     jsonb_agg(samples.lead_on_p_3 ORDER BY samples.time),
  'lead_on_n_1',     jsonb_agg(samples.lead_on_n_1 ORDER BY samples.time),
  'lead_on_n_2',     jsonb_agg(samples.lead_on_n_2 ORDER BY samples.time),
  'lead_on_n_3',     jsonb_agg(samples.lead_on_n_3 ORDER BY samples.time),
  'quality_1',       jsonb_agg(samples.quality_1 ORDER BY samples.time),
  'quality_2',       jsonb_agg(samples.quality_2 ORDER BY samples.time),
  'quality_3',       jsonb_agg(samples.quality_3 ORDER BY samples.time)
)
FROM samples, params
WHERE samples.rn % params.factor = 0;
$$ LANGUAGE sql;

Return
A jsonb object with arrays for each field. Example structure:

{
  "timestamps": [...],
  "channel_1": [...],
  "channel_2": [...],
  "channel_3": [...],
  "lead_on_p_1": [...],
  "lead_on_p_2": [...],
  "lead_on_p_3": [...],
  "lead_on_n_1": [...],
  "lead_on_n_2": [...],
  "lead_on_n_3": [...],
  "quality_1": [...],
  "quality_2": [...],
  "quality_3": [...]
}

1.3 downsample_ecg_boxcar(...)

Signature

downsample_ecg_boxcar(
  p_pod_id uuid,
  p_time_start timestamptz,
  p_time_end timestamptz,
  p_factor integer
)

Purpose
Downsamples ECG data using a boxcar (moving average) approach. Typically returns a row set (array) of objects containing:
	•	sample_time (timestamptz)
	•	downsampled_channel_1 (real)
	•	downsampled_channel_2 (real)
	•	downsampled_channel_3 (real)
	•	lead_on_p_1, lead_on_p_2, lead_on_p_3 (boolean)
	•	lead_on_n_1, lead_on_n_2, lead_on_n_3 (boolean)
	•	quality_1, quality_2, quality_3 (boolean)

1.4 downsample_ecg_naive(...)

Signature

downsample_ecg_naive(
  p_pod_id uuid,
  p_time_start timestamptz,
  p_time_end timestamptz,
  p_factor integer
)

Purpose
A simple decimation method that selects the first sample in each decimation block. Returns an array of row objects with the same fields as downsample_ecg_boxcar(...).

1.5 peak_preserving_downsample_ecg(...)

Signature

peak_preserving_downsample_ecg(
  p_pod_id uuid,
  p_time_start timestamptz,
  p_time_end timestamptz,
  p_max_pts integer
)

Purpose
Downsamples ECG while preserving local maxima/minima so that R-peaks (and other important wave features) remain intact. Returns a row set with the same shape as the other downsampling functions.

1.6 get_study_list_with_earliest_latest(...)

Signature

get_study_list_with_earliest_latest(
  p_search text DEFAULT NULL,
  p_offset integer DEFAULT 0,
  p_limit integer DEFAULT 25
)

Purpose
Lists studies (with optional filtering and pagination) plus the earliest and latest ECG data timestamps for each.

Return Schema

Column	Type	Description
study_id	uuid	Study identifier
pod_id	uuid	Pod ID
start_timestamp	timestamptz	Official study start time
end_timestamp	timestamptz	Official study end time
earliest_time	timestamptz	Earliest ECG data time
latest_time	timestamptz	Latest ECG data time
total_count	bigint	Total matching rows (for pagination)

1.7 get_pod_days(...)

Signature

get_pod_days(
  p_pod_id uuid
)

Purpose
Returns a list of distinct UTC dates for which ECG data exists for the specified pod.

Return Schema

Column	Type	Description
day_value	date	The UTC date with any data

1.8 get_pod_earliest_latest(...)

Signature

get_pod_earliest_latest(
  p_pod_id uuid
)

Purpose
Retrieves the earliest and latest recorded timestamps for the given pod.

Return Schema

Column	Type	Description
earliest_time	timestamptz	Earliest data timestamp
latest_time	timestamptz	Latest data timestamp

1.9 get_studies_with_pod_times()

Signature

CREATE OR REPLACE FUNCTION get_studies_with_pod_times()
RETURNS TABLE(
    updated_at                 TIMESTAMP WITH TIME ZONE,
    clinic_name                TEXT,
    study_id                   UUID,
    aggregated_quality_minutes INTEGER,
    aggregated_total_minutes   INTEGER,
    quality_fraction           DECIMAL(3,2),   -- 0.00-1.00
    clinic_id                  UUID,
    user_id                    TEXT,
    pod_id                     UUID,
    study_type                 TEXT,
    study_start                TIMESTAMP WITH TIME ZONE,
    study_completed            TIMESTAMP WITH TIME ZONE,
    expected_end               TIMESTAMP WITH TIME ZONE,
    expected_duration          DECIMAL(5,1),   -- days
    duration_so_far            DECIMAL(5,1),   -- days
    expected_days_remaining    DECIMAL(5,1),   -- days
    days_extended              DECIMAL(5,1),   -- days
    created_at                 TIMESTAMP WITH TIME ZONE,
    created_by                 TEXT,
    study_status               TEXT,
    earliest_ecg_data          TIMESTAMP WITH TIME ZONE,
    latest_ecg_data            TIMESTAMP WITH TIME ZONE
)
...

Purpose
Generates a list of all studies, including:
	•	The updated time fields
	•	Computed durations and fraction of required quality minutes
	•	A final study_status that categorizes the study as on_target, needs_extension, extended, etc.

Implementation (full code):

CREATE OR REPLACE FUNCTION get_studies_with_pod_times()
RETURNS TABLE(
    updated_at                 TIMESTAMP WITH TIME ZONE,
    clinic_name                TEXT,
    study_id                   UUID,
    aggregated_quality_minutes INTEGER,
    aggregated_total_minutes   INTEGER,
    quality_fraction           DECIMAL(3,2),   -- 0.00-1.00 range
    clinic_id                  UUID,
    user_id                    TEXT,
    pod_id                     UUID,
    study_type                 TEXT,
    study_start                TIMESTAMP WITH TIME ZONE,
    study_completed            TIMESTAMP WITH TIME ZONE,
    expected_end               TIMESTAMP WITH TIME ZONE,
    expected_duration          DECIMAL(5,1),
    duration_so_far            DECIMAL(5,1),
    expected_days_remaining    DECIMAL(5,1),
    days_extended              DECIMAL(5,1),
    created_at                 TIMESTAMP WITH TIME ZONE,
    created_by                 TEXT,
    study_status               TEXT,
    earliest_ecg_data          TIMESTAMP WITH TIME ZONE,
    latest_ecg_data            TIMESTAMP WITH TIME ZONE
)
AS $$
WITH study_base AS (
  SELECT
    s.study_id,
    s.clinic_id,
    s.user_id,
    s.pod_id,
    s.study_type,
    s.created_at,
    s.created_by,
    s.updated_at,
    s.aggregated_quality_minutes,
    s.aggregated_total_minutes,
    s.start_timestamp,
    s.end_timestamp,
    s.expected_end_timestamp,
    ROUND(
      COALESCE(s.aggregated_quality_minutes,0)::DECIMAL
       / NULLIF(s.aggregated_total_minutes,0)::DECIMAL
    , 2) AS overall_quality_fraction
  FROM study s
),
day_calcs AS (
  SELECT
    sb.*,
    ROUND(
      EXTRACT(EPOCH FROM (sb.expected_end_timestamp - sb.start_timestamp))
      / 86400::DECIMAL
    , 1) AS expected_duration,
    ROUND(
      CASE
        WHEN sb.end_timestamp IS NULL OR sb.end_timestamp > NOW()
          THEN EXTRACT(EPOCH FROM (NOW() - sb.start_timestamp)) / 86400
        ELSE EXTRACT(EPOCH FROM (sb.end_timestamp - sb.start_timestamp)) / 86400
      END
    , 1) AS duration_so_far,
    ROUND(
      CASE
        WHEN sb.end_timestamp IS NULL OR sb.end_timestamp > NOW()
          THEN EXTRACT(EPOCH FROM (sb.expected_end_timestamp - NOW())) / 86400
        ELSE EXTRACT(EPOCH FROM (sb.end_timestamp - sb.start_timestamp)) / 86400
      END
    , 1) AS expected_days_remaining,
    ROUND(
      CASE
        WHEN sb.end_timestamp IS NULL OR sb.end_timestamp > NOW()
          THEN EXTRACT(EPOCH FROM (NOW() - sb.expected_end_timestamp)) / 86400
        ELSE NULL
      END
    , 1) AS days_extended
  FROM study_base sb
)
SELECT
  dc.updated_at                           AS updated_at,
  c.name                                  AS clinic_name,
  dc.study_id,
  dc.aggregated_quality_minutes,
  dc.aggregated_total_minutes,
  dc.overall_quality_fraction             AS quality_fraction,
  dc.clinic_id,
  dc.user_id,
  dc.pod_id,
  dc.study_type,
  dc.start_timestamp                      AS study_start,
  dc.end_timestamp                        AS study_completed,
  dc.expected_end_timestamp               AS expected_end,
  dc.expected_duration,
  dc.duration_so_far,
  dc.expected_days_remaining,
  dc.days_extended,
  dc.created_at,
  dc.created_by,
  CASE
    WHEN (dc.end_timestamp IS NULL OR dc.end_timestamp > NOW()) THEN
      CASE
        WHEN dc.expected_days_remaining <= 1 THEN
          CASE
            WHEN dc.aggregated_quality_minutes < (dc.duration_so_far * 720)
              THEN 'needs_extension'
            ELSE '24h_to_completion'
          END
        ELSE
          CASE
            WHEN (
              dc.aggregated_quality_minutes
              / NULLIF(dc.duration_so_far * 720, 0)
            ) > 0.6
              THEN 'on_target'
            WHEN (
              dc.aggregated_quality_minutes
              / NULLIF(dc.duration_so_far * 720, 0)
            ) >= 0.5
              THEN 'monitor'
            ELSE 'intervene'
          END
      END
    WHEN dc.end_timestamp < NOW() THEN
      CASE
        WHEN dc.end_timestamp <= dc.expected_end_timestamp THEN 'completed'
        WHEN dc.end_timestamp >  dc.expected_end_timestamp THEN 'extended'
        ELSE NULL
      END
    ELSE
      NULL
  END AS study_status,
  es.earliest_ecg_data,
  es.latest_ecg_data
FROM day_calcs dc
LEFT JOIN clinics c ON c.id = dc.clinic_id
LEFT JOIN ecg_sample_summary es ON es.pod_id = dc.pod_id
ORDER BY dc.updated_at DESC;
$$ LANGUAGE sql;

1.10 get_study_details_with_earliest_latest(...)

Signature

get_study_details_with_earliest_latest(
  p_study_id uuid
)

Purpose
Retrieves extended information for a single study (clinic, pod, start, end) plus earliest/latest data times.

Return Schema

Column	Type	Description
study_id	uuid	Study unique ID
clinic_id	uuid	Clinic ID
pod_id	uuid	Pod/Device ID
start_timestamp	timestamptz	Study start (scheduled)
end_timestamp	timestamptz	Study end (scheduled)
earliest_time	timestamptz	Earliest actual data time for that study
latest_time	timestamptz	Latest actual data time for that study

1.11 get_study_diagnostics(...)

Signature

get_study_diagnostics(
  p_study_id uuid
)

Purpose
Provides diagnostic metrics for a study, such as quality fraction variability, interruptions, or hours flagged as bad/insufficient data.

Return Schema

Column	Type	Description
study_id	uuid	Study identifier
quality_fraction_variability	numeric	Standard deviation or variability of the quality fraction
total_minute_variability	numeric	Variation in total recorded minutes across intervals
interruptions	integer	Count of major data interruptions or gaps
bad_hours	integer	Hours flagged as poor quality

1.12 update_study_minutes(...)

Signature

update_study_minutes()
  RETURNS trigger

Purpose
A trigger function that automatically updates aggregated or quality minutes in a study record when underlying data changes (e.g., new ECG inserts).

Return
No direct table, but the triggered row is updated accordingly.

1.13 get_clinic_monthly_quality(...)

Signature

get_clinic_monthly_quality(
  _clinic_id uuid
)

(There may be an overload with no arguments that returns data for all clinics.)

Purpose
Computes monthly average quality metrics for a clinic.

Return Schema

Column	Type	Description
month_start	date	Start date of the month
average_quality	numeric	Average quality fraction or percentage

1.14 get_clinic_monthly_studies(...)

Signature

get_clinic_monthly_studies(
  _clinic_id uuid
)

(There may be an overload returning data for all clinics.)

Purpose
Returns the monthly count of open studies for a clinic.

Return Schema

Column	Type	Description
month_start	date	Start date of that month
open_studies	int	Number of open studies during that month

1.15 get_clinic_weekly_quality(...)

Signature

get_clinic_weekly_quality(
  _clinic_id uuid
)

(One or more variants may exist.)

Purpose
Returns the weekly average quality fraction for a clinic, aggregated by the start of each ISO week.

Return Schema

Column	Type	Description
week_start	date	Start date of the ISO week
average_quality	numeric	Average quality fraction that week

1.16 get_clinic_weekly_studies(...)

Signature

get_clinic_weekly_studies(
  _clinic_id uuid
)

Purpose
Returns the weekly count of open studies for a clinic, aggregated by the start of each ISO week.

Return Schema

Column	Type	Description
week_start	date	Start date of the ISO week
open_studies	int	Number of open studies that week

1.17 get_earliest_latest_for_pod(...)

Signature

get_earliest_latest_for_pod(
  p_pod_id uuid
)

Purpose
Similar to get_pod_earliest_latest, returns earliest and latest data times for a single pod.

Return Schema

Column	Type	Description
earliest_time	timestamptz	Earliest data timestamp
latest_time	timestamptz	Latest data timestamp

1.18 get_new_studies_and_growth()

Signature

get_new_studies_and_growth()

Purpose
Provides the total count of newly created studies over a recent interval and a growth percentage (e.g., for KPI dashboards).

Return Schema

Column	Type	Description
new_studies	bigint	Number of newly created studies
growth_percent	numeric	Growth percentage vs. prior period

1.19 get_per_clinic_breakdown()

Signature

get_per_clinic_breakdown()

Purpose
Aggregates stats per clinic: total active studies, how many require intervention, average quality, etc.

Return Schema

Column	Type	Description
clinic_id	uuid	Clinic ID
clinic_name	text	Clinic name
total_active_studies	bigint	Count of currently active studies
intervene_count	bigint	# of active studies flagged for intervention
monitor_count	bigint	# of active studies to watch (borderline)
on_target_count	bigint	# of studies performing well
average_quality	numeric	Overall average quality fraction

1.20 get_quality_threshold(...)

Signature

get_quality_threshold(
  threshold double precision
)

Purpose
Maps a numeric threshold (0..1) to some integer classification, possibly for categorizing quality.

Return
An integer classification or index.

1.21 downsample_ecg_chunked(...)

Signature

downsample_ecg_chunked(
  p_pod_id text,
  p_time_start text,
  p_time_end text,
  p_factor integer DEFAULT NULL,
  p_chunk_minutes integer DEFAULT NULL,
  p_offset integer DEFAULT NULL,
  p_limit integer DEFAULT NULL
)

Purpose
Performs chunked ECG downsampling by splitting the input time range into p_chunk_minutes intervals. Each chunk is downsampled with factor p_factor. Useful for large time ranges.

Return
An array or rowset of “chunk” objects, each containing:
	•	chunk_start
	•	chunk_end
	•	samples (JSON array of downsampled points)

1.22 get_ecg_diagnostics_chunked(...)

Signature

get_ecg_diagnostics_chunked(
  p_pod_id text,
  p_time_start text,
  p_time_end text,
  p_chunk_minutes integer DEFAULT NULL,
  p_offset integer DEFAULT NULL,
  p_limit integer DEFAULT NULL
)

Purpose
Retrieves ECG diagnostic metrics chunk by chunk, similar to downsample_ecg_chunked but returning quality/lead-on statistics in a JSON structure.

Return
Rowset with each row containing:
	•	chunk_start
	•	chunk_end
	•	metrics (a JSON object of diagnostic fields)

1.23 get_study_hourly_metrics(...)

Signature

get_study_hourly_metrics(
  p_study_id uuid
)

Purpose
Returns hourly metrics for a given study (e.g., reading counts, total vs. quality minutes per hour).

Return Schema

Column	Type	Description
hour_of_day	int	Hour of the day (0..23)
reading_count	int	# of ECG readings in that hour
total_minutes	int	Total recorded minutes that hour
quality_minutes	int	Good-quality minutes that hour

1.24 get_clinic_table_stats()

Signature

get_clinic_table_stats()

Purpose
Returns aggregated stats for each clinic: total/open studies, average quality, # of interventions, etc.

Return Schema

Column	Type	Description
clinic_id	uuid	Unique clinic ID
clinic_name	text	Name of the clinic
total_studies	int	Total studies in that clinic
open_studies	int	Currently open (active) studies
average_quality	numeric	Overall average quality fraction
good_count	int	# of studies with quality fraction ≥ 0.7
soso_count	int	# in [0.5, 0.7)
bad_count	int	# in [0.3, 0.5)
critical_count	int	# in < 0.3
average_quality_hours	numeric	Average hours of good-quality data
recent_alerts	json	JSON array of recent alerts or warnings
intervene_count	int	# requiring intervention (quality < 0.5)
monitor_count	int	# borderline (quality in [0.5,0.6])
on_target_count	int	# above 0.6
near_completion_count	int	# within 24h of end date but good quality
needs_extension_count	int	# near end date but poor quality
completed_count	int	# completed on time
extended_count	int	# completed late

1.25 get_clinic_combined_stats()

Signature

get_clinic_combined_stats()

Purpose
Returns extended metrics per clinic, combining the fields from get_clinic_table_stats() and possibly additional columns. This might show total vs. open studies, average quality, distribution of quality categories, and recent alerts.

Return Schema

Column	Type	Description
clinic_id	uuid	Clinic identifier
clinic_name	text	Name of the clinic
total_studies	int	Total # of studies for that clinic
open_studies	int	# of open (active) studies
average_quality	numeric	Overall average quality fraction
good_count	int	# of studies with fraction ≥ 0.7
soso_count	int	# in [0.5, 0.7)
bad_count	int	# in [0.3, 0.5)
critical_count	int	# below 0.3
average_quality_hours	numeric	Average good-quality hours
recent_alerts	json	JSON array of alerts from the past week
intervene_count	int	# with fraction < 0.5 (needs intervention)
monitor_count	int	# borderline (≥0.5 but ≤0.6)
on_target_count	int	# above 0.6
near_completion_count	int	# close to end date but good fraction
needs_extension_count	int	# close to end date but poor fraction
completed_count	int	# completed on or before expected end
extended_count	int	# completed after expected end

1.26 get_clinic_analytics()

Signature

get_clinic_analytics()

Purpose
Provides high-level counts (total patients, active patients, total studies, active studies) for each clinic. Useful for dashboards.

Return Schema

Column	Type	Description
totalpatients	number	Total number of patients or wearers
activepatients	number	Count of actively monitored patients
totalstudies	number	Total # of studies across clinics
activestudies	number	# of currently active studies
clinic_id	text	Associated clinic UUID or identifier

1.27 get_edge_function_stats(...)

Signature

get_edge_function_stats(
  p_function_name text DEFAULT NULL,
  p_time_start text DEFAULT NULL,
  p_time_end text DEFAULT NULL
)

Purpose
Retrieves usage stats for a given Edge Function: total invocations, success rate, average duration, memory usage, CPU time, concurrency, last invocation, etc.

Return Schema

Column	Type	Description
function_name	text	Name of the edge function
total_invocations	number	Total calls/invocations
success_rate	number	Ratio or percent of successful calls
average_duration_ms	number	Average execution time (ms)
memory_usage	number	Average memory usage in bytes or relevant unit
cpu_time	unknown	CPU time usage (internal format)
peak_concurrent_executions	number	Max concurrent executions recorded
last_invocation	text	Timestamp of the most recent invocation

1.28 get_database_stats()

Signature

get_database_stats()

Purpose
Returns query usage/performance stats for the database, capturing total calls, total time, min/max times, average rows, etc.

Return Schema

Column	Type	Description
stat_type	text	Category of the statistic
rolname	text	Role under which the query was executed
query	text	Query text (or a hashed/truncated representation)
calls	number	Number of calls/invocations
total_time	number	Cumulative execution time (ms)
min_time	number	Minimum execution time (ms)
max_time	number	Maximum execution time (ms)
mean_time	number	Mean execution time (ms)
avg_rows	number	Average rows returned per call
prop_total_time	text	Proportion of total time vs. all queries
hit_rate	number	Cache/buffer hit rate

1.29 rpccallinfo()

Signature

rpccallinfo()

Purpose
Returns metadata about RPC calls, similar to get_rpc_function_info (function name, return type, arguments, definition, etc.).

Return Schema

Column	Type	Description
function_name	text	RPC function name
return_type	text	Function return type
arguments	text	Argument signature
definition	text	Underlying SQL definition
function_type	text	Classification (normal, trigger, etc.)

1.30 get_telemetry_report()

Signature

get_telemetry_report()

Purpose
Returns a single JSON object containing telemetry or usage data for analytics dashboards.

Return
A JSON object with telemetry details.

1.31 merge_temp_ecg_data()

Signature

merge_temp_ecg_data()

Purpose
Merges any ECG data stored in a temporary staging table into the main ecg_sample table. Useful for bulk imports or partial data uploads.

Return
No direct row return; the data is merged as a side effect.

2. EDGE FUNCTIONS

Below are user-defined Edge Functions that wrap or interface with these RPC calls.

2.1 downsample-ecg

File: downsample-ecg/index.ts
Purpose
	•	Accepts a JSON body specifying pod_id, time range, factor, etc.
	•	Decides whether to call downsample_ecg or downsample_ecg_chunked based on the time range.
	•	Returns the resulting JSON to the client.
	•	Logs usage stats to edge_function_stats.

Complete Code

/**
PHASE: Edge Function
FILE: downsample-ecg/index.ts
*/
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    {
        auth: { persistSession: false }
    }
);

const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-application-name",
    "Access-Control-Max-Age": "86400"
};

interface DownsampleParams {
    pod_id: string;
    time_start: string;
    time_end: string;
    factor?: number;
    chunk_minutes?: number;
}

function extractUserIdFromToken(authHeader: string | null): string | null {
    if (!authHeader) return null;
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match || !match[1]) return null;
    const token = match[1];
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = JSON.parse(atob(parts[1]));
        return payload.sub || null;
    } catch (error) {
        console.error("[downsample-ecg] Error extracting user ID from token:", error);
        return null;
    }
}

function validateParams(params: DownsampleParams): string | null {
    if (!params.pod_id) return "Missing required parameter: pod_id";
    if (!params.time_start) return "Missing required parameter: time_start";
    if (!params.time_end) return "Missing required parameter: time_end";
    const start = new Date(params.time_start);
    const end = new Date(params.time_end);
    if (isNaN(start.getTime())) return "Invalid time_start format";
    if (isNaN(end.getTime())) return "Invalid time_end format";
    if (end <= start) return "time_end must be after time_start";

    if (params.factor !== undefined) {
        if (typeof params.factor !== 'number') return "factor must be a number";
        if (params.factor < 1 || params.factor > 4) return "factor must be between 1 and 4";
    }
    if (params.chunk_minutes !== undefined) {
        if (typeof params.chunk_minutes !== 'number') return "chunk_minutes must be a number";
        if (params.chunk_minutes < 1) return "chunk_minutes must be positive";
    }
    return null;
}

function shouldUseChunkedProcessing(start: Date, end: Date, chunkMinutesRequested?: number): boolean {
    const HOUR_IN_MS = 60 * 60 * 1000;
    const durationMs = end.getTime() - start.getTime();
    const durationHours = durationMs / HOUR_IN_MS;
    // If the range > 1 hour, or chunk_minutes is specified, do chunked calls
    return durationHours > 1 || chunkMinutesRequested !== undefined;
}

function getOptimalChunkSize(start: Date, end: Date, requestedChunkMinutes?: number): number {
    if (requestedChunkMinutes) return requestedChunkMinutes;
    const HOUR_IN_MS = 60 * 60 * 1000;
    const durationMs = end.getTime() - start.getTime();
    const durationHours = durationMs / HOUR_IN_MS;
    if (durationHours > 24) return 60;
    if (durationHours > 12) return 30;
    if (durationHours > 6) return 15;
    if (durationHours > 1) return 10;
    return 5;
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: corsHeaders
        });
    }

    const startTime = Date.now();
    let functionName = "downsample_ecg";  // fallback default
    const userId = extractUserIdFromToken(req.headers.get('Authorization'));

    try {
        if (req.method !== "POST") {
            throw new Error("Method not allowed");
        }

        const params: DownsampleParams = await req.json();
        const validationError = validateParams(params);
        if (validationError) {
            throw new Error(validationError);
        }

        const start = new Date(params.time_start);
        const end = new Date(params.time_end);
        const factor = params.factor ?? 4;

        console.log("[downsample-ecg] Request:", {
            pod_id: params.pod_id,
            time_start: params.time_start,
            time_end: params.time_end,
            factor: factor,
            chunk_minutes: params.chunk_minutes
        });

        let data, error;
        const useChunkedProcessing = shouldUseChunkedProcessing(start, end, params.chunk_minutes);
        if (useChunkedProcessing) {
            functionName = "downsample_ecg_chunked";
            const chunkMinutes = getOptimalChunkSize(start, end, params.chunk_minutes);
            console.log(`[downsample-ecg] Using chunked processing with ${chunkMinutes} minute chunks`);

            const result = await supabase.rpc(functionName, {
                p_pod_id: params.pod_id,
                p_time_start: params.time_start,
                p_time_end: params.time_end,
                p_factor: factor,
                p_chunk_minutes: chunkMinutes
            });
            data = result.data;
            error = result.error;
        } else {
            const result = await supabase.rpc(functionName, {
                p_pod_id: params.pod_id,
                p_time_start: params.time_start,
                p_time_end: params.time_end,
                p_factor: factor
            });
            data = result.data;
            error = result.error;
        }

        await supabase
            .from('edge_function_stats')
            .insert({
                function_name: functionName,
                execution_duration: Date.now() - startTime,
                success: !error,
                user_id: userId
            });

        if (error) {
            console.error(`[downsample-ecg] RPC error (${functionName}):`, error);
            throw error;
        }

        return new Response(
            JSON.stringify(data),
            {
                status: 200,
                headers: corsHeaders
            }
        );
    } catch (err) {
        console.error("[downsample-ecg] Error:", err);

        await supabase
            .from('edge_function_stats')
            .insert({
                function_name: functionName,
                execution_duration: Date.now() - startTime,
                success: false,
                error_message: err instanceof Error ? err.message : "Unknown error",
                user_id: userId
            });

        return new Response(
            JSON.stringify({
                error: err instanceof Error ? err.message : "Unknown error",
                code: err instanceof Error && 'code' in err ? err.code : undefined
            }),
            {
                status: err instanceof Error && err.message.includes("Missing") ? 400 : 500,
                headers: corsHeaders
            }
        );
    }
});

Key Points
	•	Chooses downsample_ecg_chunked if the time range is long or chunk_minutes is requested; otherwise calls downsample_ecg.
	•	Logs usage metrics and any errors to the edge_function_stats table.
	•	Validates input parameters thoroughly.


