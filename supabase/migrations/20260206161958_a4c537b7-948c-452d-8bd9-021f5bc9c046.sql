
-- Fix 1: Make chat-attachments bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'chat-attachments';

-- Fix 1: Restrict SELECT policy to file owners only
DROP POLICY IF EXISTS "Chat attachments are viewable" ON storage.objects;

CREATE POLICY "Users can view own chat attachments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'chat-attachments' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Fix 2: Explicitly deny UPDATE on chat_messages (immutable history)
CREATE POLICY "Chat messages are immutable"
  ON public.chat_messages FOR UPDATE
  USING (false);

-- Fix 2: Explicitly deny DELETE on chat_messages
CREATE POLICY "Chat messages cannot be deleted directly"
  ON public.chat_messages FOR DELETE
  USING (false);
