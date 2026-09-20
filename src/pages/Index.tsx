import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import HeroSlider from "@/components/HeroSlider";
import FeaturesBar from "@/components/FeaturesBar";
import ProductCard from "@/components/ProductCard";
import CategoriesShowcase from "@/components/CategoriesShowcase";
import BrandStory from "@/components/BrandStory";
import BrandGrid from "@/components/BrandGrid";
import MobileBottomNav from "@/components/MobileBottomNav";
import StatsSection from "@/components/StatsSection";
import ReviewsSection from "@/components/ReviewsSection";
import Footer from "@/components/Footer";
import GetInTouchSection from "@/components/GetInTouchSection";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useTrendingProducts } from "@/hooks/useTrendingProducts";
import { useReviewStats } from "@/hooks/useReviewStats";

const Index = () => {
  const { data: products = [], isLoading, isError, refetch } = useTrendingProducts();
  const { data: reviewStats = {} } = useReviewStats();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden pb-16 md:pb-0">
      <Helmet>
        <title>Watch Price in Bangladesh | Original Watches BD — Varieties Watch Shop</title>
        <meta name="description" content="Watch price in Bangladesh — shop original men's, women's & couple watches in BD with nationwide cash on delivery from Varieties Watch Shop." />
        <link rel="canonical" href="https://www.varietieswatchshop.com/" />
        <meta property="og:url" content="https://www.varietieswatchshop.com/" />
      </Helmet>
      <Navbar />
      <main>
      <h1 className="sr-only">Watch Price in Bangladesh — Original Watches in BD</h1>
      <HeroSlider />

      {/* Featured / Trending */}
      <section id="collection" aria-labelledby="trending-heading" className="py-12 md:py-20 lg:py-28 bg-background">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <h2 id="trending-heading" className="sr-only">Trending Watches in Bangladesh</h2>
          <div className="flex items-center justify-start mb-8 md:mb-10">
            <Link
              to="/collection/all"
              className="font-body text-[11px] tracking-[0.3em] uppercase text-gold hover:text-gold-light border-b border-gold/40 pb-1 transition-colors"
            >
              All Watches →
            </Link>
          </div>

          {isLoading ? (
            <div className="text-center py-20">
              <p className="font-body text-foreground/60">Loading watches…</p>
            </div>
          ) : isError ? (
            <div className="text-center py-20">
              <p className="font-body text-foreground/60 mb-4">Could not load products. Please try again.</p>
              <Button variant="outline" onClick={() => refetch()}>Retry</Button>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-body text-foreground/60">No products available yet.</p>
            </div>
          ) : (
            <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
              {products.slice(0, 8).map((product, idx) => {
                const stats = reviewStats[product.id];
                return (
                  <ProductCard
                    key={product.id}
                    {...product}
                    rating={stats?.averageRating ?? 0}
                    reviewCount={stats?.reviewCount ?? 0}
                    delay={idx * 0.08}
                  />
                );
              })}
            </div>
            <div className="flex justify-start mt-6 md:mt-8">
              <Link
                to="/collection/all"
                className="inline-flex items-center gap-1.5 h-8 sm:h-9 px-3 rounded-full bg-transparent text-gold hover:text-gold-light transition-colors font-body text-[11px] sm:text-[12px] font-medium tracking-wide"
              >
                See more
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            </>
          )}
        </div>
      </section>

      <BrandGrid />
      <CategoriesShowcase />
      <BrandStory />
      <FeaturesBar />
      <StatsSection />
      <ReviewsSection />
      <GetInTouchSection />
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default Index;
