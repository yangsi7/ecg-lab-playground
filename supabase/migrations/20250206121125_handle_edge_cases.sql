-- Create helper function for safe text handling
create or replace function public.coalesce_text(
  value text,
  default_value text default 'Unknown'
)
returns text
language sql
immutable
security definer
set search_path = public
as $$
  select coalesce(value, default_value);
$$;

-- Create helper function for safe numeric handling
create or replace function public.coalesce_numeric(
  value numeric,
  default_value numeric default 0
)
returns numeric
language sql
immutable
security definer
set search_path = public
as $$
  select coalesce(value, default_value);
$$;

-- Create helper function for safe array handling
create or replace function public.coalesce_array(
  value anyarray,
  default_value anyarray
)
returns anyarray
language sql
immutable
security definer
set search_path = public
as $$
  select coalesce(value, default_value);
$$;

-- Create helper function for safe JSON handling
create or replace function public.coalesce_json(
  value json,
  default_value json default '{}'::json
)
returns json
language sql
immutable
security definer
set search_path = public
as $$
  select coalesce(value, default_value);
$$;

-- Create helper function for safe JSONB handling
create or replace function public.coalesce_jsonb(
  value jsonb,
  default_value jsonb default '{}'::jsonb
)
returns jsonb
language sql
immutable
security definer
set search_path = public
as $$
  select coalesce(value, default_value);
$$;

-- Create helper view for safe pod data access
create or replace view public.safe_pod_view as
select
  id,
  public.coalesce_text(assigned_study_id) as assigned_study_id,
  public.coalesce_text(assigned_user_id) as assigned_user_id,
  public.coalesce_text(status, 'unknown') as status,
  public.coalesce_numeric(time_since_first_use, 0) as time_since_first_use
from
  public.pod;

-- Create helper view for safe study data access
create or replace view public.safe_study_view as
select
  study_id,
  public.coalesce_text(clinic_id) as clinic_id,
  public.coalesce_text(pod_id) as pod_id,
  public.coalesce_text(created_by) as created_by,
  public.coalesce_text(study_type, 'unknown') as study_type,
  public.coalesce_numeric(duration, 0) as duration,
  public.coalesce_numeric(aggregated_quality_minutes, 0) as aggregated_quality_minutes,
  public.coalesce_numeric(aggregated_total_minutes, 0) as aggregated_total_minutes,
  coalesce(start_timestamp, now()) as start_timestamp,
  coalesce(end_timestamp, now()) as end_timestamp,
  coalesce(expected_end_timestamp, now()) as expected_end_timestamp,
  coalesce(created_at, now()) as created_at,
  coalesce(updated_at, now()) as updated_at
from
  public.study;

-- Create helper view for safe clinic data access
create or replace view public.safe_clinic_view as
select
  id,
  public.coalesce_text(name, 'Unnamed Clinic') as name
from
  public.clinics;

-- Create helper view for safe study readings access
create or replace view public.safe_study_readings_view as
select
  id,
  study_id,
  public.coalesce_text(created_by) as created_by,
  public.coalesce_text(status, 'unknown') as status,
  public.coalesce_numeric(battery_level, 0) as battery_level,
  public.coalesce_numeric(quality_minutes, 0) as quality_minutes,
  public.coalesce_numeric(total_minutes, 0) as total_minutes,
  coalesce(timestamp, now()) as timestamp,
  coalesce(created_at, now()) as created_at
from
  public.study_readings;

comment on function public.coalesce_text is 'Helper function for safe text handling with default value';
comment on function public.coalesce_numeric is 'Helper function for safe numeric handling with default value';
comment on function public.coalesce_array is 'Helper function for safe array handling with default value';
comment on function public.coalesce_json is 'Helper function for safe JSON handling with default value';
comment on function public.coalesce_jsonb is 'Helper function for safe JSONB handling with default value';

comment on view public.safe_pod_view is 'Safe view of pod data with null handling';
comment on view public.safe_study_view is 'Safe view of study data with null handling';
comment on view public.safe_clinic_view is 'Safe view of clinic data with null handling';
comment on view public.safe_study_readings_view is 'Safe view of study readings with null handling'; 