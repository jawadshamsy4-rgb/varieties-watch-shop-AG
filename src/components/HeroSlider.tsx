import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useHeroSlides } from "@/hooks/useHeroSlides";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { cdnImage, cdnSrcSet } from "@/lib/cdnImage";

type Device = "pc" | "tablet" | "phone";

const getDevice = (): Device => {
  if (typeof window === "undefined") return "pc";
  const w = window.innerWidth;
  if (w < 768) return "phone";
  if (w < 1024) return "tablet";
  return "pc";
};

const pickImage = (slide: { pc_image_url: string | null; tablet_image_url: string | null; phone_image_url: string | null }, device: Device) => {
  if (device === "phone") return slide.phone_image_url || slide.tablet_image_url || slide.pc_image_url;
  if (device === "tablet") return slide.tablet_image_url || slide.pc_image_url || slide.phone_image_url;
  return slide.pc_image_url || slide.tablet_image_url || slide.phone_image_url;
};

const HeroSlider = () => {
  const { data: slides = [] } = useHeroSlides(true);
  const [device, setDevice] = useState<Device>(getDevice());
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const onResize = () => setDevice(getDevice());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Filter slides that have an image for this device (or any fallback)
  const visibleSlides = useMemo(
    () => slides.filter((s) => pickImage(s, device)),
    [slides, device]
  );

  useEffect(() => {
    if (visibleSlides.length <= 1) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % visibleSlides.length);
    }, 5000);
    return () => clearInterval(t);
  }, [visibleSlides.length]);

  useEffect(() => {
    if (index >= visibleSlides.length) setIndex(0);
  }, [visibleSlides.length, index]);

  const goPrev = () => setIndex((i) => (i - 1 + visibleSlides.length) % visibleSlides.length);
  const goNext = () => setIndex((i) => (i + 1) % visibleSlides.length);

  const currentSlide = visibleSlides[index];
  const ctaUrl = currentSlide?.link_url || "/collection/all";
  const isExternal = ctaUrl.startsWith("http");

  if (visibleSlides.length === 0) {
    return (
      <section className="relative w-full pt-[88px] md:pt-[96px] bg-background">
        <div className="relative h-[50vh] sm:h-[56vh] md:h-[62vh] max-h-[608px] min-h-[352px] w-full bg-muted" />
      </section>
    );
  }

  return (
    <section className="relative w-full pt-[88px] md:pt-[96px] bg-background">
      <div className="relative h-[50vh] sm:h-[56vh] md:h-[62vh] max-h-[608px] min-h-[352px] w-full overflow-hidden">
        {visibleSlides.map((slide, i) => {
          const img = pickImage(slide, device)!;
          const targetWidth = device === "phone" ? 800 : device === "tablet" ? 1280 : 1920;
          const content = (
            <img
              src={cdnImage(img, { width: targetWidth, quality: 82 })}
              srcSet={cdnSrcSet(img, [800, 1280, 1920], 82)}
              sizes="100vw"
              alt="Varieties Watch Shop featured watch collection"
              width={targetWidth}
              height={Math.round(targetWidth * 0.55)}
              className="absolute inset-0 w-full h-full object-cover"
              loading={i === 0 ? "eager" : "lazy"}
              decoding={i === 0 ? "sync" : "async"}
              fetchPriority={i === 0 ? "high" : "low"}
            />
          );
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ${i === index ? "opacity-100 z-10" : "opacity-0 z-0"}`}
            >
              {slide.link_url ? (
                slide.link_url.startsWith("http") ? (
                  <a href={slide.link_url} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                    {content}
                  </a>
                ) : (
                  <Link to={slide.link_url} className="block w-full h-full">
                    {content}
                  </Link>
                )
              ) : (
                content
              )}
            </div>
          );
        })}

        {/* Text + CTA overlay */}
        <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute inset-0 z-20 flex items-end pb-10 sm:pb-14 md:pb-16 pointer-events-none">
          <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-10">
            <div className="max-w-xl text-silver">
              <span className="font-body text-[10px] sm:text-[11px] font-semibold tracking-[0.4em] uppercase text-gold mb-3 sm:mb-5 block">
                Timeless Elegance
              </span>
              <h1 className="font-display text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extralight tracking-[-0.02em] leading-[1.05] mb-4 sm:mb-6 text-silver">
                Where <span className="italic text-gold">Style</span> Meets Elegance
              </h1>
              <p className="hidden sm:block font-body text-[13px] md:text-[14px] text-silver/80 max-w-md mb-6 sm:mb-8 leading-relaxed">
                Discover a curated collection of luxury timepieces — designed to elevate every occasion.
              </p>
              <Button
                variant="cta"
                size="sm"
                className="gap-1.5 sm:gap-2 rounded-none bg-gold text-primary-foreground hover:bg-gold/90 pointer-events-auto text-[10px] sm:text-sm h-8 sm:h-11 px-3 sm:px-6 tracking-wider"
                asChild
              >
                {isExternal ? (
                  <a href={ctaUrl} target="_blank" rel="noopener noreferrer">
                    Shop Collection <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  </a>
                ) : (
                  <Link to={ctaUrl}>
                    Shop Collection <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Link>
                )}
              </Button>
            </div>
          </div>
        </div>

        {visibleSlides.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous slide"
              onClick={goPrev}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center rounded-full bg-background/40 hover:bg-background/70 backdrop-blur-sm border border-gold/30 text-foreground transition-all"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={goNext}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center rounded-full bg-background/40 hover:bg-background/70 backdrop-blur-sm border border-gold/30 text-foreground transition-all"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
            {visibleSlides.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-gold" : "w-1.5 bg-silver/40"}`}
              />
            ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default HeroSlider;