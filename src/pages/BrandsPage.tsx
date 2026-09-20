import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useBrands } from "@/hooks/useBrands";
import { cdnImage } from "@/lib/cdnImage";

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const BrandsPage = () => {
  const { data: brands = [], isLoading } = useBrands(true);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden pb-16 md:pb-0">
      <Navbar />
      <section className="pt-24 sm:pt-28 lg:pt-36 pb-12 md:pb-20 bg-onyx border-b border-border">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-center mb-10 md:mb-14">
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extralight tracking-[0.15em] uppercase text-gradient-gold">
              Brands
            </h1>
            <div className="mx-auto mt-4 h-px w-16 bg-gold/60" />
          </div>

          {isLoading ? (
            <p className="text-center font-body text-foreground/60 py-20">Loading…</p>
          ) : brands.length === 0 ? (
            <p className="text-center font-body text-foreground/60 py-20">No brands available yet.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {brands.map((b) => (
                <Link
                  key={b.id}
                  to={`/brands/${slugify(b.label)}`}
                  className="group relative aspect-square overflow-hidden bg-charcoal border border-border hover:border-gold/60 transition-colors"
                >
                  {b.image_url && (
                    <img
                      src={cdnImage(b.image_url, { width: 500 })}
                      alt={`${b.label} watches`}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 md:p-6">
                    <h3 className="font-display text-2xl md:text-3xl lg:text-4xl font-medium tracking-wider uppercase text-foreground group-hover:text-gold transition-colors">
                      {b.label}
                    </h3>
                    <span className="font-body text-[10px] tracking-[0.35em] uppercase text-silver/70">
                      Shop the edit →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default BrandsPage;