import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Star, PenLine, Loader2 } from "lucide-react";
import { useProduct } from "@/hooks/useProducts";
import { useReviews, useSubmitReview } from "@/hooks/useReviews";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

const StarRating = ({ rating, size = 18 }: { rating: number; size?: number }) => (
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

const ReviewForm = ({ productId, onClose }: { productId: string; onClose: () => void }) => {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const submitReview = useSubmitReview();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    try {
      await submitReview.mutateAsync({ product_id: productId, name: name.trim(), rating, comment: comment.trim() });
      toast({ title: "Thank you!", description: "Your review has been submitted." });
      onClose();
    } catch {
      toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-luxury animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display text-xl font-semibold text-foreground">Write a Review</h3>
        <button onClick={onClose} className="font-body text-[12px] text-muted-foreground hover:text-foreground transition-colors">
          Cancel
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="font-body text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-2 block">
            Your Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            placeholder="Enter your name"
            className="w-full bg-background border border-border rounded-lg px-4 py-3 font-body text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30 transition-all"
          />
        </div>
        <div>
          <label className="font-body text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-2 block">
            Your Rating
          </label>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <button
                type="button"
                key={i}
                onClick={() => setRating(i + 1)}
                onMouseEnter={() => setHoveredStar(i + 1)}
                onMouseLeave={() => setHoveredStar(null)}
              >
                <Star
                  size={24}
                  className={
                    i < (hoveredStar ?? rating)
                      ? "fill-gold text-gold transition-colors"
                      : "text-border hover:text-gold/50 transition-colors"
                  }
                />
              </button>
            ))}
            <span className="font-body text-[13px] text-muted-foreground ml-2">{rating}.0</span>
          </div>
        </div>
        <div>
          <label className="font-body text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-2 block">
            Your Review
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={1000}
            placeholder="Share your experience with this watch..."
            className="w-full bg-background border border-border rounded-lg px-4 py-3 font-body text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30 resize-none h-28 transition-all"
          />
        </div>
        <Button variant="cta" size="default" type="submit" className="w-full gap-2" disabled={submitReview.isPending}>
          {submitReview.isPending ? <Loader2 size={16} className="animate-spin" /> : <PenLine size={16} />}
          {submitReview.isPending ? "Submitting…" : "Submit Review"}
        </Button>
      </form>
    </div>
  );
};

const ProductReviewsPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading, isError } = useProduct(id || "");
  const { data: dbReviews = [], isLoading: reviewsLoading, isError: reviewsError } = useReviews(id || "");
  const [showForm, setShowForm] = useState(false);

  // Merge JSONB reviews from product with database reviews
  const allReviews = [
    ...dbReviews.map((r) => ({
      name: r.name,
      rating: r.rating,
      comment: r.comment,
      verified: r.verified,
      date: format(new Date(r.created_at), "MMM d, yyyy"),
    })),
    ...(product?.reviews || []),
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-body text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-4xl text-foreground mb-4">{isError ? "Could Not Load Product" : "Product Not Found"}</h1>
          <Link to="/" className="text-gold hover:underline font-body text-sm">Return to Collection</Link>
        </div>
      </div>
    );
  }

  const totalReviews = product.reviewCount + dbReviews.length;

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Navbar />

      <div className="pt-24 pb-4 max-w-[1440px] mx-auto px-6 lg:px-10">
        <Link
          to={`/product/${product.id}`}
          className="inline-flex items-center gap-2 font-body text-[12px] font-medium tracking-wide text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} /> Back to {product.name}
        </Link>
      </div>

      <section className="max-w-3xl mx-auto px-6 lg:px-10 pb-16 lg:pb-24">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="font-body text-[10px] font-bold tracking-[0.3em] uppercase text-gold mb-2">
            {product.brand}
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-light text-foreground mb-4">
            {product.name} — <span className="italic font-semibold text-gold">Reviews</span>
          </h1>
          <div className="flex items-center justify-center gap-3 mb-6">
            <StarRating rating={product.rating} size={20} />
            <span className="font-display text-2xl font-semibold text-foreground">
              {product.rating.toFixed(1)}
            </span>
            <span className="font-body text-[13px] text-muted-foreground">
              ({totalReviews} reviews)
            </span>
          </div>
          {!showForm && (
            <Button variant="gold" size="default" className="gap-2" onClick={() => setShowForm(true)}>
              <PenLine size={16} />
              Write a Review
            </Button>
          )}
        </div>

        {/* Review form */}
        {showForm && (
          <div className="mb-10">
            <ReviewForm productId={product.id} onClose={() => setShowForm(false)} />
          </div>
        )}

        {/* Reviews list */}
        {reviewsLoading ? (
          <div className="text-center py-16">
            <Loader2 className="mx-auto animate-spin text-gold" size={24} />
          </div>
        ) : reviewsError ? (
          <div className="text-center py-16">
            <p className="font-body text-muted-foreground">Could not load reviews right now.</p>
          </div>
        ) : allReviews.length > 0 ? (
          <div className="space-y-6">
            {allReviews.map((r, idx) => (
              <div
                key={`${r.name}-${idx}`}
                className="bg-card border border-border rounded-lg p-6 shadow-luxury"
              >
                <div className="flex items-center justify-between mb-3">
                  <StarRating rating={r.rating} size={16} />
                  <span className="font-body text-[10px] text-muted-foreground">{r.date}</span>
                </div>
                <p className="font-body text-[13px] text-muted-foreground leading-relaxed mb-4">
                  "{r.comment}"
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center font-display text-xs font-semibold text-foreground">
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
        ) : (
          <div className="text-center py-16">
            <p className="font-body text-muted-foreground">No reviews yet. Be the first to share your experience!</p>
          </div>
        )}
      </section>

      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default ProductReviewsPage;
