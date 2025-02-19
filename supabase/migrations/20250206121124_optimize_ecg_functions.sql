-- Add indexes for performance
create index if not exists ecg_sample_pod_time_idx 
on public.ecg_sample (pod_id, time);

create index if not exists ecg_sample_quality_idx 
on public.ecg_sample (pod_id, quality_1, quality_2, quality_3);

create index if not exists ecg_sample_lead_status_idx 
on public.ecg_sample (pod_id, lead_on_p_1, lead_on_p_2, lead_on_p_3);

-- Create chunked version of downsample_ecg
create or replace function public.downsample_ecg_chunked(
  p_pod_id uuid,
  p_time_start timestamptz,
  p_time_end timestamptz,
  p_factor integer default 4,
  p_chunk_minutes integer default 5,
  p_offset integer default 0,
  p_limit integer default 1000
)
returns table (
  chunk_start timestamptz,
  chunk_end timestamptz,
  samples jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_chunk_interval interval;
  v_current_start timestamptz;
  v_current_end timestamptz;
begin
  -- Validate and clamp parameters
  p_factor := greatest(1, least(4, p_factor));
  p_chunk_minutes := greatest(1, least(60, p_chunk_minutes));
  v_chunk_interval := (p_chunk_minutes || ' minutes')::interval;
  
  -- Initialize chunk window
  v_current_start := p_time_start + (p_offset * v_chunk_interval);
  
  -- Return chunks
  for i in 1..p_limit loop
    v_current_end := v_current_start + v_chunk_interval;
    exit when v_current_start >= p_time_end;
    
    return query
    with numbered_samples as (
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
        ecg_sample
      where
        pod_id = p_pod_id
        and time >= v_current_start
        and time < v_current_end
    )
    select 
      v_current_start,
      v_current_end,
      jsonb_agg(
        jsonb_build_object(
          'time', time,
          'channels', array[channel_1, channel_2, channel_3],
          'lead_on_p', array[lead_on_p_1, lead_on_p_2, lead_on_p_3],
          'lead_on_n', array[lead_on_n_1, lead_on_n_2, lead_on_n_3],
          'quality', array[quality_1, quality_2, quality_3]
        )
      ) as samples
    from
      numbered_samples
    where
      rn % p_factor = 0;
    
    v_current_start := v_current_end;
  end loop;
end;
$$;

-- Create chunked version of get_ecg_diagnostics
create or replace function public.get_ecg_diagnostics_chunked(
  p_pod_id uuid,
  p_time_start timestamptz,
  p_time_end timestamptz,
  p_chunk_minutes integer default 5,
  p_offset integer default 0,
  p_limit integer default 1000
)
returns table (
  chunk_start timestamptz,
  chunk_end timestamptz,
  metrics jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_chunk_interval interval;
  v_current_start timestamptz;
  v_current_end timestamptz;
begin
  -- Validate parameters
  p_chunk_minutes := greatest(1, least(60, p_chunk_minutes));
  v_chunk_interval := (p_chunk_minutes || ' minutes')::interval;
  
  -- Initialize chunk window
  v_current_start := p_time_start + (p_offset * v_chunk_interval);
  
  -- Return chunks
  for i in 1..p_limit loop
    v_current_end := v_current_start + v_chunk_interval;
    exit when v_current_start >= p_time_end;
    
    return query
    with signal_metrics as (
      select
        stddev(channel_1) as noise_level_1,
        stddev(channel_2) as noise_level_2,
        stddev(channel_3) as noise_level_3,
        avg(case when quality_1 then 100.0 else 0.0 end) as quality_score_1,
        avg(case when quality_2 then 100.0 else 0.0 end) as quality_score_2,
        avg(case when quality_3 then 100.0 else 0.0 end) as quality_score_3
      from
        ecg_sample
      where
        pod_id = p_pod_id
        and time >= v_current_start
        and time < v_current_end
    ),
    connection_metrics as (
      select
        count(*) as total_samples,
        sum(case when not (quality_1 or quality_2 or quality_3) then 1 else 0 end) as missing_samples,
        count(distinct case 
          when not (lead_on_p_1 or lead_on_p_2 or lead_on_p_3) 
          then date_trunc('minute', time) 
        end) as connection_drops
      from
        ecg_sample
      where
        pod_id = p_pod_id
        and time >= v_current_start
        and time < v_current_end
    )
    select
      v_current_start,
      v_current_end,
      jsonb_build_object(
        'signal_quality', jsonb_build_object(
          'noise_levels', jsonb_build_object(
            'channel_1', sm.noise_level_1,
            'channel_2', sm.noise_level_2,
            'channel_3', sm.noise_level_3
          ),
          'quality_scores', jsonb_build_object(
            'channel_1', sm.quality_score_1,
            'channel_2', sm.quality_score_2,
            'channel_3', sm.quality_score_3
          )
        ),
        'connection_stats', jsonb_build_object(
          'total_samples', cm.total_samples,
          'missing_samples', cm.missing_samples,
          'connection_drops', cm.connection_drops
        )
      ) as metrics
    from
      signal_metrics sm,
      connection_metrics cm;
    
    v_current_start := v_current_end;
  end loop;
end;
$$;

comment on function public.downsample_ecg_chunked is 'Returns downsampled ECG data in time-based chunks for efficient loading and caching';
comment on function public.get_ecg_diagnostics_chunked is 'Returns ECG diagnostics in time-based chunks for efficient loading and caching';

-- Example usage:
/*
-- Get first 5 chunks of 5 minutes each:
select * from downsample_ecg_chunked(
  'pod-id-here',
  '2024-02-06T00:00:00Z',
  '2024-02-06T01:00:00Z',
  p_factor := 4,
  p_chunk_minutes := 5,
  p_offset := 0,
  p_limit := 5
);

-- Get next 5 chunks:
select * from downsample_ecg_chunked(
  'pod-id-here',
  '2024-02-06T00:00:00Z',
  '2024-02-06T01:00:00Z',
  p_factor := 4,
  p_chunk_minutes := 5,
  p_offset := 5,
  p_limit := 5
);
*/ 