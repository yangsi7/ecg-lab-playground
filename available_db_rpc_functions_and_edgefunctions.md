## SUPABASE, RPC AND EDGEFUNCTION KNOWLEDGE BASE

# Available Database RPC Functions and Edge Functions for the Monitoring & Diagnostic Portal

This document merges the previously outlined RPC (Remote Procedure Call) functions with additional functions discovered in your database schema. We also add a new **Edge Function** example based on the style shown before.

---

## **1. Database RPC Functions**

Below is a comprehensive list of user-defined database functions (all listed as `public, yes` in your schema), including those previously described. Each subsection provides a **Signature**, a brief **Purpose**, and a **Return Schema** (if applicable).

> **Note**: Some functions are standard TimescaleDB/administrative routines (e.g., for chunk management, compression policies, etc.) and may not be central to your application’s business logic. Those are omitted here because they were listed as `public, no` in your CSV. Only those marked `public, yes` or explicitly relevant to your ECG/clinic flows are shown.

---

### 1.1 `aggregate_leads(...)`
**Signature**  
```sql
aggregate_leads(
  p_pod_id uuid,
  p_time_start timestamptz,
  p_time_end timestamptz,
  p_bucket_seconds integer
)

Purpose
Aggregates ECG lead data (e.g., quality, lead-on ratios) in time buckets.

Return Schema (table):

Column	Type	Description
time_bucket	timestamptz	Time bucket boundary start (UTC)
lead_on_p_1	float8	Positive lead-on ratio for channel 1
lead_on_p_2	float8	Positive lead-on ratio for channel 2
lead_on_p_3	float8	Positive lead-on ratio for channel 3
lead_on_n_1	float8	Negative lead-on ratio for channel 1
lead_on_n_2	float8	Negative lead-on ratio for channel 2
lead_on_n_3	float8	Negative lead-on ratio for channel 3
quality_1_percent	float8	Overall quality % for channel 1 in the bucket
quality_2_percent	float8	Overall quality % for channel 2
quality_3_percent	float8	Overall quality % for channel 3

1.2 downsample_ecg(...)

Signature

downsample_ecg(
  p_pod_id uuid,
  p_time_start timestamptz,
  p_time_end timestamptz,
  p_factor integer
)

Purpose
Returns a downsampled version of raw ECG data using a specific algorithm (e.g. picking every Nth sample or a more elaborate approach), including lead-on and quality booleans for each channel.

Return Schema (table):

Column	Type	Description
sample_time	timestamptz	UTC timestamp for the sample
downsampled_channel_1	real	Downsampled value for channel 1
downsampled_channel_2	real	Downsampled value for channel 2
downsampled_channel_3	real	Downsampled value for channel 3
lead_on_p_1	boolean	Positive lead-on status for channel 1
lead_on_p_2	boolean	Positive lead-on status for channel 2
lead_on_p_3	boolean	Positive lead-on status for channel 3
lead_on_n_1	boolean	Negative lead-on status for channel 1
lead_on_n_2	boolean	Negative lead-on status for channel 2
lead_on_n_3	boolean	Negative lead-on status for channel 3
quality_1	boolean	Quality boolean for channel 1
quality_2	boolean	Quality boolean for channel 2
quality_3	boolean	Quality boolean for channel 3

1.3 downsample_ecg_boxcar(...)

Signature

downsample_ecg_boxcar(
  p_pod_id uuid,
  p_time_start timestamptz,
  p_time_end timestamptz,
  p_factor integer
)

Purpose
Provides a “boxcar” based downsampling, which typically averages over small windows to reduce data volume while smoothing noise.

Return Schema (table):

Column	Type	Description
sample_time	timestamptz	Timestamp of the boxcar sample
downsampled_channel_1	real	Boxcar-averaged value for channel 1
downsampled_channel_2	real	Boxcar-averaged value for channel 2
downsampled_channel_3	real	Boxcar-averaged value for channel 3
lead_on_p_1	boolean	Positive lead-on status for channel 1
lead_on_p_2	boolean	Positive lead-on status for channel 2
lead_on_p_3	boolean	Positive lead-on status for channel 3
lead_on_n_1	boolean	Negative lead-on status for channel 1
lead_on_n_2	boolean	Negative lead-on status for channel 2
lead_on_n_3	boolean	Negative lead-on status for channel 3
quality_1	boolean	Quality boolean for channel 1
quality_2	boolean	Quality boolean for channel 2
quality_3	boolean	Quality boolean for channel 3

1.4 downsample_ecg_naive(...)

Signature

downsample_ecg_naive(
  p_pod_id uuid,
  p_time_start timestamptz,
  p_time_end timestamptz,
  p_factor integer
)

Purpose
A simpler, naive approach to downsampling (likely picking every Nth sample directly).

Return Schema
Identical structure to downsample_ecg_boxcar(...), except the method of picking data is naive:

Column	Type	Description
…	…	(Same columns as downsample_ecg_boxcar)

1.5 peak_preserving_downsample_ecg(...)

Signature

peak_preserving_downsample_ecg(
  p_pod_id uuid,
  p_time_start timestamptz,
  p_time_end timestamptz,
  p_max_pts integer
)

Purpose
Downsampling that preserves local maxima/minima so that crucial ECG peaks (QRS complexes, etc.) are not lost.

Return Schema (table):

Column	Type	Description
sample_time	timestamptz	UTC timestamp for the sample
downsampled_channel_1	real	Peak-preserving downsampled value for channel 1
downsampled_channel_2	real	Peak-preserving downsampled value for channel 2
downsampled_channel_3	real	Peak-preserving downsampled value for channel 3
lead_on_p_1	boolean	Positive lead-on status for channel 1
lead_on_p_2	boolean	Positive lead-on status for channel 2
lead_on_p_3	boolean	Positive lead-on status for channel 3
lead_on_n_1	boolean	Negative lead-on status for channel 1
lead_on_n_2	boolean	Negative lead-on status for channel 2
lead_on_n_3	boolean	Negative lead-on status for channel 3
quality_1	boolean	Quality indicator for channel 1
quality_2	boolean	Quality indicator for channel 2
quality_3	boolean	Quality indicator for channel 3

1.6 get_study_list_with_earliest_latest(...)

Signature

get_study_list_with_earliest_latest(
  p_search text DEFAULT NULL,
  p_offset integer DEFAULT 0,
  p_limit integer DEFAULT 25
)

	Some earlier definitions used p_pod_id; the modern version may incorporate search/offset/limit.

Purpose
Lists studies (optionally filtered or paginated), including each study’s earliest and latest ECG data times from its associated pod.

Return Schema (table):

Column	Type	Description
study_id	uuid	Study identifier
pod_id	uuid	Pod ID used in the study
start_timestamp	timestamptz	Official start time
end_timestamp	timestamptz	Official end time
earliest_time	timestamptz	Earliest actual data time
latest_time	timestamptz	Latest actual data time
total_count	bigint	Total matching rows for pagination

1.7 get_pod_days(...)

Signature

get_pod_days(
  p_pod_id uuid
)

Purpose
Returns a list of distinct dates (UTC) for which the specified pod has data.

Return Schema (table):

Column	Type	Description
day_value	date	A date with available data

1.8 get_pod_earliest_latest(...)

Signature

get_pod_earliest_latest(
  p_pod_id uuid
)

Purpose
Finds the overall earliest and latest recorded timestamps for a given pod.

Return Schema (table):

Column	Type	Description
earliest_time	timestamptz	Earliest data timestamp for the pod (UTC)
latest_time	timestamptz	Latest data timestamp for the pod (UTC)

1.9 get_studies_with_pod_times(...)

Signature

get_studies_with_pod_times()

Purpose
Returns an expanded list of studies across pods/clinics, with aggregated metrics and earliest/latest times if available.

Return Schema (table):

Column	Type	Description
study_id	uuid	Study unique identifier
clinic_id	uuid	Associated clinic ID
pod_id	uuid	Device/pod UUID
user_id	text	The user/wearer ID
aggregated_quality_minutes	integer	Summed “quality” minutes
aggregated_total_minutes	integer	Summed total minutes of data
duration	integer	Duration in days (or hours)
end_timestamp	timestamptz	Scheduled end time
expected_end_timestamp	timestamptz	Estimated or alternate end time
start_timestamp	timestamptz	Official study start
study_type	text	Type of study (Holter, MCT, etc.)
updated_at	timestamptz	Last update
created_at	timestamptz	Creation timestamp
created_by	text	Who created the record
earliest_time	timestamptz	Earliest actual data in that study’s timeframe
latest_time	timestamptz	Latest actual data in that study’s timeframe
clinic_name	text	The name of the clinic
pod_status	text	Status of the pod or study

1.10 get_study_details_with_earliest_latest(...)

Signature

get_study_details_with_earliest_latest(
  p_study_id uuid
)

Purpose
Retrieves a single study’s detailed info, plus earliest/latest data times from the associated pod.

Return Schema (table):

Column	Type	Description
study_id	uuid	Study identifier
clinic_id	uuid	Clinic identifier
pod_id	uuid	Pod ID for the device used in the study
start_timestamp	timestamptz	Official scheduled start of the study
end_timestamp	timestamptz	Official scheduled end of the study
earliest_time	timestamptz	Earliest data point for the study’s actual recording
latest_time	timestamptz	Latest data point for the study’s actual recording

1.11 get_study_diagnostics(...)

Signature

get_study_diagnostics(
  p_study_id uuid
)

Purpose
Returns diagnostic metrics about a single study (e.g., variability in quality fraction, number of interruptions, etc.).

Return Schema (table):

Column	Type	Description
study_id	uuid	Study identifier
quality_fraction_variability	numeric	Variation statistic for the “quality fraction” over time
total_minute_variability	numeric	Variation in total recorded minutes across segments/time buckets
interruptions	integer	Number of significant data interruptions
bad_hours	integer	Hours flagged as poor-quality or insufficient data

1.12 update_study_minutes(...)

Signature

update_study_minutes()
  RETURNS trigger

Purpose
A trigger function that updates a study’s “aggregated” or “quality” minutes whenever relevant row changes happen (details of logic not fully shown).

Return
trigger — modifies the underlying table row(s) as needed.

1.13 get_clinic_monthly_quality(...)

Signature

get_clinic_monthly_quality(
  _clinic_id uuid
)

Purpose
Returns monthly average quality metrics for a given clinic.

Return Schema (table):

Column	Type	Description
month_start	date	The start date of the month
average_quality	numeric	The average quality metric for that month

1.14 get_clinic_monthly_studies(...)

Signature

get_clinic_monthly_studies(
  _clinic_id uuid
)

Purpose
Returns monthly count of open studies for a clinic.

Return Schema (table):

Column	Type	Description
month_start	date	The start of the month
open_studies	int	Number of open studies in that month

1.15 get_clinic_overview(...)

Signature

get_clinic_overview(
  _clinic_id uuid
)

Purpose
Retrieves an overview of active/total studies, average quality hours, and any recent alerts (as JSON) for a clinic dashboard.

Return Schema (table):

Column	Type	Description
active_studies	int	Number of active studies
total_studies	int	Total studies in the clinic
average_quality_hours	numeric	Average hours with good-quality data
recent_alerts	json	JSON structure of recent alerts

1.16 get_clinic_quality_breakdown(...)

Signature

get_clinic_quality_breakdown(
  _clinic_id uuid DEFAULT NULL
)

Purpose
Returns an aggregated quality breakdown for each clinic (or for a specific clinic if _clinic_id is passed).

Return Schema (table):

Column	Type	Description
clinic_id	uuid	The clinic ID
clinic_name	text	The clinic’s name
total_studies	int	Total count of studies
open_studies	int	Open (ongoing) studies count
average_quality	numeric	Overall average quality rating
good_count	int	# of studies with “good” quality
soso_count	int	# of studies with “so-so” quality
bad_count	int	# of studies with “bad” quality
critical_count	int	# of studies flagged as critical

	Overload: The CSV shows a variant that takes no arguments. That version presumably returns a breakdown for all clinics.

1.17 get_clinic_status_breakdown(...)

Signature

get_clinic_status_breakdown(
  _clinic_id uuid DEFAULT NULL
)

Purpose
Returns summary counts of a clinic’s studies by different statuses (e.g., closed, intervene, monitor, on_target, etc.).

Return Schema (table):

Column	Type	Description
clinic_id	uuid	The clinic’s ID
clinic_name	text	The clinic name
total_studies	int	All studies in the clinic
open_studies	int	# of open or ongoing studies
closed	int	# of closed/completed studies
intervene_count	int	# requiring direct intervention
monitor_count	int	# currently in a watch/monitor state
on_target_count	int	# on track
near_completion_count	int	# approaching study end
needs_extension_count	int	# requiring extension or time adjustment

	Overload: A version without _clinic_id returns data for all clinics combined.

1.18 get_clinic_weekly_quality(...)

Signature

get_clinic_weekly_quality(
  _clinic_id uuid
)

Purpose
Provides weekly average quality metrics for a given clinic.

Return Schema (table):

Column	Type	Description
week_start	date	The start date of the week
average_quality	numeric	Average quality for that week

	Overload: Another version returns a breakdown of (clinic_id, clinic_name, week_start, average_quality) if no _clinic_id is provided or if it’s used differently.

1.19 get_clinic_weekly_studies(...)

Signature

get_clinic_weekly_studies(
  _clinic_id uuid
)

Purpose
Returns weekly counts of open studies for a clinic.

Return Schema (table):

Column	Type	Description
week_start	date	The date marking the start of week
open_studies	int	Number of open studies that week

1.20 get_earliest_latest_for_pod(...)

Signature

get_earliest_latest_for_pod(
  p_pod_id uuid
)

Purpose
Similar to get_pod_earliest_latest(...); returns earliest and latest data times for a single pod.

Return Schema (table):

Column	Type	Description
earliest_time	timestamptz	Pod’s earliest data time
latest_time	timestamptz	Pod’s latest data time

(Possibly an older or alternate version to unify with get_pod_earliest_latest.)

1.21 get_new_studies_and_growth()

Signature

get_new_studies_and_growth()

Purpose
A high-level metric returning total new studies and a growth percentage (likely used for a dashboard KPI).

Return Schema (table):

Column	Type	Description
new_studies	bigint	Count of newly created studies
growth_percent	numeric	Growth percentage (comparing some timeframe)

1.22 get_per_clinic_breakdown()

Signature

get_per_clinic_breakdown()

Purpose
Returns aggregated stats of active studies, intervention needed, etc., per clinic.

Return Schema (table):

Column	Type	Description
clinic_id	uuid	The clinic’s ID
clinic_name	varchar	Clinic name
total_active_studies	bigint	Count of active studies
intervene_count	bigint	Count of studies requiring intervention
monitor_count	bigint	Count of studies in monitoring state
on_target_count	bigint	Count of studies on target
average_quality	numeric	Average quality across those studies

1.23 get_quality_threshold(...)

Signature

get_quality_threshold(
  threshold double precision
)

Purpose
Potentially returns an integer representing a threshold-based classification or index for a given numeric threshold.

Return
	•	integer

(Exact logic not shown.)

1.24 get_studies_with_aggregates(...)

Signature

get_studies_with_aggregates()

Purpose
Returns a list of studies plus aggregated quality/total minutes, earliest/latest times, and the associated clinic name.

Return Schema (table):

Column	Type	Description
study_id	uuid	Study ID
study_type	varchar	Type of study
clinic_id	uuid	Associated clinic
user_id	varchar	The user ID for the study
aggregated_quality_minutes	numeric	Sum of quality minutes
aggregated_total_minutes	numeric	Sum of total minutes
earliest_time	timestamp w/o tz	Earliest data time
latest_time	timestamp w/o tz	Latest data time
clinic_name	text	Name of the clinic

1.25 update_study_minutes (already listed as 1.12)

(Trigger function – repeated mention.)

2. Edge Functions

Edge Functions provide an HTTP interface to perform computations or queries, returning JSON responses. You can deploy them on Supabase’s edge runtime. Below are two examples.

2.1 downsample-ecg (Existing Example)

Endpoint

POST https://<project>.supabase.co/functions/v1/downsample-ecg

Request Body (JSON):

{
  "pod_id": "09753cf8-f1c5-4c80-b310-21d5fcb85401",
  "time_start": "2024-07-25T14:45:00Z",
  "time_end":   "2024-07-27T14:49:00Z",
  "max_pts": 2000
}

Response
	•	An array of JSON objects with downsampled channel values and lead-on booleans.

2.2 peak-preserving-downsample-ecg (New Example)

Endpoint

POST https://<project>.supabase.co/functions/v1/peak-preserving-downsample-ecg

Request Body (JSON):

{
  "pod_id": "string, e.g. '09753cf8-f1c5-4c80-b310-21d5fcb85401'",
  "time_start": "string, e.g. '2024-07-25T14:45:00Z'",
  "time_end": "string, e.g. '2024-07-27T14:49:00Z'",
  "max_pts": 2000
}

Description
	•	Similar to downsample-ecg, but employs a peak-preserving method. This ensures ECG wave peaks (e.g., R-peaks) are not lost during downsampling.

Response
An array of objects with fields identical (in naming) to the DB function’s return columns, for example:

[
  {
    "sample_time":          "2024-07-25T14:45:00Z",
    "downsampled_channel_1": 0.0123,
    "downsampled_channel_2": 0.0120,
    "downsampled_channel_3": -0.0105,
    "lead_on_p_1":           true,
    "lead_on_p_2":           false,
    "lead_on_p_3":           true,
    "lead_on_n_1":           false,
    "lead_on_n_2":           false,
    "lead_on_n_3":           false,
    "quality_1":             true,
    "quality_2":             true,
    "quality_3":             true
  },
  ...
]

	Typically invoked by front-end dashboards or client apps that require waveform data with preserved ECG peaks.

3. Tables Referenced
```
Many of these functions rely on underlying tables such as:
	1.	Studies (columns: study_id, clinic_id, pod_id, user_id, start_timestamp, end_timestamp, etc.)
	2.	ECG Raw Data (e.g., storing timestamps, channel values, lead/quality columns)
	3.	Clinic / User references (for clinic_name, etc.)

