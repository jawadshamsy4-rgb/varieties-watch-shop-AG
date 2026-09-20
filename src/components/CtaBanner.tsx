import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CtaBanner = () => {
  return (
    <section className="py-20 md:py-28 lg:py-36 bg-background border-y border-border">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 text-center">
        <span className="font-body text-[11px] font-semibold tracking-[0.4em] uppercase text-foreground/50 mb-5 block">
          Limited Edition
        </span>
        <h2 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extralight tracking-[-0.02em] text-foreground mb-6">
          The <span className="italic">Heritage</span> Edit
        </h2>
        <p className="font-body text-[14px] text-foreground/65 max-w-lg mx-auto mb-10 leading-relaxed">
          A handpicked selection of statement timepieces — automatic, mechanical and quartz — released in limited drops throughout the year.
        </p>
        <Button variant="cta" size="xl" className="gap-3 rounded-none bg-foreground text-background hover:bg-foreground/90" asChild>
          <Link to="/collection/higher-grade">
            Shop the Edit <ArrowRight size={16} />
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default CtaBanner;
