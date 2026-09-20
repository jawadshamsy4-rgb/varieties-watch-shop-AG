import { Truck, Shield, RotateCcw, Award } from "lucide-react";

const features = [
  { icon: Truck, label: "Fast Delivery", desc: "Within 24 hours to 72 hours " },
  { icon: Award, label: "Premium Quality", desc: "Curated selection" },
];

const FeaturesBar = () => {
  return (
    <section className="bg-background border-y border-border">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
          {features.map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-4 py-6 sm:py-8 px-2 sm:px-8 justify-center sm:justify-start"
            >
              <f.icon size={22} strokeWidth={1.25} className="text-foreground/80 shrink-0" />
              <div>
                <p className="font-body text-[11px] font-semibold tracking-[0.25em] uppercase text-foreground">{f.label}</p>
                <p className="font-body text-[11px] text-foreground/55 mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesBar;
