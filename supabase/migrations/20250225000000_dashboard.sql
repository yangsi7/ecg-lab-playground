-- Migration: 20250225000000_dashboard
-- Description: Add VIP status column to clinics and create audit logs table

-- Add VIP status column to clinics table
ALTER TABLE clinics ADD COLUMN vip_status BOOLEAN DEFAULT FALSE;

-- Create audit logs table for tracking changes
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  changed_by UUID,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster audit log queries
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);

-- Function to update VIP status of a clinic
CREATE OR REPLACE FUNCTION update_clinic_vip_status(p_clinic_id TEXT, p_vip_status BOOLEAN)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Update the clinic record
  UPDATE clinics
  SET vip_status = p_vip_status
  WHERE id = p_clinic_id
  RETURNING jsonb_build_object('id', id, 'name', name, 'vip_status', vip_status) INTO result;
  
  -- Return null if clinic not found
  IF result IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Clinic not found');
  END IF;
  
  -- Add an audit log
  INSERT INTO audit_logs (
    table_name,
    record_id,
    operation,
    old_data,
    new_data,
    changed_by
  ) VALUES (
    'clinics',
    p_clinic_id,
    'UPDATE',
    jsonb_build_object('vip_status', NOT p_vip_status),
    jsonb_build_object('vip_status', p_vip_status),
    auth.uid()
  );
  
  RETURN jsonb_build_object('success', true, 'data', result);
END;
$$; 