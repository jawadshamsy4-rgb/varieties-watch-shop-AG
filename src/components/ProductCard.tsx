import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import {
  useCategoryDiscounts,
  getProductDiscountedPrice,
  getProductDiscountLabel,
} from "@/hooks/useCategoryDiscounts";

interface ProductVariant {
  size: string;
  price: number;
  bestFor: string;
}

interface ProductCardProps {
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  category: string;
  description: string;
  badge?: string;
  delay?: number;
  id?: string;
  variants?: ProductVariant[];
  inStock?: boolean;
  discount_enabled?: boolean;
  discount_type?: "percentage" | "fixed";
  discount_value?: number;
}

const ProductCard = ({ name, brand, price, originalPrice, rating, reviewCount, image, category, description, badge, delay = 0, id, variants = [], inStock = true, discount_enabled, discount_type, discount_value }: ProductCardProps) => {
  const slug = id || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const { data: discounts } = useCategoryDiscounts();
  
  const cheapestPrice = variants.length > 0
    ? Math.min(...variants.map(v => v.price))
    : price;

  const productForDiscount = { category, discount_enabled, discount_type, discount_value };
  const discountedPrice = getProductDiscountedPrice(cheapestPrice, productForDiscount, discounts);
  const discountLabel = getProductDiscountLabel(productForDiscount, discounts);
  const isOutOfStock = !inStock;

  return (
    <Link
      to={`/product/${slug}`}
      className={`group block animate-fade-in border border-border/60 bg-charcoal hover:border-gold/60 hover:shadow-gold-glow transition-all duration-300 shadow-luxury rounded-xl overflow-hidden ${isOutOfStock ? 'opacity-60' : ''}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-card">
        <img
          src={image}
          alt={name}
          loading="lazy"
          decoding="async"
          width={800}
          height={1000}
          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-[1200ms] ease-out"
        />
        {/* subtle vignette on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {discountLabel && !isOutOfStock && (
          <span className="absolute top-3 left-3 font-body text-[9px] font-semibold tracking-[0.25em] uppercase bg-foreground text-background px-2.5 py-1 z-10">
            {discountLabel}
          </span>
        )}
        {badge && !isOutOfStock && !discountLabel && (
          <span className="absolute top-3 left-3 font-body text-[9px] font-semibold tracking-[0.25em] uppercase bg-foreground text-background px-2.5 py-1">
            {badge}
          </span>
        )}
        {isOutOfStock && (
          <span className="absolute top-3 left-3 font-body text-[9px] font-semibold tracking-[0.25em] uppercase bg-background/80 text-foreground border border-foreground/30 px-2.5 py-1">
            Sold Out
          </span>
        )}
        <span className="absolute bottom-3 right-3 font-body text-[9px] tracking-[0.25em] uppercase text-foreground/80 bg-background/40 backdrop-blur-sm px-2 py-1">
          {category}
        </span>
      </div>

      <div className="px-3 pt-3 pb-3">
        <p className="font-body text-[10px] font-medium tracking-[0.3em] uppercase text-gold mb-1.5">
          {brand}
        </p>
        <h3 className="font-display text-lg sm:text-xl font-light text-foreground line-clamp-1 mb-2 group-hover:italic transition-all">
          {name}
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            {discountedPrice !== null ? (
              <>
                <span className="font-body text-[12px] text-foreground/40 line-through">৳{cheapestPrice}</span>
                <span className="font-body text-[15px] font-medium text-foreground">৳{discountedPrice}</span>
              </>
            ) : (
              <span className="font-body text-[15px] font-medium text-foreground">৳{cheapestPrice}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Star size={11} className="fill-gold text-gold" />
            <span className="font-body text-[11px] text-foreground/70">
              {rating} <span className="text-foreground/40">({reviewCount})</span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
