
CREATE TABLE public.skin_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  overall_score integer NOT NULL,
  skin_age integer,
  skin_type text,
  concerns jsonb NOT NULL DEFAULT '[]'::jsonb,
  summary text,
  recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
  model text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.skin_scans TO authenticated;
GRANT ALL ON public.skin_scans TO service_role;
ALTER TABLE public.skin_scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own scans" ON public.skin_scans FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own scans" ON public.skin_scans FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own scans" ON public.skin_scans FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX skin_scans_user_created_idx ON public.skin_scans (user_id, created_at DESC);
