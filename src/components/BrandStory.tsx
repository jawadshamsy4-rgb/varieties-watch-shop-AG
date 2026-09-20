import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";

const BrandStory = () => {
  return (
    <section className="py-16 md:py-24 lg:py-32 bg-background border-t border-border">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
        <div className="lg:col-span-5 order-2 lg:order-1">
          <div className="relative aspect-[4/5] overflow-hidden bg-card">
            <img
              src={heroBg}
              alt="Craftsmanship"
              loading="lazy"
              width={800}
              height={1000}
              className="w-full h-full object-cover grayscale contrast-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent" />
          </div>
        </div>
        <div className="lg:col-span-7 order-1 lg:order-2">
          <span className="font-body text-[11px] tracking-[0.4em] uppercase text-foreground/50 block mb-5">
            — 02 / The Boutique
          </span>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extralight leading-[0.95] tracking-[-0.02em] text-foreground mb-8">
            Where every <span className="italic">second</span> is curated by hand.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-10 mb-10">
            <p className="font-body text-[14px] leading-relaxed text-foreground/70">
              Founded in Chittagong, Varieties Watch Shop sources timepieces from across the world — from heritage Swiss-style mechanicals to next-generation smartwatches.
            </p>
            <p className="font-body text-[14px] leading-relaxed text-foreground/70">
              Every watch on our shelf is hand-inspected, authenticated and delivered with care. We exist for the people who believe time is the only luxury that matters.
            </p>
          </div>
          <Link
            to="/collection/higher-grade"
            className="inline-block font-body text-[11px] tracking-[0.3em] uppercase text-foreground border-b border-foreground/40 hover:border-foreground pb-1 transition-colors"
          >
            Discover the Luxury Edit →
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BrandStory;