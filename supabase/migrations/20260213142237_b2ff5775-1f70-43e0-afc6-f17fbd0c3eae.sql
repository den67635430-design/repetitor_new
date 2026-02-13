
-- Recreate the view with security_invoker so it respects RLS on app_settings
CREATE OR REPLACE VIEW public.safe_app_settings
WITH (security_invoker = true)
AS
SELECT id, key, value, updated_at
FROM public.app_settings
WHERE key = 'test_mode';

-- Revoke all access from anon role
REVOKE ALL ON public.safe_app_settings FROM anon;

-- Grant SELECT to authenticated users only
GRANT SELECT ON public.safe_app_settings TO authenticated;
