import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthReady } from "@/hooks/useAuthReady";
import { runWithSessionRecovery, withTimeout } from "@/lib/supabase-resilience";

export interface DbReview {
  id: string;
  product_id: string;
  name: string;
  rating: number;
  comment: string;
  verified: boolean;
  created_at: string;
}

export const useReviews = (productId: string) => {
  const { isReady, authKey } = useAuthReady();

  return useQuery({
    queryKey: ["reviews", productId, authKey],
    queryFn: async () => {
      return withTimeout(
        runWithSessionRecovery(async () => {
          const { data, error } = await supabase
            .from("reviews")
            .select("*")
            .eq("product_id", productId)
            .order("created_at", { ascending: false });

          if (error) throw error;
          return (data || []) as DbReview[];
        })
      );
    },
    enabled: isReady && !!productId,
    retry: 5,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
};

export const useSubmitReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (review: { product_id: string; name: string; rating: number; comment: string }) => {
      await withTimeout(
        runWithSessionRecovery(async () => {
          const { error } = await supabase.from("reviews").insert({
            product_id: review.product_id,
            name: review.name,
            rating: review.rating,
            comment: review.comment,
          });

          if (error) throw error;
        })
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reviews", variables.product_id] });
    },
  });
};
