ALTER TABLE public.skin_scans ADD COLUMN IF NOT EXISTS image_hash TEXT;
CREATE INDEX IF NOT EXISTS skin_scans_user_hash_idx ON public.skin_scans(user_id, image_hash);