-- Brands table
CREATE TABLE public.brands (
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

CREATE POLICY "Anyone can view brands"
  ON public.brands FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert brands"
  ON public.brands FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update brands"
  ON public.brands FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete brands"
  ON public.brands FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for brand images
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-images', 'brand-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Brand images publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'brand-images');

CREATE POLICY "Admins can upload brand images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'brand-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update brand images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'brand-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete brand images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'brand-images' AND has_role(auth.uid(), 'admin'::app_role));

-- Seed initial brands
INSERT INTO public.brands (label, image_url, link_url, display_order) VALUES
  ('Rolex', 'https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=900&q=80&auto=format&fit=crop', '/collection/higher-grade', 0),
  ('Tissot', 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=900&q=80&auto=format&fit=crop', '/collection/authentic', 1),
  ('Omega', 'https://images.unsplash.com/photo-1612817159949-195b6eb9e31a?w=900&q=80&auto=format&fit=crop', '/collection/higher-grade', 2),
  ('Tag Heuer', 'https://images.unsplash.com/photo-1495856458515-0637185db551?w=900&q=80&auto=format&fit=crop', '/collection/authentic', 3),
  ('Casio', 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?w=900&q=80&auto=format&fit=crop', '/collection/men', 4),
  ('Seiko', 'https://images.unsplash.com/photo-1620625515032-6ed0c1790c75?w=900&q=80&auto=format&fit=crop', '/collection/men', 5);