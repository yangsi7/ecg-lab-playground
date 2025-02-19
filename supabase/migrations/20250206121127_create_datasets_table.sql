-- Create the datasets table
CREATE TABLE IF NOT EXISTS public.datasets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('ecg', 'activity', 'sleep')),
    description text,
    size bigint DEFAULT 0,
    status text DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'error')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    metadata jsonb DEFAULT '{}'::jsonb
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER datasets_updated_at
    BEFORE UPDATE ON public.datasets
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_datasets_created_by ON public.datasets(created_by);
CREATE INDEX IF NOT EXISTS idx_datasets_status ON public.datasets(status);
CREATE INDEX IF NOT EXISTS idx_datasets_created_at ON public.datasets(created_at);

-- Enable RLS
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all active datasets"
    ON public.datasets
    FOR SELECT
    TO authenticated
    USING (status = 'active');

CREATE POLICY "Users can create datasets"
    ON public.datasets
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own datasets"
    ON public.datasets
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own datasets"
    ON public.datasets
    FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);

-- Grant permissions
GRANT ALL ON public.datasets TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated; 