4. Notable Front-End Usage
	•	ECG Viewer or DataLab pages:
	•	get_pod_days(...), get_pod_earliest_latest(...) for listing or bounding data.
	•	aggregate_leads(...) for aggregated daily/hourly bars.
	•	Edge Functions (downsample-ecg, peak-preserving-downsample-ecg) to fetch waveforms efficiently.
	•	Study Lists / Overviews:
	•	get_study_list_with_earliest_latest(...), get_studies_with_pod_times(...) for populating tables of studies.
	•	Clinic Dashboards:
	•	get_clinic_* functions for monthly/weekly stats, breakdowns, or overview metrics.
	•	Admin / Analytics:
	•	get_new_studies_and_growth(), get_per_clinic_breakdown(), get_studies_with_aggregates().

5. In Summary
	1.	Database RPC Functions
	•	Cover a wide range of ECG data downsampling, aggregator queries, and clinic/study dashboards.
	•	Return either tabular sets (as in Timescale/Postgres) or single-value triggers.
	2.	Edge Functions
	•	Provide an HTTP interface to the same data/logic.
	•	downsample-ecg and peak-preserving-downsample-ecg can wrap different downsampling methods to deliver waveforms to front-end apps.

These expansions show how your system aggregates, down-samples, and presents ECG data across multiple clinics, pods, and studies, supporting near real-time and historical analytics.

(end of expanded/merged documentation)

JSON Version

To  find a JSON representation of the same expanded documentation, look for `supabase_rpc_edge_functions.json`. Each function has keys for name, signature, purpose, and return_schema. Edge Functions are listed separately.
```
