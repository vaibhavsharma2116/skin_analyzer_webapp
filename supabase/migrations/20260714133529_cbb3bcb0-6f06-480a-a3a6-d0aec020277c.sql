ALTER TABLE public.skin_scans
ADD COLUMN IF NOT EXISTS face_fingerprint_hash text;

CREATE INDEX IF NOT EXISTS skin_scans_user_face_fingerprint_idx
ON public.skin_scans (user_id, face_fingerprint_hash)
WHERE face_fingerprint_hash IS NOT NULL;