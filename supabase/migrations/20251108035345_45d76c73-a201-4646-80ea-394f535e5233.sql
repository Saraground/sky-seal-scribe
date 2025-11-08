-- Restrict profiles SELECT policy to only allow users to view their own profile
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Create rate limiting table for edge functions
CREATE TABLE IF NOT EXISTS public.rate_limit_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  endpoint text NOT NULL,
  request_count integer DEFAULT 1,
  window_start timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(identifier, endpoint, window_start)
);

-- Enable RLS on rate_limit_requests (no policies needed - only edge functions access this)
ALTER TABLE public.rate_limit_requests ENABLE ROW LEVEL SECURITY;

-- Create index for faster rate limit lookups
CREATE INDEX IF NOT EXISTS idx_rate_limit_lookup 
ON public.rate_limit_requests(identifier, endpoint, window_start);

-- Function to clean up old rate limit records (older than 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.rate_limit_requests
  WHERE window_start < now() - interval '24 hours';
$$;