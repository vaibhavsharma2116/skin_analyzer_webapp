
-- Restrict redeem_coupon: revoke from PUBLIC and anon; keep authenticated
REVOKE ALL ON FUNCTION public.redeem_coupon(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.redeem_coupon(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.redeem_coupon(text) TO authenticated;

-- Add explicit admin-only UPDATE policy on order_items
CREATE POLICY "Admins can update order items"
ON public.order_items
FOR UPDATE
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
