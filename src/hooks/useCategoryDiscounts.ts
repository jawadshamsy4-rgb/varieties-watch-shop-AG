import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CategoryDiscount {
  id: string;
  category: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  enabled: boolean;
  updated_at: string;
}

export const useCategoryDiscounts = () => {
  return useQuery({
    queryKey: ["category-discounts"],
    queryFn: async (): Promise<CategoryDiscount[]> => {
      const { data, error } = await supabase
        .from("category_discounts")
        .select("*")
        .order("category");
      if (error) throw error;
      return (data || []) as CategoryDiscount[];
    },
    staleTime: 10_000,
  });
};

export const useUpdateCategoryDiscount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (discount: Partial<CategoryDiscount> & { id: string }) => {
      const { id, ...updates } = discount;
      const { error } = await supabase
        .from("category_discounts")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["category-discounts"] }),
  });
};

/** Given a base price, category, and discounts map, return discounted price or null */
export const getDiscountedPrice = (
  price: number,
  category: string,
  discounts: CategoryDiscount[] | undefined
): number | null => {
  if (!discounts) return null;
  const d = discounts.find(
    (x) => x.category.toLowerCase() === category.toLowerCase() && x.enabled && x.discount_value > 0
  );
  if (!d) return null;
  if (d.discount_type === "percentage") {
    return Math.round(price * (1 - d.discount_value / 100));
  }
  return Math.max(0, price - d.discount_value);
};

export const getDiscountLabel = (
  category: string,
  discounts: CategoryDiscount[] | undefined
): string | null => {
  if (!discounts) return null;
  const d = discounts.find(
    (x) => x.category.toLowerCase() === category.toLowerCase() && x.enabled && x.discount_value > 0
  );
  if (!d) return null;
  if (d.discount_type === "percentage") return `${d.discount_value}% OFF`;
  return `৳${d.discount_value} OFF`;
};

/**
 * Product-level discount overrides category-level. Returns the effective
 * discount that applies, or null if none.
 */
export interface ProductDiscountFields {
  category: string;
  discount_enabled?: boolean;
  discount_type?: "percentage" | "fixed" | string;
  discount_value?: number;
}

export const resolveProductDiscount = (
  product: ProductDiscountFields,
  categoryDiscounts: CategoryDiscount[] | undefined,
): { type: "percentage" | "fixed"; value: number } | null => {
  if (product.discount_enabled && Number(product.discount_value ?? 0) > 0) {
    return {
      type: (product.discount_type as "percentage" | "fixed") || "percentage",
      value: Number(product.discount_value),
    };
  }
  if (!categoryDiscounts) return null;
  const d = categoryDiscounts.find(
    (x) =>
      x.category.toLowerCase() === product.category.toLowerCase() &&
      x.enabled &&
      x.discount_value > 0,
  );
  if (!d) return null;
  return { type: d.discount_type, value: Number(d.discount_value) };
};

export const getProductDiscountedPrice = (
  price: number,
  product: ProductDiscountFields,
  categoryDiscounts: CategoryDiscount[] | undefined,
): number | null => {
  const d = resolveProductDiscount(product, categoryDiscounts);
  if (!d) return null;
  if (d.type === "percentage") return Math.round(price * (1 - d.value / 100));
  return Math.max(0, price - d.value);
};

export const getProductDiscountLabel = (
  product: ProductDiscountFields,
  categoryDiscounts: CategoryDiscount[] | undefined,
): string | null => {
  const d = resolveProductDiscount(product, categoryDiscounts);
  if (!d) return null;
  return d.type === "percentage" ? `${d.value}% OFF` : `৳${d.value} OFF`;
};
