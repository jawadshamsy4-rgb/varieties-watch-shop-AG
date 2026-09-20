-- 1. ORDERS: restrict public SELECT, add admin-only SELECT, and expose a
--    SECURITY DEFINER lookup function for order tracking.
DROP POLICY IF EXISTS "Anyone can view orders for tracking" ON public.orders;

CREATE POLICY "Admins can view orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Lookup by phone number. Requires non-empty phone. Returns matching orders.
CREATE OR REPLACE FUNCTION public.track_orders_by_phone(p_phone text)
RETURNS SETOF public.orders
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.orders
  WHERE p_phone IS NOT NULL
    AND length(btrim(p_phone)) >= 6
    AND phone = btrim(p_phone)
  ORDER BY created_at DESC
$$;

-- Lookup by order number. Requires phone number to match the order.
CREATE OR REPLACE FUNCTION public.track_order_by_number(p_order_number text, p_phone text)
RETURNS SETOF public.orders
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.orders
  WHERE p_order_number IS NOT NULL
    AND p_phone IS NOT NULL
    AND length(btrim(p_phone)) >= 6
    AND order_number = upper(btrim(p_order_number))
    AND phone = btrim(p_phone)
  ORDER BY created_at DESC
$$;

REVOKE ALL ON FUNCTION public.track_orders_by_phone(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.track_order_by_number(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_orders_by_phone(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.track_order_by_number(text, text) TO anon, authenticated;

-- 2. SITE_SETTINGS: only expose non-sensitive public keys to anon/authenticated.
DROP POLICY IF EXISTS "Anyone can view settings" ON public.site_settings;

CREATE POLICY "Public can view non-sensitive settings"
  ON public.site_settings
  FOR SELECT
  TO anon, authenticated
  USING (key IN ('delivery_charge_inside', 'delivery_charge_outside'));

CREATE POLICY "Admins can view all settings"
  ON public.site_settings
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));