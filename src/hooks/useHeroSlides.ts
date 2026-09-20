import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HeroSlide {
  id: string;
  pc_image_url: string | null;
  tablet_image_url: string | null;
  phone_image_url: string | null;
  link_url: string | null;
  display_order: number;
  is_active: boolean;
}

const fetchHeroSlides = async (activeOnly: boolean): Promise<HeroSlide[]> => {
  let query = (supabase.from("hero_slides" as any).select("*") as any).order("display_order", { ascending: true });
  if (activeOnly) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as HeroSlide[];
};

export const useHeroSlides = (activeOnly = true) =>
  useQuery({
    queryKey: ["hero-slides", activeOnly],
    queryFn: () => fetchHeroSlides(activeOnly),
    staleTime: 30_000,
  });