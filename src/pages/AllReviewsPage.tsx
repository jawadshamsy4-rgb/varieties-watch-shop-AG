import { Link } from "react-router-dom";
import { Star, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { format } from "date-fns";
import { useAuthReady } from "@/hooks/useAuthReady";
import { runWithSessionRecovery, withTimeout } from "@/lib/supabase-resilience";
import { cdnImage } from "@/lib/cdnImage";

interface ReviewWithProduct {
  id: string;
  product_id: string;
  name: string;
  rating: number;
  comment: string;
  verified: boolean;
  created_at: string;
  products: { name: string; brand: string; image_url: string } | null;
}

const StarRating = ({ rating, size = 16 }: { rating: number; size?: number }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={size}
        className={
          i < Math.floor(rating)
            ? "fill-gold text-gold"
            : i < rating
            ? "fill-gold/50 text-gold"
            : "text-border"
        }
      />
    ))}
  </div>
);

const AllReviewsPage = () => {
  const { isReady, authKey } = useAuthReady();
  const { data: reviews = [], isLoading, isError } = useQuery({
    queryKey: ["all-reviews", authKey],
    enabled: isReady,
    queryFn: async () =>
      withTimeout(
        runWithSessionRecovery(async () => {
          const { data, error } = await supabase
            .from("reviews")
            .select("*, products(name, brand, image_url)")
            .order("created_at", { ascending: false });

          if (error) throw error;
          return (data || []) as ReviewWithProduct[];
        })
      ),
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 10_000,
  });

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Navbar />

      <section className="pt-24 pb-16 lg:pb-24 max-w-6xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-12">
          <p className="font-body text-[10px] font-bold tracking-[0.3em] uppercase text-gold mb-2">
            Customer Feedback
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-light text-foreground mb-3">
            All <span className="italic font-semibold text-gold">Reviews</span>
          </h1>
          <p className="font-body text-[13px] text-muted-foreground">
            {reviews.length} review{reviews.length !== 1 ? "s" : ""} from our customers
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-16">
            <Loader2 className="mx-auto animate-spin text-gold" size={24} />
          </div>
        ) : isError ? (
          <div className="text-center py-16">
            <p className="font-body text-muted-foreground">Could not load reviews right now.</p>
          </div>
        ) : reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="bg-card border border-border rounded-lg p-6 shadow-luxury flex flex-col"
              >
                {r.products && (
                  <Link
                    to={`/product/${r.product_id}`}
                    className="flex items-center gap-3 mb-4 group"
                  >
                    <img
                      src={cdnImage(r.products.image_url, { width: 160 })}
                      alt={r.products.name}
                      loading="lazy"
                      decoding="async"
                      className="w-14 h-[70px] rounded-md object-cover object-center bg-background border border-border shrink-0"
                    />
                    <div>
                      <p className="font-body text-[10px] font-bold tracking-[0.15em] uppercase text-muted-foreground">
                        {r.products.brand}
                      </p>
                      <p className="font-body text-[13px] font-medium text-foreground group-hover:text-gold transition-colors">
                        {r.products.name}
                      </p>
                    </div>
                  </Link>
                )}

                <div className="flex items-center justify-between mb-3">
                  <StarRating rating={r.rating} />
                  <span className="font-body text-[10px] text-muted-foreground">
                    {format(new Date(r.created_at), "MMM d, yyyy")}
                  </span>
                </div>
                <p className="font-body text-[13px] text-muted-foreground leading-relaxed mb-4 flex-1">
                  "{r.comment}"
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center font-display text-xs font-semibold text-foreground">
                    {r.name[0]}
                  </div>
                  <span className="font-body text-[12px] font-medium text-foreground">
                    {r.name}
                  </span>
                  {r.verified && (
                    <span className="font-body text-[9px] font-bold tracking-wider uppercase bg-gold/10 text-gold px-2 py-0.5 rounded-full">
                      Verified
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="font-body text-muted-foreground">
              No reviews yet. Be the first to share your experience!
            </p>
          </div>
        )}
      </section>

      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default AllReviewsPage;
