import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Products", path: "/admin/products" },
  { label: "Orders", path: "/admin/orders" },
  { label: "Delivery Charges", path: "/admin/delivery-charges" },
  { label: "Trending", path: "/admin/trending" },
  { label: "Discounts", path: "/admin/discounts" },
  { label: "Hero Slides", path: "/admin/hero-slides" },
  { label: "Brands", path: "/admin/brands" },
  { label: "Dashboard", path: "/admin/dashboard" },
];

const AdminTabNav = () => {
  const { pathname } = useLocation();

  return (
    <div className="border-b border-border bg-card px-2 md:px-6 overflow-x-auto scrollbar-none">
      <div className="flex gap-1 md:gap-2 py-1.5 md:py-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.path;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={cn(
                "font-body text-[10px] md:text-[12px] tracking-[0.08em] md:tracking-[0.1em] uppercase whitespace-nowrap px-3 md:px-4 py-1.5 md:py-2 rounded-md transition-all",
                isActive
                  ? "bg-gold/15 text-foreground font-semibold border border-gold/25"
                  : "text-muted-foreground font-medium hover:bg-secondary hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default AdminTabNav;
