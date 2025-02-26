## SUPABASE, RPC AND EDGE FUNCTION KNOWLEDGE BASE

This document provides a consolidated reference for all public, user-defined database functions (RPC) and Edge Functions available in your Supabase/Postgres environment. The focus is on functions that support ECG/clinic workflows, including data aggregation, downsampling, study analytics, and temporary data staging. Administrative or TimescaleDB-specific routines are noted separately where applicable.

---

### RETRIEVE FUNCTION INFO

Use the following query to retrieve function information:

```sql
SELECT * FROM get_rpc_function_info('FUNCTION_NAME');

Returns:

TABLE(
    function_name text,
    return_type text,
    arguments text,
    definition text,
    function_type text
)

1. Database RPC Functions

Below is the comprehensive list of RPC functions. Each entry includes the function signature, purpose, return schema (if applicable), and any additional notes.

1.1 aggregate_leads(...)

Signature:

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

Signature:

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

Signature:

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

Signature:

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

Signature:

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

Signature:

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
total_count	bigint	Total matching rows

1.7 get_pod_days(...)

Signature:

get_pod_days(
  p_pod_id uuid
)

Purpose:
Returns a list of distinct UTC dates for which data exists for the specified pod.

Return Schema (table):

Column	Type	Description
day_value	date	Available day

1.8 get_pod_earliest_latest(...)

Signature:

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

Signature:

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

Signature:

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

Signature:

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
bad_hours	integer	Hours flagged as poor or insufficient quality

1.12 update_study_minutes(...)

Signature:

update_study_minutes()
  RETURNS trigger

Purpose:
Trigger function to update aggregated or quality minutes on a study record when underlying data changes.

Return:
Trigger (modifies the study row as needed).

1.13 get_clinic_monthly_quality(...)

Signature:

get_clinic_monthly_quality(
  _clinic_id uuid
)

(Implementation may differ; see DB for possible overloads. The current environment also has a variant with no arguments returning multiple clinics’ data.)

Purpose:
Calculates the monthly average quality metrics for clinics.

Return Schema (table):

Column	Type	Description
month_start	date	Start date of the month
average_quality	numeric	Average quality metric or percentage

1.14 get_clinic_monthly_studies(...)

Signature:

get_clinic_monthly_studies(
  _clinic_id uuid
)

(Implementation may differ; see DB for possible overloads. The current environment also has a variant with no arguments returning data for multiple clinics.)

Purpose:
Returns the monthly count of open studies for a clinic (or multiple clinics).

Return Schema (table):

Column	Type	Description
month_start	date	Start date of the month
open_studies	int	Number of open studies that month

1.15 get_clinic_overview(...)

Signature:

get_clinic_overview(
  _clinic_id uuid
)

(Implementation may differ; see DB for possible overloads. The current environment also has a variant with no arguments returning multiple clinics’ data.)

Purpose:
Provides a dashboard overview for a clinic, including active/total studies, average quality hours, and recent alerts.

Return Schema (table):

Column	Type	Description
active_studies	int	Number of active studies
total_studies	int	Total studies in the clinic
average_quality_hours	numeric	Average hours of good-quality data
recent_alerts	json	JSON array of recent alerts/warnings

1.16 get_clinic_quality_breakdown(...)

Signature:

get_clinic_quality_breakdown()

(Implementation may differ; see DB for possible overloads. Some variants accept a clinic ID.)

Purpose:
Provides a quality breakdown for each clinic (or for a single clinic), including counts of studies by quality category.

Return Schema (table):

Column	Type	Description
clinic_id	uuid	Clinic ID
clinic_name	text	Clinic name
total_studies	int	Total studies in the clinic
open_studies	int	Number of ongoing studies
average_quality	numeric	Overall average quality rating
good_count	int	Count of studies with quality ≥ 0.7
soso_count	int	Count of studies with quality in [0.5, 0.7)
bad_count	int	Count of studies with quality in [0.3, 0.5)
critical_count	int	Count of studies with quality < 0.3

1.17 get_clinic_status_breakdown(...)

Signature:

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

Signature:

get_clinic_weekly_quality(
  _clinic_id uuid
)

(Implementation may differ; there may be a no-arg version returning data for all clinics.)

Purpose:
Provides the weekly average quality metric for a clinic.

Return Schema (table):

Column	Type	Description
week_start	date	Start date of the week
average_quality	numeric	Average quality for that week

1.19 get_clinic_weekly_studies(...)

Signature:

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

Signature:

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

Signature:

get_new_studies_and_growth()

Purpose:
Returns the total count of new studies over a recent interval along with a growth percentage for KPI dashboards.

Return Schema (table):

Column	Type	Description
new_studies	bigint	Number of newly created studies
growth_percent	numeric	Growth percentage vs. the prior period

1.22 get_per_clinic_breakdown()

Signature:

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

Signature:

get_quality_threshold(
  threshold double precision
)

Purpose:
Returns an integer classification/index for a provided quality threshold.

1.24 downsample_ecg_chunked(...)

Signature:

downsample_ecg_chunked(
  p_pod_id text,
  p_time_start text,
  p_time_end text,
  p_factor integer DEFAULT NULL,
  p_chunk_minutes integer DEFAULT NULL,
  p_offset integer DEFAULT NULL,
  p_limit integer DEFAULT NULL
)

Purpose:
Performs chunked ECG downsampling, splitting the specified time range into chunks (each up to p_chunk_minutes long). For each chunk, returns an array of downsampled samples (decimation factor = p_factor).

Return Schema (table):

Column	Type	Description
chunk_start	text	UTC timestamp (string) for chunk start
chunk_end	text	UTC timestamp (string) for chunk end
samples	json	Array of downsampled samples + lead/quality info

1.25 get_ecg_diagnostics_chunked(...)

Signature:

get_ecg_diagnostics_chunked(
  p_pod_id text,
  p_time_start text,
  p_time_end text,
  p_chunk_minutes integer DEFAULT NULL,
  p_offset integer DEFAULT NULL,
  p_limit integer DEFAULT NULL
)

Purpose:
Retrieves ECG diagnostic metrics (quality, lead-on ratios, etc.) chunk by chunk.

Return Schema (table):

Column	Type	Description
chunk_start	text	UTC timestamp (string) for chunk start
chunk_end	text	UTC timestamp (string) for chunk end
metrics	json	JSON object of diagnostic metrics per chunk

1.26 get_study_hourly_metrics(...)

Signature:

get_study_hourly_metrics(
  p_study_id uuid
)

Purpose:
Returns hourly metrics for a given study, including reading counts and total vs. quality minutes per hour of day.

Return Schema (table):

Column	Type	Description
hour_of_day	int	Hour of the day (0–23)
reading_count	int	Number of ECG readings
total_minutes	int	Total recorded minutes
quality_minutes	int	Minutes flagged as good quality

1.27 get_clinic_table_stats()

Signature:

get_clinic_table_stats()

Here’s the updated description for the `get_clinic_combined_stats()` function based on the request:

---

### get_clinic_combined_stats()

**Purpose**:  
Returns extended metrics per clinic, including total and open studies, average quality, quality-hours, and alerts. This function provides a detailed overview of clinic performance, study progress, and data quality, enabling administrators to monitor and manage clinic activities effectively.

**Return Schema (Table)**:

| Column                  | Type    | Description                                                                 |
|-------------------------|---------|-----------------------------------------------------------------------------|
| `clinic_id`             | uuid    | Unique identifier of the clinic.                                            |
| `clinic_name`           | text    | Name of the clinic.                                                         |
| `total_studies`         | int     | Total number of studies associated with the clinic.                         |
| `open_studies`          | int     | Number of ongoing studies (not yet completed).                              |
| `average_quality`       | numeric | Overall average quality fraction across all studies in the clinic.          |
| `good_count`            | int     | Count of studies with quality fraction ≥ 0.7.                               |
| `soso_count`            | int     | Count of studies with quality fraction in [0.5, 0.7).                       |
| `bad_count`             | int     | Count of studies with quality fraction in [0.3, 0.5).                       |
| `critical_count`        | int     | Count of studies with quality fraction < 0.3.                               |
| `average_quality_hours` | numeric | Average hours of good-quality data across all studies.                      |
| `recent_alerts`         | json    | JSON array of alerts or warnings from the past 7 days.                      |
| `intervene_count`       | int     | Number of open studies requiring intervention (quality fraction < 0.5).     |
| `monitor_count`         | int     | Number of open studies to monitor (quality fraction in [0.5, 0.6]).         |
| `on_target_count`       | int     | Number of open studies on target (quality fraction > 0.6).                  |
| `near_completion_count` | int     | Number of open studies near completion (within 24 hours and quality ≥ 0.5). |
| `needs_extension_count` | int     | Number of open studies needing extension (within 24 hours and quality < 0.5).|
| `completed_count`       | int     | Number of studies completed on or after their expected end timestamp.       |
| `extended_count`        | int     | Number of studies that ended after their expected end timestamp.            |

**Notes**:  
- The **quality fraction** is calculated as `aggregated_quality_minutes / aggregated_total_minutes`.  
- Study statuses such as "completed" and "extended" are determined using a fixed reference date ('2024-12-18').  
- The `recent_alerts` column aggregates alerts from the past 7 days, including details like study ID, status, and creation timestamp.  


1.28 get_clinic_analytics()

Signature:

get_clinic_analytics()

Purpose:
Provides high-level counts of patients and studies across clinics (for dashboards or quick summary).

Return Schema (table):

Column	Type	Description
totalpatients	number	Total number of patients/wearers
activepatients	number	Currently active/monitored patients
totalstudies	number	Total studies across all clinics
activestudies	number	Studies currently in progress
clinic_id	text	Associated clinic UUID

1.29 get_edge_function_stats(...)

Signature:

get_edge_function_stats(
  p_function_name text DEFAULT NULL,
  p_time_start text DEFAULT NULL,
  p_time_end text DEFAULT NULL
)

Purpose:
Retrieves usage statistics for an edge function, including total invocations, success rate, average duration, memory usage, CPU time, and concurrency.

Return Schema (table):

Column	Type	Description
function_name	text	Name of the edge function
total_invocations	number	Count of total invocations
success_rate	number	Ratio or percentage of successful calls
average_duration_ms	number	Average execution time in milliseconds
memory_usage	number	Average memory usage (bytes or relevant unit)
cpu_time	unknown	CPU time usage (internal format)
peak_concurrent_executions	number	Peak concurrency
last_invocation	text	Timestamp of the most recent invocation

1.30 get_database_stats()

Signature:

get_database_stats()

Purpose:
Returns query usage/performance stats for the database, covering calls, times, and other metrics.

Return Schema (table):

Column	Type	Description
stat_type	text	Category of the stat
rolname	text	Role under which the query was executed
query	text	Query text (truncated or hashed)
calls	number	Number of invocations
total_time	number	Total execution time (ms)
min_time	number	Minimum execution time (ms)
max_time	number	Maximum execution time (ms)
mean_time	number	Mean execution time (ms)
avg_rows	number	Average rows returned
prop_total_time	text	Proportion of total time vs. all queries
hit_rate	number	Cache/buffer hit rate for these queries

1.31 rpccallinfo()

Signature:

rpccallinfo()

Purpose:
Returns metadata about RPC calls (similar to get_rpc_function_info), e.g. name, return type, arguments, etc.

Return Schema (table):

Column	Type	Description
function_name	text	RPC function name
return_type	text	Function return type
arguments	text	Argument signature
definition	text	Underlying definition
function_type	text	Classification (normal, trigger, etc.)

1.32 get_telemetry_report()

Signature:

get_telemetry_report()

Purpose:
Retrieves a JSON blob of telemetry or usage data for analytics.

Return:
Single JSON object with telemetry details.

1.33 merge_temp_ecg_data()

Signature:

merge_temp_ecg_data()

Purpose:
Merges staged ECG data from a temporary table into the main ECG storage. Often used after bulk inserts or partial uploads.

Return:
No direct return; merges data as a side effect.

2. Edge Functions

(No specific named Edge Functions are enumerated here beyond those measured by get_edge_function_stats. If additional custom Edge Functions exist, list them below similarly.)

End of Document.

