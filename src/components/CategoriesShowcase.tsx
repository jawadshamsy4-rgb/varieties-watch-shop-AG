import { Link } from "react-router-dom";
import higherGradeImg from "@/assets/category-higher-grade.jpg";

const categories = [
  { label: "Men", slug: "men", img: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=900&q=80&auto=format&fit=crop" },
  { label: "Women", slug: "women", img: "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=900&q=80&auto=format&fit=crop" },
  { label: "Authentic", slug: "authentic", img: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=900&q=80&auto=format&fit=crop" },
  { label: "Higher Grade", slug: "higher-grade", img: higherGradeImg },
];

const CategoriesShowcase = () => {
  return (
    <section id="categories" className="py-16 md:py-24 bg-onyx border-y border-border scroll-mt-20">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="text-center mb-10 md:mb-14">
          <span className="font-body text-[11px] tracking-[0.5em] uppercase text-gold block mb-3">
            — Shop By —
          </span>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-extralight tracking-[0.15em] uppercase text-gradient-gold">
            Categories
          </h2>
          <div className="mx-auto mt-4 h-px w-16 bg-gold/60" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
          {categories.map((c) => (
            <Link
              key={c.label}
              to={`/collection/${c.slug}`}
              className="group relative aspect-square overflow-hidden bg-charcoal border border-border hover:border-gold/60 transition-colors"
            >
              <img
                src={c.img}
                alt={`${c.label} watches`}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 md:p-6">
                <h3 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-medium tracking-wide md:tracking-wider uppercase text-foreground group-hover:text-gold transition-colors break-words">
                  {c.label}
                </h3>
                <span className="font-body text-[10px] tracking-[0.35em] uppercase text-silver/70">
                  Shop the edit →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesShowcase;