import React from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import ProductCard from "@/components/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { useReviewStats } from "@/hooks/useReviewStats";
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
import { ArrowUpDown, Check, ChevronDown } from "lucide-react";
import { COLLECTION_TABS } from "@/data/categories";

type SortOption = "recommended" | "price-asc" | "price-desc";

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

const categories = COLLECTION_TABS;

const CollectionPage = () => {
  const { category } = useParams<{ category: string }>();
  const activeSlug = category || "all";
  const { data: products = [], isLoading, isError, refetch } = useProducts();
  const { data: reviewStats = {} } = useReviewStats();
  const { data: discounts = [] } = useCategoryDiscounts();
  const [sortBy, setSortBy] = React.useState<SortOption>("recommended");

  const filtered = React.useMemo(() => {
    if (activeSlug === "all") return products;
    if (activeSlug === "new-arrival")
      return products.filter((p) => p.badge?.toLowerCase().includes("new"));
    const target = activeSlug.toLowerCase().replace(/-/g, " ");
    return products.filter(
      (p) => p.category.toLowerCase() === target
    );
  }, [products, activeSlug]);

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

  const activeLabel =
    categories.find((c) => c.slug === activeSlug)?.label || "All";

  const seoLabel = activeLabel === "All" ? "All Watches" : `${activeLabel}'s Watches`;
  const seoTitle = `${seoLabel} Collection | Varieties Watch Shop`;
  const seoDescription = `Browse our ${seoLabel.toLowerCase()} collection at Varieties Watch Shop — original watches with nationwide cash on delivery across Bangladesh.`;
  const seoUrl = `https://www.varietieswatchshop.com/collection/${activeSlug}`;

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
          <div className="mb-14">
            <span className="font-body text-[11px] font-semibold tracking-[0.35em] uppercase text-muted-foreground mb-4 block">
              Our Collection
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-light text-foreground">
              {activeLabel === "All" ? (
                <>
                  All <span className="font-semibold italic text-gold">Watches</span>
                </>
              ) : (
                <>
                  {activeLabel}{" "}
                  <span className="font-semibold italic text-gold">Collection</span>
                </>
              )}
            </h1>
          </div>

          {/* Category tabs */}
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar mb-3 -mx-4 px-4 sm:mx-0 sm:px-0 [-webkit-overflow-scrolling:touch] [touch-action:pan-x] flex-nowrap">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                to={`/collection/${cat.slug}`}
                className={`font-body text-[12px] font-medium tracking-wide px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border transition-all duration-300 whitespace-nowrap bg-transparent text-gold ${
                  activeSlug === cat.slug
                    ? "border-gold"
                    : "border-transparent hover:border-gold/40"
                }`}
              >
                {cat.label}
              </Link>
            ))}
          </div>

          {/* Sort row */}
          <div className="flex justify-end mb-6 md:mb-10">
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center gap-1.5 h-8 sm:h-9 px-3 rounded-full bg-transparent text-foreground hover:text-gold transition-colors font-body text-[11px] sm:text-[12px] font-medium tracking-wide focus:outline-none focus-visible:ring-0">
                <ArrowUpDown className="h-3.5 w-3.5" />
                Sort
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="font-body min-w-[220px]">
                <DropdownMenuRadioGroup
                  value={sortBy}
                  onValueChange={(v) => setSortBy(v as SortOption)}
                >
                  <DropdownMenuRadioItem value="recommended" className={sortBy === "recommended" ? "text-gold font-semibold" : ""}>Recommended</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="price-asc" className={sortBy === "price-asc" ? "text-gold font-semibold" : ""}>Price: Low to High</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="price-desc" className={sortBy === "price-desc" ? "text-gold font-semibold" : ""}>Price: High to Low</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Products grid */}
          {isLoading ? (
            <div className="text-center py-20">
              <p className="font-body text-muted-foreground">Loading watches…</p>
            </div>
          ) : isError ? (
            <div className="text-center py-20">
              <p className="font-body text-muted-foreground mb-4">Could not load products. Please try again.</p>
              <button onClick={() => refetch()} className="font-body text-sm px-5 py-2.5 rounded-full bg-primary text-primary-foreground">Retry</button>
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-body text-muted-foreground">
                No products in this category yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8 transition-all duration-300">
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

export default CollectionPage;
