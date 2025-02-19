-- Drop the old max_pts based function
drop function if exists public.downsample_ecg(uuid, timestamptz, timestamptz, integer);

-- Add RLS policies for tables
create policy "Public read access to studies"
on public.study
for select
to authenticated, anon
using (true);

create policy "Authenticated users can create studies"
on public.study
for insert
to authenticated
with check (auth.uid() = created_by);

create policy "Users can update their own studies"
on public.study
for update
to authenticated
using (auth.uid() = created_by)
with check (auth.uid() = created_by);

create policy "Users can delete their own studies"
on public.study
for delete
to authenticated
using (auth.uid() = created_by);

-- Pod policies
create policy "Public read access to pods"
on public.pod
for select
to authenticated, anon
using (true);

create policy "Authenticated users can create pods"
on public.pod
for insert
to authenticated
with check (auth.uid() = assigned_user_id);

create policy "Users can update their assigned pods"
on public.pod
for update
to authenticated
using (auth.uid() = assigned_user_id)
with check (auth.uid() = assigned_user_id);

create policy "Users can delete their assigned pods"
on public.pod
for delete
to authenticated
using (auth.uid() = assigned_user_id);

-- ECG sample policies
create policy "Public read access to ECG samples"
on public.ecg_sample
for select
to authenticated, anon
using (true);

create policy "Authenticated users can insert ECG samples for their pods"
on public.ecg_sample
for insert
to authenticated
with check (
  exists (
    select 1 from public.pod
    where id = ecg_sample.pod_id
    and assigned_user_id = auth.uid()
  )
);

-- Clinic policies
create policy "Public read access to clinics"
on public.clinics
for select
to authenticated, anon
using (true);

-- Study readings policies
create policy "Public read access to study readings"
on public.study_readings
for select
to authenticated, anon
using (true);

create policy "Authenticated users can create readings for their studies"
on public.study_readings
for insert
to authenticated
with check (
  exists (
    select 1 from public.study
    where study_id = study_readings.study_id
    and created_by = auth.uid()
  )
);

create policy "Users can update their own study readings"
on public.study_readings
for update
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

create policy "Users can delete their own study readings"
on public.study_readings
for delete
to authenticated
using (created_by = auth.uid());

-- Add comments to explain RLS policies
comment on policy "Public read access to studies" on public.study is 'Anyone can view studies';
comment on policy "Authenticated users can create studies" on public.study is 'Authenticated users can create studies they own';
comment on policy "Users can update their own studies" on public.study is 'Users can only update studies they created';
comment on policy "Users can delete their own studies" on public.study is 'Users can only delete studies they created';

comment on policy "Public read access to pods" on public.pod is 'Anyone can view pods';
comment on policy "Authenticated users can create pods" on public.pod is 'Authenticated users can create pods assigned to them';
comment on policy "Users can update their assigned pods" on public.pod is 'Users can only update pods assigned to them';
comment on policy "Users can delete their assigned pods" on public.pod is 'Users can only delete pods assigned to them';

comment on policy "Public read access to ECG samples" on public.ecg_sample is 'Anyone can view ECG samples';
comment on policy "Authenticated users can insert ECG samples for their pods" on public.ecg_sample is 'Users can only insert ECG samples for pods assigned to them';

comment on policy "Public read access to clinics" on public.clinics is 'Anyone can view clinics';

comment on policy "Public read access to study readings" on public.study_readings is 'Anyone can view study readings';
comment on policy "Authenticated users can create readings for their studies" on public.study_readings is 'Users can create readings for studies they own';
comment on policy "Users can update their own study readings" on public.study_readings is 'Users can only update readings they created';
comment on policy "Users can delete their own study readings" on public.study_readings is 'Users can only delete readings they created'; 