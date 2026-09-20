import { useState, useEffect } from "react";
import { trackViewContent, trackAddToCart } from "@/lib/tracking";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Star, ShieldCheck, Truck, RotateCcw, CreditCard, Smartphone, Banknote, Droplets, Wind, Clock, Sun, Moon, Sparkles, ShoppingCart, PenLine, Loader2 } from "lucide-react";
import ProductImageGallery from "@/components/ProductImageGallery";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import ProductCard from "@/components/ProductCard";
import OrderModal from "@/components/OrderModal";
import DiscoveryWatchSelector from "@/components/DiscoveryWatchSelector";
import { useProduct, useProducts } from "@/hooks/useProducts";
import { useCategoryDiscounts, getProductDiscountedPrice, getProductDiscountLabel } from "@/hooks/useCategoryDiscounts";
import { useReviews, useSubmitReview } from "@/hooks/useReviews";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

const NotesPill = ({ label }: { label: string }) => (
  <span className="font-body text-[11px] font-medium bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full">
    {label}
  </span>
);

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} size={16} className={i < Math.floor(rating) ? "fill-gold text-gold" : i < rating ? "fill-gold/50 text-gold" : "text-border"} />
    ))}
  </div>
);

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading, isError } = useProduct(id || "");
  const { data: allProducts = [] } = useProducts();
  const { data: dbReviews = [] } = useReviews(id || "");
  const { data: discounts } = useCategoryDiscounts();
  const submitReview = useSubmitReview();
  const { addToCart } = useCart();
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [reviewName, setReviewName] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [orderOpen, setOrderOpen] = useState(false);
  const [discoverySelections, setDiscoverySelections] = useState<string[]>([]);

  // Track ViewContent when product loads
  useEffect(() => {
    if (product) {
      trackViewContent({
        product_name: product.name,
        price: product.variants[selectedVariant]?.price || product.price,
        product_id: product.id,
      });
    }
  }, [product?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-body text-muted-foreground">Loading product…</p>
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

  const actualReviewCount = allReviews.length;
  const actualRating = actualReviewCount > 0
    ? allReviews.reduce((sum, r) => sum + r.rating, 0) / actualReviewCount
    : 0;

  const related = allProducts.filter((p) => p.id !== product.id).slice(0, 4);
  const safeVariantIdx = Math.min(selectedVariant, product.variants.length - 1);
  const currentVariant = product.variants[safeVariantIdx] || product.variants[0];
  const currentPrice = currentVariant?.price || product.price;
  const categoryDiscountedPrice = getProductDiscountedPrice(currentPrice, product, discounts);
  const categoryDiscountLabel = getProductDiscountLabel(product, discounts);

  // Discovery set logic
  const isDiscovery = product.category.toLowerCase() === "smart";
  const discoveryGender: "men" | "women" = product.name.toLowerCase().includes("female") ? "women" : "men";
  const discoveryCount = (() => {
    if (!isDiscovery || !currentVariant) return 0;
    const sizeStr = currentVariant.size.toLowerCase();
    const match = sizeStr.match(/(\d+)\s*pieces/);
    return match ? parseInt(match[1], 10) : 5;
  })();

  // Reset selections when variant changes
  const handleVariantChange = (i: number) => {
    setSelectedVariant(i);
    setDiscoverySelections([]);
  };

  const validateDiscovery = (): boolean => {
    if (!isDiscovery) return true;
    const filled = discoverySelections.filter((s) => s !== "").length;
    if (filled < discoveryCount) {
      toast({ title: "Please select watches for all slots.", variant: "destructive" });
      return false;
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Navbar />

      {/* Back nav */}
      <div className="pt-24 pb-4 max-w-[1440px] mx-auto px-6 lg:px-10">
        <Link to="/" className="inline-flex items-center gap-2 font-body text-[12px] font-medium tracking-wide text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={14} /> Back to All Watches
        </Link>
      </div>

      {/* 1. Product Hero */}
      <section className="max-w-[1440px] mx-auto px-6 lg:px-10 pb-16 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          <ProductImageGallery
            images={product.images}
            productName={product.name}
            badge={product.badge}
            activeIndex={safeVariantIdx}
          />

          <div className="lg:sticky lg:top-28 animate-fade-in" style={{ animationDelay: "0.15s" }}>
            <p className="font-body text-[10px] font-bold tracking-[0.3em] uppercase text-gold mb-2">{product.brand}</p>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-light text-foreground mb-3">
              {product.name}
            </h1>
            <p className="font-display text-lg italic text-muted-foreground mb-6">{product.tagline}</p>

            <div className="flex items-baseline gap-3 mb-4 flex-wrap">
              {categoryDiscountedPrice !== null ? (
                <>
                  <span className="font-body text-3xl sm:text-4xl font-bold text-red-600">৳{categoryDiscountedPrice}</span>
                  <span className="font-body text-base sm:text-lg text-muted-foreground line-through font-bold">৳{currentPrice}</span>
                </>
              ) : (
                <>
                  <span className="font-body text-3xl sm:text-4xl font-bold text-foreground">৳{currentPrice}</span>
                  {product.originalPrice && safeVariantIdx === product.variants.length - 1 && (
                    <span className="font-body text-base sm:text-lg text-muted-foreground line-through font-bold">৳{product.originalPrice}</span>
                  )}
                </>
              )}
              {currentVariant && (
                <span className="font-body text-[11px] text-muted-foreground">/ {currentVariant.size}</span>
              )}
              {categoryDiscountLabel && (
                <span className="font-body text-[10px] font-bold tracking-wider uppercase bg-red-500 text-white px-2.5 py-1 rounded-full">
                  {categoryDiscountLabel}
                </span>
              )}
            </div>

            {/* Rating & Reviews display */}
            <div className="flex items-center gap-3 mb-8 flex-wrap">
              <div className="flex items-center gap-1.5">
                <StarRating rating={actualRating} />
                <span className="font-display text-lg font-semibold text-foreground">{actualRating.toFixed(1)}</span>
                <span className="font-body text-[12px] text-muted-foreground">({actualReviewCount} reviews)</span>
              </div>
              <span className="text-border">|</span>
              <Link to="/reviews" className="font-body text-[12px] font-medium text-gold hover:underline transition-colors">
                View Reviews
              </Link>
            </div>

            {/* Variant selector */}
            {product.variants.length > 0 && (
              <div className="mb-8">
                <p className="font-body text-[11px] font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-3">Select Variant</p>
                <div className="flex flex-wrap gap-3">
                  {product.variants.map((v, i) => (
                    <button
                      key={v.size}
                      onClick={() => handleVariantChange(i)}
                      className={`font-body text-[13px] font-medium px-5 py-3 rounded-lg border-2 transition-all duration-300 ${
                        safeVariantIdx === i
                          ? "border-gold bg-gold/10 text-foreground"
                          : "border-border text-muted-foreground hover:border-muted-foreground"
                      }`}
                    >
                      {v.size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Discovery watch selector */}
            {isDiscovery && discoveryCount > 0 && (
              <DiscoveryWatchSelector
                count={discoveryCount}
                genderCategory={discoveryGender}
                selections={discoverySelections}
                onSelectionsChange={setDiscoverySelections}
              />
            )}

            {/* Out of Stock notice */}
            {!product.inStock && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <p className="font-body text-sm font-semibold text-red-600">Out of Stock</p>
                <p className="font-body text-[12px] text-red-500">This product is currently unavailable.</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button variant="cta" size="xl" className="flex-1 gap-2 h-[48px] sm:h-14 py-3 sm:py-0 px-5 sm:px-10 items-center justify-center" disabled={!product.inStock} onClick={() => {
                if (!validateDiscovery()) return;
                const effectivePrice = categoryDiscountedPrice !== null ? categoryDiscountedPrice : currentPrice;
                trackAddToCart({
                  product_name: product.name,
                  price: effectivePrice,
                  quantity: 1,
                  product_id: product.id,
                });
                addToCart({
                  product_id: product.id,
                  product_name: product.name,
                  variant: currentVariant?.size || "Default",
                  price: effectivePrice,
                  image: product.image,
                  ...(isDiscovery ? { selected_perfumes: discoverySelections.filter(Boolean) } : {}),
                });
              }}>
                <ShoppingCart size={18} />
                {product.inStock ? <>Add to Cart — <span className="font-bold">৳{categoryDiscountedPrice !== null ? categoryDiscountedPrice : currentPrice}</span></> : 'Out of Stock'}
              </Button>
              <Button variant="gold" size="xl" className="flex-1 gap-2 h-[48px] sm:h-14 py-3 sm:py-0 px-5 sm:px-10 items-center justify-center" disabled={!product.inStock} onClick={() => {
                if (!validateDiscovery()) return;
                setOrderOpen(true);
              }}>
                {product.inStock ? 'Buy Now' : 'Unavailable'}
              </Button>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap gap-4 pt-6 border-t border-border">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ShieldCheck size={16} className="text-gold" />
                <span className="font-body text-[11px]">Secure Payment</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Truck size={16} className="text-gold" />
                <span className="font-body text-[11px]">Fast Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Fragrance Details */}
      {product.fragranceDetails?.type && (
        <section className="bg-card border-y border-border py-16 lg:py-24">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
            <span className="font-body text-[11px] font-semibold tracking-[0.35em] uppercase text-gold mb-4 block text-center">
              Fragrance Profile
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-light text-foreground text-center mb-12">
              Notes & <span className="italic font-semibold text-gold">Character</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={16} className="text-gold" />
                    <h3 className="font-body text-[11px] font-bold tracking-[0.2em] uppercase text-foreground">Top Notes</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.fragranceDetails.notes.top.map((n) => <NotesPill key={n} label={n} />)}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Droplets size={16} className="text-gold" />
                    <h3 className="font-body text-[11px] font-bold tracking-[0.2em] uppercase text-foreground">Heart Notes</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.fragranceDetails.notes.middle.map((n) => <NotesPill key={n} label={n} />)}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Wind size={16} className="text-gold" />
                    <h3 className="font-body text-[11px] font-bold tracking-[0.2em] uppercase text-foreground">Base Notes</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.fragranceDetails.notes.base.map((n) => <NotesPill key={n} label={n} />)}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {[
                  { icon: Sparkles, label: "Fragrance Type", value: product.fragranceDetails.type },
                  { icon: Clock, label: "Longevity", value: product.fragranceDetails.longevity },
                  { icon: Wind, label: "Sillage / Projection", value: product.fragranceDetails.sillage },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-4 p-4 bg-background rounded-lg border border-border">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <item.icon size={18} className="text-gold" />
                    </div>
                    <div>
                      <p className="font-body text-[10px] font-bold tracking-[0.15em] uppercase text-muted-foreground">{item.label}</p>
                      <p className="font-display text-lg font-medium text-foreground">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col items-center justify-center p-8 bg-background rounded-lg border border-border text-center">
                <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mb-4">
                  {product.fragranceDetails.bestTime?.includes("Night") ? <Moon size={28} className="text-gold" /> : <Sun size={28} className="text-gold" />}
                </div>
                <p className="font-body text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-1">Best Time to Wear</p>
                <p className="font-display text-2xl font-medium text-foreground">{product.fragranceDetails.bestTime}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Product Description */}
      {product.description && (
        <section className="py-16 lg:py-24 border-b border-border">
          <div className="max-w-3xl mx-auto px-6 lg:px-10 text-center">
            <span className="font-body text-[11px] font-semibold tracking-[0.35em] uppercase text-gold mb-4 block">
              About This Watch
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-light text-foreground mb-8">
              Product <span className="italic font-semibold text-gold">Description</span>
            </h2>
            <p className="font-body text-base md:text-lg leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          </div>
        </section>
      )}

      {/* 3. Story / Description */}
      {product.story && (
        <section className="py-16 lg:py-24">
          <div className="max-w-3xl mx-auto px-6 lg:px-10 text-center">
            <span className="font-body text-[11px] font-semibold tracking-[0.35em] uppercase text-gold mb-4 block">
              The Story
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-light text-foreground mb-8">
              Behind the <span className="italic font-semibold text-gold">Watch</span>
            </h2>
            <p className="font-display text-lg md:text-xl leading-relaxed text-muted-foreground italic">
              "{product.story}"
            </p>
          </div>
        </section>
      )}

      {/* 5. Reviews */}
      <section className="py-16 lg:py-24">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
          <div className="text-center mb-12">
            <span className="font-body text-[11px] font-semibold tracking-[0.35em] uppercase text-gold mb-4 block">
              Reviews
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-light text-foreground mb-4">
              Customer <span className="italic font-semibold text-gold">Feedback</span>
            </h2>
            <div className="flex items-center justify-center gap-3">
              <StarRating rating={actualRating} />
              <span className="font-display text-2xl font-semibold text-foreground">{actualRating.toFixed(1)}</span>
              <span className="font-body text-[13px] text-muted-foreground">({actualReviewCount} reviews)</span>
            </div>
          </div>

          {allReviews.length > 0 && (
            <div className="px-12 mb-12">
              <Carousel
                opts={{ align: "start", loop: allReviews.length > 3 }}
                className="w-full"
              >
                <CarouselContent className="-ml-4">
                  {allReviews.map((r, idx) => (
                    <CarouselItem
                      key={`${r.name}-${idx}`}
                      className="pl-4 basis-full md:basis-1/2 lg:basis-1/3"
                    >
                      <div className="bg-card border border-border rounded-lg p-6 shadow-luxury h-full flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                          <StarRating rating={r.rating} />
                          <span className="font-body text-[10px] text-muted-foreground">{r.date}</span>
                        </div>
                        <p className="font-body text-[13px] text-muted-foreground leading-relaxed mb-4 flex-1">"{r.comment}"</p>
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
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>
          )}

          {/* Leave review */}
          <div className="max-w-xl mx-auto bg-card border border-border rounded-lg p-6 shadow-luxury">
            <h3 className="font-display text-xl font-semibold text-foreground mb-4">Leave a Review</h3>
            <div>
              <label className="font-body text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-2 block">Your Name</label>
              <input
                type="text"
                value={reviewName}
                onChange={(e) => setReviewName(e.target.value)}
                maxLength={100}
                placeholder="Enter your name"
                className="w-full bg-background border border-border rounded-lg px-4 py-3 font-body text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30 mb-4"
              />
            </div>
            <div className="flex items-center gap-2 mb-4">
              <span className="font-body text-[12px] text-muted-foreground mr-2">Your Rating:</span>
              {Array.from({ length: 5 }).map((_, i) => (
                <button key={i} onClick={() => setReviewRating(i + 1)}>
                  <Star size={20} className={i < reviewRating ? "fill-gold text-gold" : "text-border hover:text-gold/50"} />
                </button>
              ))}
            </div>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              maxLength={1000}
              placeholder="Share your experience with this watch..."
              className="w-full bg-background border border-border rounded-lg p-4 font-body text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30 resize-none h-24 mb-4"
            />
            <Button
              variant="cta"
              size="default"
              disabled={submitReview.isPending}
              onClick={async () => {
                if (!reviewName.trim() || !reviewText.trim()) {
                  toast({ title: "Please fill in all fields", variant: "destructive" });
                  return;
                }
                try {
                  await submitReview.mutateAsync({
                    product_id: product.id,
                    name: reviewName.trim(),
                    rating: reviewRating,
                    comment: reviewText.trim(),
                  });
                  toast({ title: "Thank you!", description: "Your review has been submitted." });
                  setReviewName("");
                  setReviewText("");
                  setReviewRating(5);
                } catch {
                  toast({ title: "Something went wrong", variant: "destructive" });
                }
              }}
              className="gap-2"
            >
              {submitReview.isPending ? <Loader2 size={16} className="animate-spin" /> : <PenLine size={16} />}
              {submitReview.isPending ? "Submitting…" : "Submit Review"}
            </Button>
          </div>
        </div>
      </section>

      {/* 6. Related Products */}
      {related.length > 0 && (
        <section className="bg-card border-y border-border py-16 lg:py-24">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
            <div className="text-center mb-12">
              <span className="font-body text-[11px] font-semibold tracking-[0.35em] uppercase text-gold mb-4 block">
                You May Also Like
              </span>
              <h2 className="font-display text-3xl md:text-4xl font-light text-foreground">
                Related <span className="italic font-semibold text-gold">Watches</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((p, i) => (
                <ProductCard key={p.id} {...p} delay={i * 0.1} />
              ))}
            </div>
          </div>
        </section>
      )}


      <Footer />
      <MobileBottomNav />

      {product.variants.length > 0 && (
        <OrderModal
          open={orderOpen}
          onOpenChange={setOrderOpen}
          productName={product.name}
          variants={product.variants}
          selectedVariant={safeVariantIdx}
          selectedWatches={isDiscovery ? discoverySelections.filter(Boolean) : undefined}
          category={product.category}
          productDiscount={{
            discount_enabled: product.discount_enabled,
            discount_type: product.discount_type,
            discount_value: product.discount_value,
          }}
        />
      )}
    </div>
  );
};

export default ProductDetailPage;
