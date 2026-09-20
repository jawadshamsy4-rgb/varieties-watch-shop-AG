import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthReady } from "@/hooks/useAuthReady";
import { runWithSessionRecovery, withTimeout } from "@/lib/supabase-resilience";

export interface ProductVariant {
  size: string;
  price: number;
  bestFor: string;
}

export interface FragranceNotes {
  top: string[];
  middle: string[];
  base: string[];
}

export interface FragranceDetails {
  type: string;
  notes: FragranceNotes;
  longevity: string;
  sillage: string;
  bestTime: string;
}

export interface Review {
  name: string;
  rating: number;
  comment: string;
  verified: boolean;
  date: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  images: string[];
  category: string;
  description: string;
  badge?: string;
  tagline: string;
  story: string;
  variants: ProductVariant[];
  fragranceDetails: FragranceDetails;
  reviews: Review[];
  inStock: boolean;
  discount_enabled?: boolean;
  discount_type?: "percentage" | "fixed";
  discount_value?: number;
}

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
  variants: (row.variants as ProductVariant[]) || [],
  fragranceDetails: (row.fragrance_details as FragranceDetails) || { type: "", notes: { top: [], middle: [], base: [] }, longevity: "", sillage: "", bestTime: "" },
  reviews: (row.reviews as Review[]) || [],
  inStock: row.in_stock !== false,
  discount_enabled: row.discount_enabled ?? false,
  discount_type: (row.discount_type as "percentage" | "fixed") || "percentage",
  discount_value: row.discount_value != null ? Number(row.discount_value) : 0,
});

const queryProducts = async () => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapDbProduct);
};

const fetchProducts = async (): Promise<Product[]> => {
  return withTimeout(runWithSessionRecovery(queryProducts));
};

const fetchProduct = async (id: string): Promise<Product | null> => {
  const queryProduct = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return mapDbProduct(data);
  };

  return withTimeout(runWithSessionRecovery(queryProduct));
};

export const useProducts = () => {
  const { isReady, authKey } = useAuthReady();

  return useQuery({
    queryKey: ["products", authKey],
    queryFn: fetchProducts,
    enabled: isReady,
    retry: 5,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    staleTime: 60_000,
    gcTime: 30 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    placeholderData: keepPreviousData,
  });
};

export const useProduct = (id: string) => {
  const { isReady, authKey } = useAuthReady();

  return useQuery({
    queryKey: ["product", id, authKey],
    queryFn: () => fetchProduct(id),
    enabled: isReady && !!id,
    retry: 5,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    staleTime: 60_000,
    gcTime: 30 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    placeholderData: keepPreviousData,
  });
};
