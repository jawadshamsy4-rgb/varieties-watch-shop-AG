import React from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import ProductCard from "@/components/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { useReviewStats } from "@/hooks/useReviewStats";
import { useBrands } from "@/hooks/useBrands";
import {
  useCategoryDiscounts,
  getProductDiscountedPrice,
  type CategoryDiscount,
} from "@/hooks/useCategoryDiscounts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown } from "lucide-react";

type SortOption = "recommended" | "price-asc" | "price-desc";

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const getEffectivePrice = (
  product: { price: number; variants?: { price: number }[]; category: string; discount_enabled?: boolean; discount_type?: "percentage" | "fixed"; discount_value?: number },
  discounts: CategoryDiscount[],
) => {
  const variantPrices = (product.variants || [])
    .map((v) => Number(v.price))
    .filter((n) => !isNaN(n));
  const base = variantPrices.length > 0 ? Math.min(...variantPrices) : product.price;
  const discounted = getProductDiscountedPrice(base, product, discounts);
  return discounted ?? base;
};

const BrandCollectionPage = () => {
  const { slug = "" } = useParams<{ slug: string }>();
  const { data: products = [], isLoading, isError, refetch } = useProducts();
  const { data: reviewStats = {} } = useReviewStats();
  const { data: discounts = [] } = useCategoryDiscounts();
  const { data: brands = [] } = useBrands(true);
  const [sortBy, setSortBy] = React.useState<SortOption>("recommended");

  const brand = brands.find((b) => slugify(b.label) === slug);
  const brandLabel = brand?.label || slug.replace(/-/g, " ");

  const seoTitle = `${brandLabel} Watches | Varieties Watch Shop`;
  const seoDescription = `Shop original ${brandLabel} watches at Varieties Watch Shop with nationwide cash on delivery across Bangladesh.`;
  const seoUrl = `https://www.varietieswatchshop.com/brands/${slug}`;

  const filtered = React.useMemo(
    () => products.filter((p) => slugify(p.brand || "") === slug),
    [products, slug],
  );

  const sorted = React.useMemo(() => {
    if (sortBy === "recommended") return filtered;
    const indexed = filtered.map((p, i) => ({ p, i }));
    indexed.sort((a, b) => {
      const pa = getEffectivePrice(a.p as any, discounts);
      const pb = getEffectivePrice(b.p as any, discounts);
      if (pa === pb) return a.i - b.i;
      return sortBy === "price-asc" ? pa - pb : pb - pa;
    });
    return indexed.map((x) => x.p);
  }, [filtered, sortBy, discounts]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <link rel="canonical" href={seoUrl} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={seoUrl} />
      </Helmet>
      <Navbar />
      <section className="pt-24 sm:pt-28 lg:pt-36 pb-16 sm:pb-24 lg:pb-32">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="mb-10">
            <Link
              to="/brands"
              className="font-body text-[11px] tracking-[0.35em] uppercase text-muted-foreground hover:text-gold transition-colors"
            >
              ← All Brands
            </Link>
            <h1 className="mt-4 font-display text-4xl md:text-5xl lg:text-6xl font-light text-foreground uppercase tracking-wide">
              <span className="font-semibold italic text-gold">{brandLabel}</span> Watches
            </h1>
          </div>

          <div className="flex justify-end mb-6 md:mb-10">
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center gap-1.5 h-8 sm:h-9 px-3 rounded-full bg-transparent text-foreground hover:text-gold transition-colors font-body text-[11px] sm:text-[12px] font-medium tracking-wide focus:outline-none focus-visible:ring-0">
                <ArrowUpDown className="h-3.5 w-3.5" />
                Sort
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="font-body min-w-[220px]">
                <DropdownMenuRadioGroup value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <DropdownMenuRadioItem value="recommended" className={sortBy === "recommended" ? "text-gold font-semibold" : ""}>Recommended</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="price-asc" className={sortBy === "price-asc" ? "text-gold font-semibold" : ""}>Price: Low to High</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="price-desc" className={sortBy === "price-desc" ? "text-gold font-semibold" : ""}>Price: High to Low</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {isLoading ? (
            <div className="text-center py-20"><p className="font-body text-muted-foreground">Loading watches…</p></div>
          ) : isError ? (
            <div className="text-center py-20">
              <p className="font-body text-muted-foreground mb-4">Could not load products. Please try again.</p>
              <button onClick={() => refetch()} className="font-body text-sm px-5 py-2.5 rounded-full bg-primary text-primary-foreground">Retry</button>
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-body text-muted-foreground">No watches under {brandLabel} yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
              {sorted.map((product, idx) => {
                const stats = reviewStats[product.id];
                return (
                  <ProductCard
                    key={product.id}
                    {...product}
                    image={product.image}
                    rating={stats?.averageRating ?? 0}
                    reviewCount={stats?.reviewCount ?? 0}
                    delay={idx * 0.05}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default BrandCollectionPage;