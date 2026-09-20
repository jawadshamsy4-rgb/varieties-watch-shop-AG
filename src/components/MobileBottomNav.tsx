import { Link, useLocation, useNavigate } from "react-router-dom";
import { Store, LayoutGrid, ShoppingBag, User, Crown } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

const items = [
  { label: "Shop", icon: Store, to: "/collection/all" },
  { label: "Category", icon: LayoutGrid, to: "/#categories", scrollTo: "categories" },
  { label: "Brands", icon: Crown, to: "/brands" },
  { label: "Cart", icon: ShoppingBag, to: "/cart", showBadge: true },
  { label: "Track", icon: User, to: "/track-order" },
];

const MobileBottomNav = () => {
  const { totalItems } = useCart();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent, scrollTo?: string) => {
    if (!scrollTo) return;
    e.preventDefault();
    if (pathname === "/") {
      document.getElementById(scrollTo)?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/");
      setTimeout(() => {
        document.getElementById(scrollTo)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  return (
    <nav
      aria-label="Primary mobile"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-onyx/95 backdrop-blur-xl border-t border-gold/25"
    >
      <ul className="grid grid-cols-5">
        {items.map((it) => {
          const Active = pathname === it.to;
          const Icon = it.icon;
          return (
            <li key={it.label}>
              <Link
                to={it.to}
                onClick={(e) => handleClick(e, (it as any).scrollTo)}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 transition-colors ${
                  Active ? "text-gold" : "text-silver/80 hover:text-gold"
                }`}
              >
                <span className="relative">
                  <Icon size={20} strokeWidth={1.4} />
                  {it.showBadge && totalItems > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-gold text-background flex items-center justify-center font-body text-[9px] font-bold">
                      {totalItems > 99 ? "99+" : totalItems}
                    </span>
                  )}
                </span>
                <span className="font-body text-[10px] tracking-[0.18em] uppercase">{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default MobileBottomNav;
