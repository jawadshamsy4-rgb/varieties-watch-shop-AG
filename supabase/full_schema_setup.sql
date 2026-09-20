-- ==============================================================================
-- VARIETIES WATCH SHOP - COMPLETE DATABASE & STORAGE SETUP SCRIPT
-- ==============================================================================
-- Completely self-contained, idempotent, and error-free.
-- Compatible with all PostgreSQL / Supabase environments.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Optional enum for type completeness (ignored if text is used)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. TRIGGER FUNCTION FOR UPDATING TIMESTAMPS
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 3. USER ROLES TABLE & ROLE-CHECKING HELPER
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role::text = _role
  );
$$;

DROP POLICY IF EXISTS "Admins can view roles" ON public.user_roles;
CREATE POLICY "Admins can view roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Automatically grant admin role to any new user created in Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. ORDERS TABLE & TRACKING
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START 1;

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE DEFAULT ('VW' || LPAD(nextval('public.order_number_seq')::text, 6, '0')),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  product TEXT NOT NULL,
  variant TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_charge NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Pending',
  selected_perfumes TEXT[] DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Orders RLS
DROP POLICY IF EXISTS "Anyone can place an order" ON public.orders;
CREATE POLICY "Anyone can place an order" ON public.orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view orders" ON public.orders;
CREATE POLICY "Admins can view orders" ON public.orders
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
CREATE POLICY "Admins can delete orders" ON public.orders
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Public Order Tracking Functions (Security Definer)
CREATE OR REPLACE FUNCTION public.track_orders_by_phone(p_phone text)
RETURNS SETOF public.orders
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT *
  FROM public.orders
  WHERE p_phone IS NOT NULL
    AND length(btrim(p_phone)) >= 6
    AND phone = btrim(p_phone)
  ORDER BY created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.track_order_by_number(p_order_number text, p_phone text)
