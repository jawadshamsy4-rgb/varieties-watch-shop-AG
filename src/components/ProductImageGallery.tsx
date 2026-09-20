import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
  badge?: string;
  activeIndex?: number;
}

const ProductImageGallery = ({ images, productName, badge, activeIndex }: ProductImageGalleryProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (el) el.addEventListener("scroll", updateScrollState);
    return () => el?.removeEventListener("scroll", updateScrollState);
  }, [images]);

  const scrollTo = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const nextIdx = Math.max(0, Math.min(index, images.length - 1));
    setCurrentIndex(nextIdx);
    el.scrollTo({ left: nextIdx * el.clientWidth, behavior: "smooth" });
  };

  // Sync external activeIndex (e.g. from variant selection) with the gallery
  useEffect(() => {
    if (activeIndex === undefined) return;
    if (activeIndex < 0 || activeIndex >= images.length) return;
    if (activeIndex === currentIndex) return;
    const el = scrollRef.current;
    setCurrentIndex(activeIndex);
    if (el) {
      el.scrollTo({ left: activeIndex * el.clientWidth, behavior: "smooth" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, images.length]);

  if (images.length <= 1) {
    return (
      <div className="relative aspect-square rounded-lg overflow-hidden bg-card border border-border shadow-luxury-lg animate-fade-in">
        <img src={images[0]} alt={productName} className="w-full h-full object-cover" width={800} height={1024} decoding="async" />
        {badge && (
          <span className="absolute top-6 left-6 font-body text-[10px] font-bold tracking-[0.15em] uppercase bg-gold text-primary-foreground px-4 py-2 rounded-full">
            {badge}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="relative animate-fade-in">
      <div
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide aspect-square rounded-lg border border-border shadow-luxury-lg"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        onScroll={() => {
          const el = scrollRef.current;
          if (el) {
            const idx = Math.round(el.scrollLeft / el.clientWidth);
            setCurrentIndex(idx);
          }
        }}
      >
        {images.map((img, i) => (
          <div key={i} className="flex-none w-full h-full snap-center">
            <img
              src={img}
              alt={`${productName} - Image ${i + 1}`}
              className="w-full h-full object-cover"
              width={800}
              height={1024}
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
            />
          </div>
        ))}
      </div>

      {badge && (
        <span className="absolute top-6 left-6 z-10 font-body text-[10px] font-bold tracking-[0.15em] uppercase bg-gold text-primary-foreground px-4 py-2 rounded-full">
          {badge}
        </span>
      )}

      {/* Navigation arrows */}
      {canScrollLeft && (
        <button
          aria-label="Previous image"
          onClick={() => scrollTo(currentIndex - 1)}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center text-foreground hover:bg-background transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
      )}
      {canScrollRight && (
        <button
          aria-label="Next image"
          onClick={() => scrollTo(currentIndex + 1)}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center text-foreground hover:bg-background transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      )}

      {/* Dots indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
        {images.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to image ${i + 1}`}
            onClick={() => scrollTo(i)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === currentIndex ? "bg-gold w-4" : "bg-foreground/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductImageGallery;
