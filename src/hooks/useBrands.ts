import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Brand {
  id: string;
  label: string;
  image_url: string | null;
  link_url: string | null;
  display_order: number;
  is_active: boolean;
}

const fetchBrands = async (activeOnly: boolean): Promise<Brand[]> => {
  let query = (supabase.from("brands" as any).select("*") as any).order("display_order", { ascending: true });
  if (activeOnly) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as Brand[];
};

export const useBrands = (activeOnly = true) =>
  useQuery({
    queryKey: ["brands", activeOnly],
    queryFn: () => fetchBrands(activeOnly),
    staleTime: 30_000,
  });