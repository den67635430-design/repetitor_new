
-- Fix the security definer view by setting it to SECURITY INVOKER
ALTER VIEW public.safe_app_settings SET (security_invoker = on);

-- Now we need an RLS-like policy for the view. Since the view reads from app_settings
-- which now has NO non-admin SELECT policy, we need to add a policy that allows
-- authenticated users to read from app_settings but only key and value via the view.
-- Actually, the view with security_invoker means the querying user's permissions apply.
-- So we need to re-add a SELECT policy on app_settings for authenticated users.
CREATE POLICY "Users can read safe settings via view"
ON public.app_settings
FOR SELECT
TO authenticated
USING (key = 'test_mode');
