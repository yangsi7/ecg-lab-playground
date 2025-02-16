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
