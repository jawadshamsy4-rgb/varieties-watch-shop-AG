import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative w-full pt-[88px] md:pt-[96px] bg-background">
      <div className="relative h-[50vh] sm:h-[56vh] md:h-[62vh] max-h-[608px] min-h-[352px] w-full overflow-hidden">
        <img
          src={heroBg}
          alt="A man in a tailored suit driving a vintage car wearing a luxurious gold wristwatch"
          className="absolute inset-0 w-full h-full object-cover"
          width={1920}
          height={1080}
          loading="eager"
        />
        {/* Cinematic dark vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-background/10 to-background/40" />

        {/* Top hairline meta */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <span className="font-body text-[9px] sm:text-[10px] tracking-[0.5em] uppercase text-gold/80">
            Varieties · Watch Shop
          </span>
        </div>

        {/* Centered headline + CTA — like the reference */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-6">
          <span className="font-body text-[10px] sm:text-[11px] tracking-[0.4em] uppercase text-silver/80 mb-3 md:mb-5 animate-fade-in">
            Heritage · Precision · Style
          </span>
          <h1
            className="font-display text-[34px] leading-[1.02] sm:text-5xl md:text-6xl lg:text-7xl font-light text-foreground tracking-[-0.01em] max-w-3xl animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            A watch represents
            <br />
            your <span className="italic text-gradient-gold font-normal">luxury.</span>
          </h1>

          <div
            className="mt-6 md:mt-9 flex flex-wrap items-center justify-center gap-3 animate-fade-in"
            style={{ animationDelay: "0.25s" }}
          >
            <Button
              size="lg"
              className="rounded-none bg-gold text-background hover:bg-gold-light px-8 h-12 font-body text-[12px] tracking-[0.3em] uppercase font-semibold shadow-gold-glow"
              asChild
            >
              <Link to="/collection/all">Shop Now</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-none border-silver/40 text-silver hover:text-foreground hover:bg-foreground/5 bg-transparent px-7 h-12 font-body text-[12px] tracking-[0.3em] uppercase"
              asChild
            >
              <Link to="/collection/higher-grade">Higher Grade</Link>
            </Button>
          </div>
        </div>

        {/* Bottom hairline marker */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-gold" />
          <span className="w-1.5 h-1.5 rounded-full bg-silver/40" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
