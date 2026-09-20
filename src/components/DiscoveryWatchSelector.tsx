import { useProducts } from "@/hooks/useProducts";

interface DiscoveryWatchSelectorProps {
  count: number;
  genderCategory: "men" | "women";
  selections: string[];
  onSelectionsChange: (selections: string[]) => void;
}

const DiscoveryWatchSelector = ({
  count,
  genderCategory,
  selections,
  onSelectionsChange,
}: DiscoveryWatchSelectorProps) => {
  const { data: allProducts = [] } = useProducts();

  // Filter products by gender category (exclude discovery products themselves)
  const availableWatches = allProducts.filter(
    (p) =>
      p.category.toLowerCase() === genderCategory &&
      p.category.toLowerCase() !== "smart"
  );

  const handleChange = (index: number, value: string) => {
    const updated = [...selections];
    updated[index] = value;
    onSelectionsChange(updated);
  };

  const inputClass =
    "w-full bg-background border border-border rounded-lg px-4 py-2.5 font-body text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-gold/30 appearance-none cursor-pointer";

  return (
    <div className="mb-8">
      <p className="font-body text-[11px] font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-3">
        Select Your Watches
      </p>
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => {
          // Get already selected watch names (excluding current slot)
          const otherSelections = selections.filter((_, idx) => idx !== i && _ !== "");

          return (
            <div key={i}>
              <label className="font-body text-[11px] font-medium text-muted-foreground mb-1 block">
                Watch No. {i + 1} *
              </label>
              <select
                value={selections[i] || ""}
                onChange={(e) => handleChange(i, e.target.value)}
                className={inputClass}
              >
                <option value="">Select a watch</option>
                {availableWatches.map((p) => {
                  const isSelectedElsewhere = otherSelections.includes(p.name);
                  return (
                    <option
                      key={p.id}
                      value={p.name}
                      disabled={isSelectedElsewhere}
                    >
                      {p.name} — 6ML
                      {isSelectedElsewhere ? " (already selected)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DiscoveryWatchSelector;
