import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthReady } from "@/hooks/useAuthReady";
import { runWithSessionRecovery, withTimeout } from "@/lib/supabase-resilience";
import type { Product } from "@/hooks/useProducts";

const mapDbProduct = (row: any): Product => ({
  id: row.id,
  name: row.name,
  brand: row.brand,
  price: Number(row.price),
  originalPrice: row.original_price ? Number(row.original_price) : undefined,
  rating: Number(row.rating),
  reviewCount: row.review_count,
  image: row.image_url,
  images: (() => {
    const imgs = (row.product_images as string[]) || [];
    if (imgs.length > 0) return imgs;
    return row.image_url ? [row.image_url] : [];
  })(),
  category: row.category,
  description: row.description,
  badge: row.badge || undefined,
  tagline: row.tagline,
  story: row.story,
  variants: (row.variants as any[]) || [],
  fragranceDetails: (row.fragrance_details as any) || { type: "", notes: { top: [], middle: [], base: [] }, longevity: "", sillage: "", bestTime: "" },
  reviews: (row.reviews as any[]) || [],
  inStock: row.in_stock !== false,
  discount_enabled: row.discount_enabled ?? false,
  discount_type: (row.discount_type as "percentage" | "fixed") || "percentage",
  discount_value: row.discount_value != null ? Number(row.discount_value) : 0,
});

const queryTrending = async () => {
  const { data, error } = await (supabase
    .from("products")
    .select("*") as any)
    .eq("is_trending", true)
    .limit(6);
  if (error) throw error;
  return (data || []).map(mapDbProduct);
};

const fetchTrending = async (): Promise<Product[]> => {
  return withTimeout(runWithSessionRecovery(queryTrending));
};

export const useTrendingProducts = () => {
  const { isReady, authKey } = useAuthReady();

  return useQuery({
    queryKey: ["trending-products", authKey],
    queryFn: fetchTrending,
    enabled: isReady,
    retry: 2,
    retryDelay: (attempt) => Math.min(500 * 2 ** attempt, 3000),
    staleTime: 60_000,
    gcTime: 30 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    placeholderData: keepPreviousData,
  });
};
