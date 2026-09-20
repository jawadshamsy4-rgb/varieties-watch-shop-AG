import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Search, X, Loader2 } from "lucide-react";
import { useProducts, type Product } from "@/hooks/useProducts";
import { fuzzySearch } from "@/lib/fuzzySearch";
import { cdnImage } from "@/lib/cdnImage";

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

const SearchOverlay = ({ open, onClose }: SearchOverlayProps) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: products = [], isLoading } = useProducts();

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  const results = fuzzySearch(
    products,
    query,
    (p) => p.name,
    (p) => p.brand
  );

  const hasQuery = query.trim().length > 0;
  const hasExact = results.some((r) => r.score === 0);

  return (
    <div className="fixed inset-0 z-[100] bg-background overflow-hidden">
      <div className="max-w-2xl mx-auto px-6 pt-20">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b-2 border-gold pb-3 mb-6">
          <Search size={20} className="text-gold shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search watches…"
            className="flex-1 bg-transparent font-display text-2xl text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="mx-auto animate-spin text-gold" size={24} />
          </div>
        ) : hasQuery ? (
          <>
            {!hasExact && results.length > 0 && (
              <p className="font-body text-[12px] text-muted-foreground mb-4">
                No exact match found. Showing similar products.
              </p>
            )}
            {results.length > 0 ? (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {results.slice(0, 10).map(({ item }) => (
                  <Link
                    key={item.id}
                    to={`/product/${item.id}`}
                    onClick={onClose}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary transition-colors group"
                  >
                    <img
                      src={cdnImage(item.image, { width: 120 })}
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                      className="w-14 h-14 rounded-md object-cover border border-border"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-[10px] font-bold tracking-[0.15em] uppercase text-muted-foreground">
                        {item.brand}
                      </p>
                      <p className="font-body text-[14px] font-medium text-foreground group-hover:text-gold transition-colors truncate">
                        {item.name}
                      </p>
                    </div>
                    <span className="font-body text-base sm:text-lg font-bold text-foreground shrink-0">
                      ৳{item.variants[0]?.price || item.price}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-center font-body text-muted-foreground py-12">
                No products found for "{query}"
              </p>
            )}
          </>
        ) : (
          <p className="text-center font-body text-[13px] text-muted-foreground py-12">
            Start typing to search watches…
          </p>
        )}
      </div>
    </div>
  );
};

export default SearchOverlay;
