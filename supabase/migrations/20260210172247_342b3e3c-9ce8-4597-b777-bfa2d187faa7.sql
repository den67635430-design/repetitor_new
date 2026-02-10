
-- Add explicit DENY policies for anonymous users on tables that lack them

-- profiles: deny anon SELECT/INSERT/UPDATE/DELETE
CREATE POLICY "Deny anon select on profiles"
ON public.profiles FOR SELECT TO anon USING (false);

CREATE POLICY "Deny anon insert on profiles"
ON public.profiles FOR INSERT TO anon WITH CHECK (false);

CREATE POLICY "Deny anon update on profiles"
ON public.profiles FOR UPDATE TO anon USING (false);

CREATE POLICY "Deny anon delete on profiles"
ON public.profiles FOR DELETE TO anon USING (false);

-- chat_sessions: deny anon all
CREATE POLICY "Deny anon select on chat_sessions"
ON public.chat_sessions FOR SELECT TO anon USING (false);

CREATE POLICY "Deny anon insert on chat_sessions"
ON public.chat_sessions FOR INSERT TO anon WITH CHECK (false);

CREATE POLICY "Deny anon update on chat_sessions"
ON public.chat_sessions FOR UPDATE TO anon USING (false);

CREATE POLICY "Deny anon delete on chat_sessions"
ON public.chat_sessions FOR DELETE TO anon USING (false);

-- chat_messages: deny anon all
CREATE POLICY "Deny anon select on chat_messages"
ON public.chat_messages FOR SELECT TO anon USING (false);

CREATE POLICY "Deny anon insert on chat_messages"
ON public.chat_messages FOR INSERT TO anon WITH CHECK (false);

CREATE POLICY "Deny anon update on chat_messages"
ON public.chat_messages FOR UPDATE TO anon USING (false);

CREATE POLICY "Deny anon delete on chat_messages"
ON public.chat_messages FOR DELETE TO anon USING (false);

-- device_sessions: deny anon all
CREATE POLICY "Deny anon select on device_sessions"
ON public.device_sessions FOR SELECT TO anon USING (false);

CREATE POLICY "Deny anon insert on device_sessions"
ON public.device_sessions FOR INSERT TO anon WITH CHECK (false);

CREATE POLICY "Deny anon update on device_sessions"
ON public.device_sessions FOR UPDATE TO anon USING (false);

CREATE POLICY "Deny anon delete on device_sessions"
ON public.device_sessions FOR DELETE TO anon USING (false);

-- user_roles: deny anon all
CREATE POLICY "Deny anon select on user_roles"
ON public.user_roles FOR SELECT TO anon USING (false);

CREATE POLICY "Deny anon insert on user_roles"
ON public.user_roles FOR INSERT TO anon WITH CHECK (false);

CREATE POLICY "Deny anon update on user_roles"
ON public.user_roles FOR UPDATE TO anon USING (false);

CREATE POLICY "Deny anon delete on user_roles"
ON public.user_roles FOR DELETE TO anon USING (false);

-- Revoke anon access to safe_app_settings view (already should be revoked per memory, but ensure it)
REVOKE ALL ON public.safe_app_settings FROM anon;

-- Restrict the test_mode read policy to authenticated users only
DROP POLICY IF EXISTS "Users can read safe settings via view" ON public.app_settings;
CREATE POLICY "Authenticated users can read test_mode setting"
ON public.app_settings FOR SELECT TO authenticated USING (key = 'test_mode');
