-- Check what's in the drafts table
SELECT
  id,
  title,
  user_id,
  created_at,
  updated_at
FROM public.drafts
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 20;
