ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS discount_type text NOT NULL DEFAULT 'percentage',
  ADD COLUMN IF NOT EXISTS discount_value numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_enabled boolean NOT NULL DEFAULT false;