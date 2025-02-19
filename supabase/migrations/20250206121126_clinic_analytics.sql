-- Create get_clinic_analytics function
create or replace function public.get_clinic_analytics(
  clinic_id uuid default null
)
returns table (
  totalPatients bigint,
  activePatients bigint,
  totalStudies bigint,
  activeStudies bigint
)
language sql
security definer
set search_path = public
as $$
  with clinic_stats as (
    select
      count(distinct s.user_id) as total_patients,
      count(distinct case when s.end_timestamp is null then s.user_id end) as active_patients,
      count(*) as total_studies,
      count(case when s.end_timestamp is null then 1 end) as active_studies
    from
      study s
    where
      clinic_id = coalesce($1, clinic_id)
  )
  select
    total_patients,
    active_patients,
    total_studies,
    active_studies
  from
    clinic_stats;
$$;

comment on function public.get_clinic_analytics is 'Returns analytics about patients and studies for a clinic';

-- Example usage:
/*
-- Get analytics for a specific clinic:
select * from get_clinic_analytics('clinic-id-here');

-- Get analytics for all clinics combined:
select * from get_clinic_analytics();
*/ 