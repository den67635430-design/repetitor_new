
-- 1. PAYMENTS: deny all write operations for regular users (only service_role can modify)
CREATE POLICY "Deny insert for regular users"
ON public.payments
FOR INSERT
WITH CHECK (false);

CREATE POLICY "Deny update for regular users"
ON public.payments
FOR UPDATE
USING (false);

CREATE POLICY "Deny delete for regular users"
ON public.payments
FOR DELETE
USING (false);

-- 2. SUBSCRIPTIONS: deny all write operations for regular users
CREATE POLICY "Deny insert for regular users"
ON public.subscriptions
FOR INSERT
WITH CHECK (false);

CREATE POLICY "Deny update for regular users"
ON public.subscriptions
FOR UPDATE
USING (false);

CREATE POLICY "Deny delete for regular users"
ON public.subscriptions
FOR DELETE
USING (false);

-- 3. PROFILES: deny delete for regular users
CREATE POLICY "Deny delete for regular users"
ON public.profiles
FOR DELETE
USING (false);
