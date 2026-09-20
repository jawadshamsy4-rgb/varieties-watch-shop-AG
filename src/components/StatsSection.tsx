import { useEffect, useRef, useState } from "react";

const useCountUp = (target: number, duration = 2000) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) setStarted(true);
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, target, duration]);

  return { count, ref };
};

const StatsSection = () => {
  const { count, ref } = useCountUp(20000, 2200);

  return (
    <section ref={ref} className="py-12 md:py-16 lg:py-20 bg-background border-t border-border">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 text-center">
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-normal text-foreground leading-tight">
          We Have Served Clients
        </h2>
        <p className="font-display italic text-2xl sm:text-3xl md:text-4xl text-gold mt-2">
          Both Online &amp; Offline
        </p>
        <p className="font-body text-[14px] sm:text-[15px] text-foreground/70 mt-3 max-w-xl mx-auto">
          Trusted by watch enthusiasts across Bangladesh — and counting.
        </p>

        <div className="mt-6 md:mt-8">
          <span className="inline-flex items-baseline font-display">
            <span className="text-7xl sm:text-8xl md:text-9xl font-semibold text-foreground leading-none tracking-[-0.02em]">
              {count.toLocaleString()}
            </span>
            <span className="text-gold text-6xl sm:text-7xl md:text-8xl font-semibold ml-1">+</span>
          </span>
          <p className="font-body text-[11px] sm:text-[12px] tracking-[0.4em] uppercase text-foreground/60 mt-3">
            Happy Customers
          </p>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
