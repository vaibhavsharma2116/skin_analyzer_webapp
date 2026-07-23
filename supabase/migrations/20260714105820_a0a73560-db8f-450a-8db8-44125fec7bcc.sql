
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL DEFAULT 'percent' CHECK (discount_type IN ('percent','fixed')),
  discount_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_uses INTEGER,
  times_used INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ,
  note TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all coupons"
  ON public.coupons FOR SELECT
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can insert coupons"
  ON public.coupons FOR INSERT
  TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update coupons"
  ON public.coupons FOR UPDATE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete coupons"
  ON public.coupons FOR DELETE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION private.update_updated_at_column();

CREATE INDEX idx_coupons_active ON public.coupons (active, expires_at);

-- Atomic redeem helper: validates + increments usage in one call.
-- SECURITY DEFINER so signed-in users can redeem without a direct SELECT policy.
CREATE OR REPLACE FUNCTION public.redeem_coupon(_code TEXT)
RETURNS TABLE (
  id UUID,
  code TEXT,
  discount_type TEXT,
  discount_value NUMERIC,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c public.coupons%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT * INTO c FROM public.coupons WHERE upper(coupons.code) = upper(_code) FOR UPDATE;
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, _code, NULL::TEXT, NULL::NUMERIC, 'not_found'::TEXT;
    RETURN;
  END IF;

  IF NOT c.active THEN
    RETURN QUERY SELECT c.id, c.code, c.discount_type, c.discount_value, 'inactive'::TEXT;
    RETURN;
  END IF;

  IF c.expires_at IS NOT NULL AND c.expires_at < now() THEN
    RETURN QUERY SELECT c.id, c.code, c.discount_type, c.discount_value, 'expired'::TEXT;
    RETURN;
  END IF;

  IF c.max_uses IS NOT NULL AND c.times_used >= c.max_uses THEN
    RETURN QUERY SELECT c.id, c.code, c.discount_type, c.discount_value, 'exhausted'::TEXT;
    RETURN;
  END IF;

  UPDATE public.coupons SET times_used = times_used + 1 WHERE public.coupons.id = c.id;

  RETURN QUERY SELECT c.id, c.code, c.discount_type, c.discount_value, 'ok'::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_coupon(TEXT) TO authenticated;
