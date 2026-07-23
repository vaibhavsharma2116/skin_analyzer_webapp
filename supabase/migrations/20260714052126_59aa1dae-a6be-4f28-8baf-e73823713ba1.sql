
ALTER TABLE public.skin_scans ADD COLUMN IF NOT EXISTS share_token uuid UNIQUE;

CREATE OR REPLACE FUNCTION public.get_shared_scan(_token uuid)
RETURNS TABLE (
  id uuid,
  overall_score integer,
  skin_age integer,
  skin_type text,
  concerns jsonb,
  summary text,
  recommendations jsonb,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.overall_score, s.skin_age, s.skin_type, s.concerns, s.summary, s.recommendations, s.created_at
  FROM public.skin_scans s
  WHERE s.share_token = _token
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_shared_scan(uuid) TO anon, authenticated;