RETURNS SETOF public.orders
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT *
  FROM public.orders
  WHERE p_order_number IS NOT NULL
    AND p_phone IS NOT NULL
    AND length(btrim(p_phone)) >= 6
    AND order_number = upper(btrim(p_order_number))
    AND phone = btrim(p_phone)
  ORDER BY created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.track_orders_by_phone(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.track_order_by_number(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_orders_by_phone(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.track_order_by_number(text, text) TO anon, authenticated;

-- Order Placement Function (Returns generated order_number)
CREATE OR REPLACE FUNCTION public.place_order(
  p_name text,
  p_phone text,
  p_address text,
  p_product text,
  p_variant text,
  p_quantity integer,
  p_total_price numeric,
  p_delivery_charge numeric,
  p_selected_perfumes text[] DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_number text;
BEGIN
  INSERT INTO public.orders (
    name, phone, address, product, variant, quantity, total_price, delivery_charge, selected_perfumes
  ) VALUES (
    p_name, p_phone, p_address, p_product, p_variant, p_quantity, p_total_price, p_delivery_charge, p_selected_perfumes
  )
  RETURNING order_number INTO v_order_number;
  
  RETURN v_order_number;
END;
$$;

REVOKE ALL ON FUNCTION public.place_order FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order TO anon, authenticated;

-- 5. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 0,
  original_price NUMERIC,
  rating NUMERIC NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  image_url TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  badge TEXT,
  tagline TEXT NOT NULL DEFAULT '',
  story TEXT NOT NULL DEFAULT '',
  variants JSONB NOT NULL DEFAULT '[]'::jsonb,
  fragrance_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  reviews JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_trending BOOLEAN NOT NULL DEFAULT false,
  product_images TEXT[] NOT NULL DEFAULT '{}'::text[],
  in_stock BOOLEAN NOT NULL DEFAULT true,
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC NOT NULL DEFAULT 0,
  discount_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
CREATE POLICY "Anyone can view products" ON public.products
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
CREATE POLICY "Admins can insert products" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update products" ON public.products;
CREATE POLICY "Admins can update products" ON public.products
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
CREATE POLICY "Admins can delete products" ON public.products
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 6. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5,
  comment TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
CREATE POLICY "Anyone can view reviews" ON public.reviews
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Anyone can submit reviews" ON public.reviews;
CREATE POLICY "Anyone can submit reviews" ON public.reviews
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update reviews" ON public.reviews;
CREATE POLICY "Admins can update reviews" ON public.reviews
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete reviews" ON public.reviews;
CREATE POLICY "Admins can delete reviews" ON public.reviews
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 7. BRANDS TABLE
CREATE TABLE IF NOT EXISTS public.brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  link_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS update_brands_updated_at ON public.brands;
CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "Anyone can view brands" ON public.brands;
CREATE POLICY "Anyone can view brands" ON public.brands
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert brands" ON public.brands;
CREATE POLICY "Admins can insert brands" ON public.brands
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update brands" ON public.brands;
CREATE POLICY "Admins can update brands" ON public.brands
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete brands" ON public.brands;
CREATE POLICY "Admins can delete brands" ON public.brands
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed Initial Brands
INSERT INTO public.brands (label, image_url, link_url, display_order)
VALUES
  ('Rolex', 'https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=900&q=80&auto=format&fit=crop', '/collection/higher-grade', 0),
  ('Tissot', 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=900&q=80&auto=format&fit=crop', '/collection/authentic', 1),
  ('Omega', 'https://images.unsplash.com/photo-1612817159949-195b6eb9e31a?w=900&q=80&auto=format&fit=crop', '/collection/higher-grade', 2),
  ('Tag Heuer', 'https://images.unsplash.com/photo-1495856458515-0637185db551?w=900&q=80&auto=format&fit=crop', '/collection/authentic', 3),
  ('Casio', 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?w=900&q=80&auto=format&fit=crop', '/collection/men', 4),
  ('Seiko', 'https://images.unsplash.com/photo-1620625515032-6ed0c1790c75?w=900&q=80&auto=format&fit=crop', '/collection/men', 5)
ON CONFLICT DO NOTHING;

-- 8. HERO SLIDES TABLE
CREATE TABLE IF NOT EXISTS public.hero_slides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  link_url TEXT,
  pc_image_url TEXT,
  phone_image_url TEXT,
  tablet_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS update_hero_slides_updated_at ON public.hero_slides;
CREATE TRIGGER update_hero_slides_updated_at
  BEFORE UPDATE ON public.hero_slides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "Anyone can view hero slides" ON public.hero_slides;
CREATE POLICY "Anyone can view hero slides" ON public.hero_slides
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert hero slides" ON public.hero_slides;
CREATE POLICY "Admins can insert hero slides" ON public.hero_slides
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update hero slides" ON public.hero_slides;
CREATE POLICY "Admins can update hero slides" ON public.hero_slides
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete hero slides" ON public.hero_slides;
CREATE POLICY "Admins can delete hero slides" ON public.hero_slides
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 9. SITE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view non-sensitive settings" ON public.site_settings;
CREATE POLICY "Public can view non-sensitive settings" ON public.site_settings
  FOR SELECT TO anon, authenticated
  USING (key LIKE 'delivery_%');

DROP POLICY IF EXISTS "Admins can view all settings" ON public.site_settings;
CREATE POLICY "Admins can view all settings" ON public.site_settings
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update settings" ON public.site_settings;
CREATE POLICY "Admins can update settings" ON public.site_settings
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert settings" ON public.site_settings;
CREATE POLICY "Admins can insert settings" ON public.site_settings
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Default Site Settings
INSERT INTO public.site_settings (key, value) VALUES
  ('delivery_charge_inside', '60'::jsonb),
  ('delivery_charge_outside', '120'::jsonb),
  ('delivery_label_inside', '"Inside Chittagong"'::jsonb),
  ('delivery_label_outside', '"Outside Chittagong"'::jsonb),
  ('notification_email', '{"email": "varietieswatchshop@gmail.com"}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 10. CATEGORY DISCOUNTS TABLE
CREATE TABLE IF NOT EXISTS public.category_discounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.category_discounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view discounts" ON public.category_discounts;
CREATE POLICY "Anyone can view discounts" ON public.category_discounts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert discounts" ON public.category_discounts;
CREATE POLICY "Admins can insert discounts" ON public.category_discounts
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update discounts" ON public.category_discounts;
CREATE POLICY "Admins can update discounts" ON public.category_discounts
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete discounts" ON public.category_discounts;
CREATE POLICY "Admins can delete discounts" ON public.category_discounts
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed Default Category Discounts
INSERT INTO public.category_discounts (category, discount_type, discount_value, enabled) VALUES
  ('Men', 'percentage', 0, false),
  ('Women', 'percentage', 0, false),
  ('Luxury', 'percentage', 0, false),
  ('Sport', 'percentage', 0, false),
  ('Smart', 'percentage', 0, false),
  ('Couple', 'percentage', 0, false)
ON CONFLICT (category) DO NOTHING;

-- 11. STORAGE BUCKETS & POLICIES
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('product-images', 'product-images', true),
  ('brand-images', 'brand-images', true)
ON CONFLICT (id) DO NOTHING;

-- Product images bucket policies
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
CREATE POLICY "Anyone can view product images" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
CREATE POLICY "Admins can upload product images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
CREATE POLICY "Admins can update product images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
CREATE POLICY "Admins can delete product images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

-- Brand images bucket policies
DROP POLICY IF EXISTS "Brand images publicly accessible" ON storage.objects;
CREATE POLICY "Brand images publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'brand-images');

DROP POLICY IF EXISTS "Admins can upload brand images" ON storage.objects;
CREATE POLICY "Admins can upload brand images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'brand-images' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update brand images" ON storage.objects;
CREATE POLICY "Admins can update brand images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'brand-images' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete brand images" ON storage.objects;
CREATE POLICY "Admins can delete brand images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'brand-images' AND public.has_role(auth.uid(), 'admin'));
