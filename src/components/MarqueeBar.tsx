const items = [
  "Automatic",
  "Mechanical",
  "Chronograph",
  "Smart",
  "Heritage",
  "Sport",
  "Couple",
  "Limited Edition",
];

const MarqueeBar = () => {
  const loop = [...items, ...items];
  return (
    <section
      aria-label="Categories"
      className="border-y border-border bg-background overflow-hidden py-5"
    >
      <div className="flex w-max animate-marquee whitespace-nowrap">
        {loop.map((item, i) => (
          <span
            key={i}
            className="font-display italic text-2xl md:text-4xl text-foreground/80 px-8 flex items-center gap-8"
          >
            {item}
            <span className="w-1.5 h-1.5 rounded-full bg-foreground/40" aria-hidden />
          </span>
        ))}
      </div>
    </section>
  );
};

export default MarqueeBar;