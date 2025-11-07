-- Create seal_scans table to store all seal scan data
CREATE TABLE public.seal_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flight_id UUID NOT NULL REFERENCES public.flights(id) ON DELETE CASCADE,
  equipment_type TEXT NOT NULL,
  seal_number TEXT NOT NULL,
  scanned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seal_scans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own seal scans"
  ON public.seal_scans
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own seal scans"
  ON public.seal_scans
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own seal scans"
  ON public.seal_scans
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX idx_seal_scans_flight_id ON public.seal_scans(flight_id);
CREATE INDEX idx_seal_scans_user_id ON public.seal_scans(user_id);