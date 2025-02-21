# SUPABASE, RPC AND EDGE FUNCTION KNOWLEDGE BASE (UPDATED)

This document provides a consolidated reference for all public, user-defined database functions (RPC) and Edge Functions available in your Supabase/Postgres environment. The focus is on functions that support ECG/clinic workflows, including data aggregation, downsampling, study analytics, and temporary data staging. Administrative or TimescaleDB-specific routines are noted separately where applicable.

---


RETRIEVE FUNCTION INFO USING `SELECT * FROM get_rpc_function_info('FUNCTION_NAME`);
RETURNS TABLE(
    function_name text,
    return_type text,
    arguments text,
    definition text,
    function_type text
)

## 1. Database RPC Functions

Below is the updated comprehensive list of functions. Each entry includes the function signature, purpose, return schema (if applicable), and any additional notes.

### 1.1 `aggregate_leads(...)`
**Signature**  
```sql
aggregate_leads(
  p_pod_id uuid,
  p_time_start timestamptz,
  p_time_end timestamptz,
  p_bucket_seconds integer
)

Purpose:
Aggregates ECG lead data (e.g., lead-on ratios, quality percentages) in specified time buckets.

Return Schema (table):

Column	Type	Description
time_bucket	timestamptz	Time bucket boundary start (UTC)
lead_on_p_1	float8	Positive lead-on ratio (ch 1)
lead_on_p_2	float8	Positive lead-on ratio (ch 2)
lead_on_p_3	float8	Positive lead-on ratio (ch 3)
lead_on_n_1	float8	Negative lead-on ratio (ch 1)
lead_on_n_2	float8	Negative lead-on ratio (ch 2)
lead_on_n_3	float8	Negative lead-on ratio (ch 3)
quality_1_percent	float8	% good-quality for channel 1
quality_2_percent	float8	% good-quality for channel 2
quality_3_percent	float8	% good-quality for channel 3

1.2 downsample_ecg(...)

Signature

downsample_ecg(
  p_pod_id uuid,
  p_time_start timestamptz,
  p_time_end timestamptz,
  p_factor integer
)

Purpose:
Downsamples raw ECG data by a decimation factor (selects every Nth sample) while also returning lead-on and quality flags.

Return Schema (table):

Column	Type	Description
sample_time	timestamptz	UTC timestamp of the sample
downsampled_channel_1	real	Downsampled value for channel 1
downsampled_channel_2	real	Downsampled value for channel 2
downsampled_channel_3	real	Downsampled value for channel 3
lead_on_p_1	boolean	Positive lead-on (ch 1)
lead_on_p_2	boolean	Positive lead-on (ch 2)
lead_on_p_3	boolean	Positive lead-on (ch 3)
lead_on_n_1	boolean	Negative lead-on (ch 1)
lead_on_n_2	boolean	Negative lead-on (ch 2)
lead_on_n_3	boolean	Negative lead-on (ch 3)
quality_1	boolean	Quality flag (ch 1)
quality_2	boolean	Quality flag (ch 2)
quality_3	boolean	Quality flag (ch 3)

1.3 downsample_ecg_boxcar(...)

Signature

downsample_ecg_boxcar(
  p_pod_id uuid,
  p_time_start timestamptz,
  p_time_end timestamptz,
  p_factor integer
)

Purpose:
Downsamples ECG data using a boxcar (moving average) approach for smoothing and reduction.

Return Schema:
Identical to downsample_ecg(...) with numeric channels being boxcar-averaged.

1.4 downsample_ecg_naive(...)

Signature

downsample_ecg_naive(
  p_pod_id uuid,
  p_time_start timestamptz,
  p_time_end timestamptz,
  p_factor integer
)

Purpose:
A simple method that selects the first sample in each decimation block.

Return Schema:
Same as downsample_ecg_boxcar(...).

1.5 peak_preserving_downsample_ecg(...)

Signature

peak_preserving_downsample_ecg(
  p_pod_id uuid,
  p_time_start timestamptz,
  p_time_end timestamptz,
  p_max_pts integer
)

Purpose:
Downsamples ECG data while preserving local peaks (maxima/minima) to ensure R-peaks are retained.

Return Schema:
Same as the other downsampling functions, with selected samples that retain peaks.

1.6 get_study_list_with_earliest_latest(...)

Signature

get_study_list_with_earliest_latest(
  p_search text DEFAULT NULL,
  p_offset integer DEFAULT 0,
  p_limit integer DEFAULT 25
)

Purpose:
Lists studies (with optional filtering and pagination) along with the earliest and latest ECG data timestamps.

Return Schema (table):

Column	Type	Description
study_id	uuid	Study identifier
pod_id	uuid	Pod ID
start_timestamp	timestamptz	Official start time
end_timestamp	timestamptz	Official end time
earliest_time	timestamptz	Earliest actual data time
latest_time	timestamptz	Latest actual data time
total_count	bigint	Total matching rows (for pagination)

1.7 get_pod_days(...)

Signature

get_pod_days(
  p_pod_id uuid
)

Purpose:
Returns a list of distinct UTC dates for which data exists for the specified pod.

Return Schema (table):

Column	Type	Description
day_value	date	Available day

1.8 get_pod_earliest_latest(...)

Signature

get_pod_earliest_latest(
  p_pod_id uuid
)

Purpose:
Retrieves the earliest and latest recorded timestamps for a given pod.

Return Schema (table):

Column	Type	Description
earliest_time	timestamptz	Earliest data timestamp
latest_time	timestamptz	Latest data timestamp

1.9 get_studies_with_pod_times()

Signature

get_studies_with_pod_times()

Purpose:
Provides an expanded list of studies with aggregated metrics and pod timestamps.

Return Schema (table):

Column	Type	Description
study_id	uuid	Study unique ID
clinic_id	uuid	Associated clinic ID
pod_id	uuid	Device/pod ID
user_id	text	User/wearer ID
aggregated_quality_minutes	integer	Summed quality minutes
aggregated_total_minutes	integer	Summed total minutes
duration	integer	Duration (in days or hours)
end_timestamp	timestamptz	Scheduled end time
expected_end_timestamp	timestamptz	Alternative end time
start_timestamp	timestamptz	Official study start
study_type	text	e.g., Holter, MCT, etc.
updated_at	timestamptz	Last update
created_at	timestamptz	Creation time
created_by	text	Record creator
earliest_time	timestamptz	Earliest actual data timestamp
latest_time	timestamptz	Latest actual data timestamp
clinic_name	text	Clinic name
pod_status	text	Pod or study status

1.10 get_study_details_with_earliest_latest(...)

Signature

get_study_details_with_earliest_latest(
  p_study_id uuid
)

Purpose:
Retrieves detailed information for a single study, including its earliest and latest data times.

Return Schema (table):

Column	Type	Description
study_id	uuid	Study ID
clinic_id	uuid	Clinic ID
pod_id	uuid	Pod ID
start_timestamp	timestamptz	Official scheduled start
end_timestamp	timestamptz	Official scheduled end
earliest_time	timestamptz	Earliest actual data within the study window
latest_time	timestamptz	Latest actual data

1.11 get_study_diagnostics(...)

Signature

get_study_diagnostics(
  p_study_id uuid
)

Purpose:
Provides diagnostic metrics for a study such as quality variability, number of interruptions, and hours flagged as poor quality.

Return Schema (table):

Column	Type	Description
study_id	uuid	Study identifier
quality_fraction_variability	numeric	Standard deviation of quality fraction
total_minute_variability	numeric	Variation in total recorded minutes
interruptions	integer	Number of data interruptions
bad_hours	integer	Hours flagged as poor or insufficient

1.12 update_study_minutes(...)

Signature

update_study_minutes()
  RETURNS trigger

Purpose:
Trigger function to update aggregated or quality minutes on a study record when underlying data changes.

Return:
Trigger (modifies the study row as needed).

1.13 get_clinic_monthly_quality(...)

Signature

get_clinic_monthly_quality(
  _clinic_id uuid
)

Purpose:
Calculates the monthly average quality metric for a given clinic.

Return Schema (table):

Column	Type	Description
month_start	date	Start date of the month
average_quality	numeric	Average quality metric

1.14 get_clinic_monthly_studies(...)

Signature

get_clinic_monthly_studies(
  _clinic_id uuid
)

Purpose:
Returns the monthly count of open studies for a clinic.

Return Schema (table):

Column	Type	Description
month_start	date	Start date of the month
open_studies	int	Number of open studies during the month

1.15 get_clinic_overview(...)

Signature

get_clinic_overview(
  _clinic_id uuid
)

Purpose:
Provides a dashboard overview for a clinic, including active/total studies, average quality hours, and recent alerts.

Return Schema (table):

Column	Type	Description
active_studies	int	Number of active studies
total_studies	int	Total studies in the clinic
average_quality_hours	numeric	Average hours of good quality data
recent_alerts	json	JSON array of recent alerts/warnings

1.16 get_clinic_quality_breakdown(...)

Signature

get_clinic_quality_breakdown(
  _clinic_id uuid DEFAULT NULL
)

Purpose:
Provides a quality breakdown for each clinic, or for a single clinic if an ID is provided.

Return Schema (table):

Column	Type	Description
clinic_id	uuid	Clinic ID
clinic_name	text	Clinic name
total_studies	int	Total studies in the clinic
open_studies	int	Number of ongoing studies
average_quality	numeric	Overall average quality rating
good_count	int	Count of studies with quality fraction ≥ 0.7
soso_count	int	Count with quality fraction in [0.5, 0.7)
bad_count	int	Count with quality fraction in [0.3, 0.5)
critical_count	int	Count with quality fraction < 0.3

1.17 get_clinic_status_breakdown(...)

Signature

get_clinic_status_breakdown(
  _clinic_id uuid DEFAULT NULL
)

Purpose:
Summarizes study counts by different statuses (e.g., closed, intervene, monitor, on_target, near_completion, needs_extension) for a clinic.

Return Schema (table):

Column	Type	Description
clinic_id	uuid	Clinic ID
clinic_name	text	Clinic name
total_studies	int	Total studies in the clinic
open_studies	int	Number of active studies
closed	int	Number of closed/completed studies
intervene_count	int	Studies needing direct intervention
monitor_count	int	Studies in monitoring state
on_target_count	int	Studies on track
near_completion_count	int	Studies nearing completion (e.g., within 24h)
needs_extension_count	int	Studies requiring a time extension

1.18 get_clinic_weekly_quality(...)

Signature

get_clinic_weekly_quality(
  _clinic_id uuid
)

Purpose:
Provides the weekly average quality metric for a clinic.

Return Schema (table):

Column	Type	Description
week_start	date	Start date of the week
average_quality	numeric	Average quality for that week

1.19 get_clinic_weekly_studies(...)

Signature

get_clinic_weekly_studies(
  _clinic_id uuid
)

Purpose:
Returns weekly counts of open studies for a clinic.

Return Schema (table):

Column	Type	Description
week_start	date	ISO week start date
open_studies	int	Number of open studies that week

1.20 get_earliest_latest_for_pod(...)

Signature

get_earliest_latest_for_pod(
  p_pod_id uuid
)

Purpose:
Similar to get_pod_earliest_latest(...); returns the earliest and latest data times for a single pod.

Return Schema (table):

Column	Type	Description
earliest_time	timestamptz	Earliest data time
latest_time	timestamptz	Latest data time

1.21 get_new_studies_and_growth()

Signature

get_new_studies_and_growth()

Purpose:
Returns the total count of new studies over a recent interval along with a growth percentage for KPI dashboards.

Return Schema (table):

Column	Type	Description
new_studies	bigint	Number of newly created studies
growth_percent	numeric	Growth percentage vs. the prior period

1.22 get_per_clinic_breakdown()

Signature

get_per_clinic_breakdown()

Purpose:
Provides aggregated stats per clinic including active studies, intervention counts, and average quality.

Return Schema (table):

Column	Type	Description
clinic_id	uuid	Clinic ID
clinic_name	varchar	Clinic name
total_active_studies	bigint	Count of active studies
intervene_count	bigint	Count of studies requiring intervention
monitor_count	bigint	Count of studies in monitoring state
on_target_count	bigint	Count of studies on track
average_quality	numeric	Overall average quality fraction

1.23 get_quality_threshold(...)

Signature

get_quality_threshold(
  threshold double precision
)

Purpose:
Returns an integer classification/index for a provided quality threshold (usage details may vary).

Return:
integer

1.24 get_studies_with_aggregates()

Signature

get_studies_with_aggregates()

Purpose:
Returns a list of studies with aggregated quality/total minutes, earliest/latest data times, and associated clinic name.

Return Schema (table):

Column	Type	Description
study_id	uuid	Study ID
study_type	varchar	Type of study
clinic_id	uuid	Associated clinic
user_id	varchar	User ID
aggregated_quality_minutes	numeric	Summed quality minutes
aggregated_total_minutes	numeric	Summed total minutes
earliest_time	timestamp	Earliest data time
latest_time	timestamp	Latest data time
clinic_name	text	Clinic name

1.25 create_temp_table(...)

Signature

create_temp_table(
  table_name text,
  columns jsonb
)

Purpose:
Creates a temporary table at runtime for staging ECG or other data. Accepts a JSON array describing columns.

Return:
void

1.26 downsample_ecg_chunked(...)

Signature

downsample_ecg_chunked(
  p_pod_id uuid,
  p_time_start timestamptz,
  p_time_end timestamptz,
  p_factor integer DEFAULT 4,
  p_chunk_minutes integer DEFAULT 5,
  p_offset integer DEFAULT 0,
  p_limit integer DEFAULT 1000
)

Purpose:
Performs chunked downsampling over defined time windows (p_chunk_minutes). Returns a JSON array of decimated samples per chunk to support large interval queries.

Return Schema (table):

Column	Type	Description
chunk_start	timestamptz	Start of the time chunk
chunk_end	timestamptz	End of the time chunk
samples	jsonb	JSON array of downsampled samples in that chunk

1.27 get_clinic_analytics(...)

Signature

get_clinic_analytics(
  clinic_id uuid DEFAULT NULL
)

Purpose:
Returns high-level metrics about patients and studies for a given clinic (e.g., active vs. total).

Return Schema (table):

Column	Type	Description
totalpatients	bigint	Number of distinct patients
activepatients	bigint	Number of patients with an active study
totalstudies	bigint	Total number of studies
activestudies	bigint	Number of active (ongoing) studies

1.28 get_ecg_diagnostics_chunked(...)

Signature

get_ecg_diagnostics_chunked(
  p_pod_id uuid,
  p_time_start timestamptz,
  p_time_end timestamptz,
  p_chunk_minutes integer DEFAULT 5,
  p_offset integer DEFAULT 0,
  p_limit integer DEFAULT 1000
)

Purpose:
Returns diagnostic metrics (e.g., noise levels, connection stats) in JSON format for each defined time chunk.

Return Schema (table):

Column	Type	Description
chunk_start	timestamptz	Start of the time chunk
chunk_end	timestamptz	End of the time chunk
metrics	jsonb	JSON containing diagnostic metrics

1.29 merge_temp_ecg_data()

Signature

merge_temp_ecg_data()

Purpose:
Merges rows from a temporary ECG data table into the main ecg_sample table, handling upsert logic based on (time, pod_id).

Return:
void

1.30 get_weekly_active_studies()

Signature

get_weekly_active_studies()

Purpose:
Returns a time series of active studies per ISO week, typically within a recent interval (e.g., last 6 months).

Return Schema (table):

Column	Type	Description
week_start	date	Start date of the ISO week
active_study_count	bigint	Number of active studies initiated that week

1.31 get_weekly_avg_quality()

Signature

get_weekly_avg_quality()

Purpose:
Returns the average study quality fraction by ISO week for a recent interval.

Return Schema (table):

Column	Type	Description
week_start	date	Start date of the ISO week
average_quality	numeric	Mean quality (quality_minutes / total_minutes)

1.32 Database Monitoring Functions

1.32.1 get_database_stats

Return Type:
TABLE(stat_type text, rolname text, query text, calls bigint, total_time numeric, min_time numeric, max_time numeric, mean_time numeric, avg_rows numeric, prop_total_time text, hit_rate numeric)

Arguments:
None

Definition:

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

Function Type:
f

1.32.2 get_edge_function_stats

Return Type:
TABLE(function_name text, total_invocations bigint, success_rate numeric, average_duration_ms numeric, memory_usage bigint, cpu_time interval, peak_concurrent_executions bigint, last_invocation timestamp with time zone)

Arguments:
	•	p_function_name text
	•	p_time_start timestamp with time zone
	•	p_time_end timestamp with time zone

Definition:

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

Function Type:
f


2. Edge Functions

Edge Functions provide an HTTP interface to call the underlying SQL or business logic. Below are two examples:

2.1 downsample-ecg

Endpoint:
POST https://<project>.supabase.co/functions/v1/downsample-ecg

Request Body (JSON):

{
  "pod_id": "09753cf8-f1c5-4c80-b310-21d5fcb85401",
  "time_start": "2024-07-25T14:45:00Z",
  "time_end": "2024-07-27T14:49:00Z",
  "max_pts": 2000
}

Response:
An array of JSON objects containing downsampled ECG data. Internally, this calls the downsample_ecg (or a related variant) function.

2.2 peak-preserving-downsample-ecg

Endpoint:
POST https://<project>.supabase.co/functions/v1/peak-preserving-downsample-ecg

Request Body (JSON):

{
  "pod_id": "09753cf8-f1c5-4c80-b310-21d5fcb85401",
  "time_start": "2024-07-25T14:45:00Z",
  "time_end": "2024-07-27T14:49:00Z",
  "max_pts": 2000
}

Description:
Wraps the peak_preserving_downsample_ecg(...) function to ensure critical ECG peaks are retained during downsampling.

Response:
Returns an array of objects with fields corresponding to the database function’s output.

3. Tables Referenced

The functions above typically reference the following core tables:
	1.	study / study_readings: Contains study information, aggregated stats, and timestamps.
	2.	ecg_sample: Stores raw ECG data including time, channel values, and quality flags.
	3.	clinics, pod: Maintain clinic records and pod (device) statuses.

4. Notable Front-End Usage
	•	ECG Viewer / DataLab Pages:
Utilize functions like get_pod_days(...) and get_pod_earliest_latest(...) to determine query bounds, and aggregate_leads(...) for charting aggregated data.
	•	Study Lists / Overviews:
Functions such as get_study_list_with_earliest_latest(...) and get_studies_with_pod_times(...) support study listing and detail views.
	•	Clinic Dashboards:
Dashboard metrics are provided by various get_clinic_* functions (monthly/weekly stats, quality breakdowns, and overviews).
	•	Administrative / Analytics:
Functions like get_new_studies_and_growth(), get_weekly_active_studies(), get_weekly_avg_quality(), get_per_clinic_breakdown(), and the database monitoring functions support KPI tracking and system analytics.

