
CREATE TABLE public.experts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  years TEXT NOT NULL DEFAULT '',
  rating NUMERIC(3,1) NOT NULL DEFAULT 5.0,
  answers_count INTEGER NOT NULL DEFAULT 0,
  followers TEXT NOT NULL DEFAULT '',
  positive TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  initials TEXT NOT NULL DEFAULT '',
  tone TEXT NOT NULL DEFAULT 'bg-primary/15 text-primary',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.experts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.experts TO authenticated;
GRANT ALL ON public.experts TO service_role;

ALTER TABLE public.experts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active experts"
  ON public.experts FOR SELECT
  USING (active = true OR private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can insert experts"
  ON public.experts FOR INSERT
  TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update experts"
  ON public.experts FOR UPDATE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete experts"
  ON public.experts FOR DELETE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER update_experts_updated_at
  BEFORE UPDATE ON public.experts
  FOR EACH ROW EXECUTE FUNCTION private.update_updated_at_column();

CREATE INDEX idx_experts_active_created ON public.experts (active, created_at DESC);
