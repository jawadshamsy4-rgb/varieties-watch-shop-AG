import { Star, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useAuthReady } from "@/hooks/useAuthReady";
import { runWithSessionRecovery, withTimeout } from "@/lib/supabase-resilience";
import { useRef, useState, useEffect } from "react";

const ReviewsSection = () => {
  const { isReady, authKey } = useAuthReady();
  const { data: reviews = [], isLoading, isError } = useQuery({
    queryKey: ["top-reviews", authKey],
    enabled: isReady,
    queryFn: async () =>
      withTimeout(
        runWithSessionRecovery(async () => {
          const { data, error } = await supabase
            .from("reviews")
            .select("*, products(name, brand, image_url)")
            .gte("rating", 4)
            .order("rating", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(8);

          if (error) throw error;
          return data || [];
        })
      ),
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 10_000,
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (reviews.length === 0) return;
    const el = scrollRef.current;
    if (!el) return;

    let animId: number;
    let pos = 0;
    const speed = 0.5; // px per frame

    const step = () => {
      if (!paused) {
        pos += speed;
        // Reset when we've scrolled through the first set
        const half = el.scrollWidth / 2;
        if (pos >= half) pos = 0;
        el.style.transform = `translateX(-${pos}px)`;
      }
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [reviews, paused]);

  // Duplicate reviews for seamless loop
  const displayReviews = reviews.length > 0 ? [...reviews, ...reviews] : [];

  return (
    <section id="reviews" className="pt-10 pb-24 lg:pt-16 lg:pb-32">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
        <div className="text-center mb-14">
          <span className="font-body text-[11px] font-semibold tracking-[0.35em] uppercase text-gold mb-4 block">
            Testimonials
          </span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-light text-foreground">
            What Our <span className="italic font-semibold text-gold">Clients</span> Say
          </h2>
        </div>

        {isLoading ? (
          <div className="text-center py-16">
            <Loader2 className="mx-auto animate-spin text-gold" size={24} />
          </div>
        ) : isError ? (
          <p className="text-center font-body text-muted-foreground">Could not load reviews right now.</p>
        ) : reviews.length > 0 ? (
          <div
            className="overflow-hidden"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div ref={scrollRef} className="flex gap-6 will-change-transform" style={{ width: "max-content" }}>
              {displayReviews.map((r: any, idx: number) => (
                <div key={`${r.id}-${idx}`} className="bg-card border border-border rounded-lg p-6 shadow-luxury w-[300px] md:w-[340px] shrink-0">
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} className={i < r.rating ? "fill-gold text-gold" : "text-border"} />
                    ))}
                  </div>
                  <p className="font-body text-[13px] text-muted-foreground leading-relaxed mb-4">"{r.comment}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-display text-sm font-semibold text-foreground">
                      {r.name[0]}
                    </div>
                    <span className="font-body text-[12px] font-medium text-foreground">{r.name}</span>
                    {r.verified && (
                      <span className="font-body text-[9px] font-bold tracking-wider uppercase bg-gold/10 text-gold px-2 py-0.5 rounded-full">
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-center font-body text-muted-foreground">No reviews yet.</p>
        )}

        {reviews.length > 0 && (
          <div className="text-center mt-10">
            <Link
              to="/reviews"
              className="font-body text-[12px] font-semibold tracking-wide text-gold hover:underline transition-colors"
            >
              View All Reviews →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default ReviewsSection;
