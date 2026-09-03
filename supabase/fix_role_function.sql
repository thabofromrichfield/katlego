-- =============================================
-- FIX: Create a security definer function to 
-- get a user's role without RLS interference.
-- Run this in your Supabase SQL Editor.
-- =============================================

-- Function that reads role directly, bypassing RLS
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

SELECT 'Role function created successfully!' AS status;
