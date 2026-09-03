-- =============================================
-- FIX: Disable email confirmation for self-hosted Supabase
-- Run this in your Supabase SQL Editor
-- =============================================

-- STEP 1: Confirm all existing unconfirmed users immediately
UPDATE auth.users
SET 
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email_confirmed_at IS NULL;

-- STEP 2: Create a trigger that auto-confirms every NEW user on signup
-- This means no email confirmation is ever needed
CREATE OR REPLACE FUNCTION auth.auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-confirm email immediately on signup
  IF NEW.email_confirmed_at IS NULL THEN
    NEW.email_confirmed_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists, then recreate
DROP TRIGGER IF EXISTS auto_confirm_user_trigger ON auth.users;

CREATE TRIGGER auto_confirm_user_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auth.auto_confirm_user();

-- STEP 3: Verify it worked - should show 0 unconfirmed users
SELECT 
  COUNT(*) as total_users,
  COUNT(email_confirmed_at) as confirmed_users,
  COUNT(*) - COUNT(email_confirmed_at) as unconfirmed_users
FROM auth.users;

-- STEP 4: Also ensure the profile trigger exists (recreate to be safe)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    NULL
  )
  ON CONFLICT (id) DO UPDATE
    SET 
      full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      role = COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
      updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Done! Users can now register and login immediately without email confirmation.
SELECT 'Setup complete! Email confirmation disabled. Users can sign in immediately.' AS status;
