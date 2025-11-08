-- Create a limited function that exposes only username for flight creators
CREATE OR REPLACE FUNCTION public.get_username_for_user(user_uuid uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT username
  FROM public.profiles
  WHERE id = user_uuid
  LIMIT 1;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_username_for_user(uuid) TO authenticated;