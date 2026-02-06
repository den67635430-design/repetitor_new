
-- App settings table for persistent global configuration (like test mode)
CREATE TABLE public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read settings (needed for test mode banner)
CREATE POLICY "Authenticated users can read settings"
ON public.app_settings FOR SELECT
TO authenticated
USING (true);

-- Only admins can modify settings
CREATE POLICY "Admins can update settings"
ON public.app_settings FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert settings"
ON public.app_settings FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Insert default test_mode setting
INSERT INTO public.app_settings (key, value) VALUES ('test_mode', '{"enabled": false}');

-- Enable realtime for instant broadcast to all users
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;

-- Admin policies for statistics: allow admins to view all chat sessions
CREATE POLICY "Admins can view all chat sessions"
ON public.chat_sessions FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Admin policies for statistics: allow admins to view all device sessions
CREATE POLICY "Admins can view all device sessions"
ON public.device_sessions FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));
