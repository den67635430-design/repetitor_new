-- Revoke anonymous access from the safe_app_settings view
REVOKE SELECT ON public.safe_app_settings FROM anon;