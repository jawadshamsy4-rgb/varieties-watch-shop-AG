import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthReady } from "@/hooks/useAuthReady";
import { runWithSessionRecovery, withTimeout } from "@/lib/supabase-resilience";

export interface ReviewStats {
  averageRating: number;
  reviewCount: number;
}

export const useReviewStats = () => {
  const { isReady, authKey } = useAuthReady();

  return useQuery({
    queryKey: ["review-stats", authKey],
    queryFn: async () => {
      return withTimeout(
        runWithSessionRecovery(async () => {
          const { data, error } = await supabase
            .from("reviews")
            .select("product_id, rating");

          if (error) throw error;

          const statsMap: Record<string, ReviewStats> = {};
          const grouped: Record<string, number[]> = {};

          for (const row of data || []) {
            if (!grouped[row.product_id]) grouped[row.product_id] = [];
            grouped[row.product_id].push(row.rating);
          }

          for (const [productId, ratings] of Object.entries(grouped)) {
            const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
            statsMap[productId] = {
              averageRating: Math.round(avg * 10) / 10,
              reviewCount: ratings.length,
            };
          }

          return statsMap;
        })
      );
    },
    enabled: isReady,
    retry: 5,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    staleTime: 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    placeholderData: keepPreviousData,
  });
};
