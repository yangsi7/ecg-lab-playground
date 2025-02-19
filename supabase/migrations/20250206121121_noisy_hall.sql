/*
  # Update ECG downsampling function
  
  1. Changes
    - Drop existing function first to allow return type change
    - Recreate function with proper column names and types
    - Quote "time" column name since it's a reserved keyword
*/

DROP FUNCTION IF EXISTS downsample_ecg(uuid, timestamptz, timestamptz, integer);

CREATE FUNCTION downsample_ecg(
  p_id uuid,
  t_start timestamptz,
  t_end timestamptz,
  max_pts integer DEFAULT 5000
) RETURNS TABLE (
  "time" timestamptz,
  channel_1 real,
  channel_2 real,
  channel_3 real,
  lead_on_p_1 boolean,
  lead_on_p_2 boolean,
  lead_on_p_3 boolean,
  lead_on_n_1 boolean,
  lead_on_n_2 boolean,
  lead_on_n_3 boolean,
  quality_1 boolean,
  quality_2 boolean,
  quality_3 boolean
) LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_points integer;
  step_size integer;
BEGIN
  -- Get total number of points in range
  SELECT COUNT(*)
  INTO total_points
  FROM ecg_sample
  WHERE pod_id = p_id
    AND "time" >= t_start
    AND "time" <= t_end;

  -- Calculate step size for downsampling
  step_size := GREATEST(1, (total_points / NULLIF(max_pts, 0))::integer);

  RETURN QUERY
  WITH numbered_rows AS (
    SELECT 
      "time",
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
      ROW_NUMBER() OVER (ORDER BY "time") as rn
    FROM ecg_sample
    WHERE pod_id = p_id
      AND "time" >= t_start
      AND "time" <= t_end
  )
  SELECT 
    "time",
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
    quality_3
  FROM numbered_rows
  WHERE rn % step_size = 0
  ORDER BY "time"
  LIMIT LEAST(max_pts, total_points);
END;
$$;

-- Enable Row Level Security
alter table public.study enable row level security;
alter table public.pod enable row level security;
alter table public.ecg_sample enable row level security;
alter table public.clinics enable row level security;
alter table public.study_readings enable row level security;

-- Create downsample_ecg function
create or replace function public.downsample_ecg(
  p_pod_id uuid,
  p_time_start timestamptz,
  p_time_end timestamptz,
  p_factor integer default 4
)
returns table (
  sample_time timestamptz,
  downsampled_channel_1 real,
  downsampled_channel_2 real,
  downsampled_channel_3 real,
  lead_on_p_1 boolean,
  lead_on_p_2 boolean,
  lead_on_p_3 boolean,
  lead_on_n_1 boolean,
  lead_on_n_2 boolean,
  lead_on_n_3 boolean,
  quality_1 boolean,
  quality_2 boolean,
  quality_3 boolean
)
language sql
security definer
as $$
  -- Clamp factor between 1 and 4 (320Hz to 80Hz)
  with params as (
    select
      greatest(1, least(4, p_factor)) as factor
  ),
  -- Get row number for each sample to pick every Nth row
  numbered_samples as (
    select
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
      row_number() over (order by time) as rn
    from
      public.ecg_sample
    where
      pod_id = p_pod_id
      and time between p_time_start and p_time_end
  )
  select
    time as sample_time,
    channel_1 as downsampled_channel_1,
    channel_2 as downsampled_channel_2,
    channel_3 as downsampled_channel_3,
    lead_on_p_1,
    lead_on_p_2,
    lead_on_p_3,
    lead_on_n_1,
    lead_on_n_2,
    lead_on_n_3,
    quality_1,
    quality_2,
    quality_3
  from
    numbered_samples,
    params
  where
    rn % params.factor = 0
  order by
    time;
$$;

-- Create aggregate_leads function
create or replace function public.aggregate_leads(
  p_pod_id uuid,
  p_time_start timestamptz,
  p_time_end timestamptz,
  p_bucket_seconds integer
)
returns table (
  time_bucket timestamptz,
  lead_on_p_1 float8,
  lead_on_p_2 float8,
  lead_on_p_3 float8,
  lead_on_n_1 float8,
  lead_on_n_2 float8,
  lead_on_n_3 float8,
  quality_1_percent float8,
  quality_2_percent float8,
  quality_3_percent float8
)
language sql
security definer
as $$
  select
    time_bucket(p_bucket_seconds * '1 second'::interval, time) as time_bucket,
    avg(case when lead_on_p_1 then 1.0 else 0.0 end) as lead_on_p_1,
    avg(case when lead_on_p_2 then 1.0 else 0.0 end) as lead_on_p_2,
    avg(case when lead_on_p_3 then 1.0 else 0.0 end) as lead_on_p_3,
    avg(case when lead_on_n_1 then 1.0 else 0.0 end) as lead_on_n_1,
    avg(case when lead_on_n_2 then 1.0 else 0.0 end) as lead_on_n_2,
    avg(case when lead_on_n_3 then 1.0 else 0.0 end) as lead_on_n_3,
    avg(case when quality_1 then 100.0 else 0.0 end) as quality_1_percent,
    avg(case when quality_2 then 100.0 else 0.0 end) as quality_2_percent,
    avg(case when quality_3 then 100.0 else 0.0 end) as quality_3_percent
  from
    public.ecg_sample
  where
    pod_id = p_pod_id
    and time between p_time_start and p_time_end
  group by
    time_bucket
  order by
    time_bucket;
$$;

-- Create get_pod_days function
create or replace function public.get_pod_days(
  p_pod_id uuid
)
returns table (
  day_value date
)
language sql
security definer
as $$
  select distinct
    date_trunc('day', time)::date as day_value
  from
    public.ecg_sample
  where
    pod_id = p_pod_id
  order by
    day_value;
$$;

-- Create get_pod_earliest_latest function
create or replace function public.get_pod_earliest_latest(
  p_pod_id uuid
)
returns table (
  earliest_time timestamptz,
  latest_time timestamptz
)
language sql
security definer
as $$
  select
    min(time) as earliest_time,
    max(time) as latest_time
  from
    public.ecg_sample
  where
    pod_id = p_pod_id;
$$;

-- Create get_study_details_with_earliest_latest function
create or replace function public.get_study_details_with_earliest_latest(
  p_study_id uuid
)
returns table (
  study_id uuid,
  clinic_id uuid,
  pod_id uuid,
  start_timestamp timestamptz,
  end_timestamp timestamptz,
  earliest_time timestamptz,
  latest_time timestamptz
)
language sql
security definer
as $$
  select
    s.study_id,
    s.clinic_id,
    s.pod_id,
    s.start_timestamp,
    s.end_timestamp,
    min(e.time) as earliest_time,
    max(e.time) as latest_time
  from
    public.study s
    left join public.ecg_sample e on s.pod_id = e.pod_id
  where
    s.study_id = p_study_id
  group by
    s.study_id,
    s.clinic_id,
    s.pod_id,
    s.start_timestamp,
    s.end_timestamp;
$$;
