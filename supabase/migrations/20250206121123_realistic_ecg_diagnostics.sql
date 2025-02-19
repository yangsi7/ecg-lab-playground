-- Drop existing function if it exists
drop function if exists public.get_ecg_diagnostics(uuid, timestamptz, timestamptz);

-- Create realistic get_ecg_diagnostics function
create or replace function public.get_ecg_diagnostics(
  p_pod_id uuid,
  p_time_start timestamptz,
  p_time_end timestamptz
)
returns table (
  signal_quality json,
  connection_stats json,
  data_quality json
)
language sql
security definer
set search_path = public
as $$
  with signal_metrics as (
    select
      -- Basic signal statistics per channel
      stddev(channel_1) as noise_level_1,
      stddev(channel_2) as noise_level_2,
      stddev(channel_3) as noise_level_3,
      
      -- Baseline drift (measure of low-frequency wandering)
      percentile_cont(0.95) within group (order by abs(
        avg(channel_1) over (
          order by time 
          rows between 320 preceding and current row
        ) - avg(channel_1) over (
          order by time 
          rows between 3200 preceding and current row
        )
      )) as baseline_drift_1,
      
      percentile_cont(0.95) within group (order by abs(
        avg(channel_2) over (
          order by time 
          rows between 320 preceding and current row
        ) - avg(channel_2) over (
          order by time 
          rows between 3200 preceding and current row
        )
      )) as baseline_drift_2,
      
      percentile_cont(0.95) within group (order by abs(
        avg(channel_3) over (
          order by time 
          rows between 320 preceding and current row
        ) - avg(channel_3) over (
          order by time 
          rows between 3200 preceding and current row
        )
      )) as baseline_drift_3,
      
      -- Lead quality scores (percentage of good quality samples)
      avg(case when quality_1 then 100.0 else 0.0 end) as quality_score_1,
      avg(case when quality_2 then 100.0 else 0.0 end) as quality_score_2,
      avg(case when quality_3 then 100.0 else 0.0 end) as quality_score_3
    from
      ecg_sample
    where
      pod_id = p_pod_id
      and time between p_time_start and p_time_end
  ),
  connection_metrics as (
    select
      -- Total samples in time range
      count(*) as total_samples,
      
      -- Missing samples (no quality on any channel)
      sum(case when not (quality_1 or quality_2 or quality_3) then 1 else 0 end) as missing_samples,
      
      -- Connection drops (count minutes where all leads are off)
      count(distinct case 
        when not (lead_on_p_1 or lead_on_p_2 or lead_on_p_3 or 
                 lead_on_n_1 or lead_on_n_2 or lead_on_n_3) 
        then date_trunc('minute', time) 
      end) as connection_drops,
      
      -- Actual sampling frequency
      round(count(*)::numeric / greatest(1, extract(epoch from (p_time_end - p_time_start)))) as sampling_frequency,
      
      -- Lead-off events per channel (count transitions from on to off)
      sum(case when lead_on_p_1 != lag(lead_on_p_1) over (order by time) then 1 else 0 end) as lead_transitions_1,
      sum(case when lead_on_p_2 != lag(lead_on_p_2) over (order by time) then 1 else 0 end) as lead_transitions_2,
      sum(case when lead_on_p_3 != lag(lead_on_p_3) over (order by time) then 1 else 0 end) as lead_transitions_3
    from
      ecg_sample
    where
      pod_id = p_pod_id
      and time between p_time_start and p_time_end
  ),
  data_quality_metrics as (
    select
      -- Continuous recording segments
      count(distinct case 
        when time - lag(time) over (order by time) > interval '1 second'
        then date_trunc('minute', time)
      end) as recording_gaps,
      
      -- Percentage of time with all leads connected
      avg(case 
        when (lead_on_p_1 and lead_on_p_2 and lead_on_p_3 and 
              lead_on_n_1 and lead_on_n_2 and lead_on_n_3) 
        then 100.0 
        else 0.0 
      end) as all_leads_connected_percent,
      
      -- Longest continuous recording segment in seconds
      max(
        extract(epoch from (
          time - lag(time) over (
            order by time
            rows between unbounded preceding and current row
          )
        ))
      ) as max_continuous_segment
    from
      ecg_sample
    where
      pod_id = p_pod_id
      and time between p_time_start and p_time_end
  )
  select
    -- Signal quality metrics
    json_build_object(
      'noise_levels', json_build_object(
        'channel_1', sm.noise_level_1,
        'channel_2', sm.noise_level_2,
        'channel_3', sm.noise_level_3
      ),
      'baseline_drift', json_build_object(
        'channel_1', sm.baseline_drift_1,
        'channel_2', sm.baseline_drift_2,
        'channel_3', sm.baseline_drift_3
      ),
      'quality_scores', json_build_object(
        'channel_1', sm.quality_score_1,
        'channel_2', sm.quality_score_2,
        'channel_3', sm.quality_score_3
      )
    ) as signal_quality,
    
    -- Connection statistics
    json_build_object(
      'total_samples', cm.total_samples,
      'missing_samples', cm.missing_samples,
      'connection_drops', cm.connection_drops,
      'sampling_frequency', cm.sampling_frequency,
      'lead_transitions', json_build_object(
        'channel_1', cm.lead_transitions_1,
        'channel_2', cm.lead_transitions_2,
        'channel_3', cm.lead_transitions_3
      )
    ) as connection_stats,
    
    -- Data quality metrics
    json_build_object(
      'recording_gaps', dq.recording_gaps,
      'all_leads_connected_percent', dq.all_leads_connected_percent,
      'max_continuous_segment_seconds', dq.max_continuous_segment
    ) as data_quality
  from
    signal_metrics sm,
    connection_metrics cm,
    data_quality_metrics dq;
$$;

comment on function public.get_ecg_diagnostics is 'Calculates realistic signal quality and connection statistics from raw ECG data';

-- Example of what the output looks like:
/*
{
  "signal_quality": {
    "noise_levels": {
      "channel_1": 0.15,
      "channel_2": 0.12,
      "channel_3": 0.18
    },
    "baseline_drift": {
      "channel_1": 0.05,
      "channel_2": 0.04,
      "channel_3": 0.06
    },
    "quality_scores": {
      "channel_1": 98.5,
      "channel_2": 97.8,
      "channel_3": 96.9
    }
  },
  "connection_stats": {
    "total_samples": 96000,
    "missing_samples": 120,
    "connection_drops": 2,
    "sampling_frequency": 320,
    "lead_transitions": {
      "channel_1": 4,
      "channel_2": 3,
      "channel_3": 5
    }
  },
  "data_quality": {
    "recording_gaps": 3,
    "all_leads_connected_percent": 98.5,
    "max_continuous_segment_seconds": 3600
  }
}
*/ 