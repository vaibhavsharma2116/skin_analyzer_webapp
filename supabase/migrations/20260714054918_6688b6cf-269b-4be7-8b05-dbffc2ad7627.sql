ALTER TABLE public.skin_scans
  ADD COLUMN IF NOT EXISTS metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS scan_type text NOT NULL DEFAULT 'morning';

DROP FUNCTION IF EXISTS public.get_shared_scan(uuid);

CREATE OR REPLACE FUNCTION public.get_shared_scan(_token uuid)
 RETURNS TABLE(id uuid, overall_score integer, skin_age integer, skin_type text, concerns jsonb, summary text, recommendations jsonb, metrics jsonb, scan_type text, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT s.id, s.overall_score, s.skin_age, s.skin_type, s.concerns, s.summary, s.recommendations, s.metrics, s.scan_type, s.created_at
  FROM public.skin_scans s
  WHERE s.share_token = _token
  LIMIT 1;
$function$;