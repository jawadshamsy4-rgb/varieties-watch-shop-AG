import { Link } from "react-router-dom";
import { COLLECTION_TABS } from "@/data/categories";

const Footer = () => {
  return (
    <footer className="bg-background text-foreground border-t border-border">
      <div>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 grid grid-cols-2 md:grid-cols-4 gap-10 py-12 lg:py-16">
          <div className="col-span-2 md:col-span-1">
            <h4 className="font-body text-[10px] font-semibold tracking-[0.3em] uppercase text-foreground/50 mb-4">Visit</h4>
            <ul className="font-body text-[13px] text-foreground/80 leading-relaxed space-y-3 list-none">
              <li className="flex gap-2">
                <span aria-hidden="true" className="text-gold text-lg leading-[1.2] mt-0.5">•</span>
                <span>
                  Shop no :- 108, Ground Floor,<br />
                  Twin Tower Concord Shopping Complex,<br />
                  Shantinagar, Dhaka.
                </span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden="true" className="text-gold text-lg leading-[1.2] mt-0.5">•</span>
                <span>
                  Shop no :- 5, C block, 1st floor,<br />
                  Gulzar Tower, Chawkbazar,<br />
                  Chattogram.
                </span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-body text-[10px] font-semibold tracking-[0.3em] uppercase text-foreground/50 mb-4">Shop</h4>
            <ul className="space-y-2.5">
              {COLLECTION_TABS.map((item) => (
                <li key={item.slug}>
                  <Link
                    to={`/collection/${item.slug}`}
                    className="font-body text-[13px] text-foreground/70 hover:text-foreground transition-colors"
                    title={`${item.label === "All" ? "All Watches" : item.label + "'s Watches"} Price in Bangladesh`}
                  >
                    {item.label === "All"
                      ? "All Watch Price in BD"
                      : `${item.label}'s Watch Price in BD`}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-body text-[10px] font-semibold tracking-[0.3em] uppercase text-foreground/50 mb-4">Help</h4>
            <ul className="space-y-2.5">
              <li><Link to="/track-order" className="font-body text-[13px] text-foreground/70 hover:text-foreground transition-colors">Track Order</Link></li>
              <li><Link to="/reviews" className="font-body text-[13px] text-foreground/70 hover:text-foreground transition-colors">Reviews</Link></li>
              {["Shipping", "Returns", "FAQ"].map((item) => (
                <li key={item} className="font-body text-[13px] text-foreground/70 hover:text-foreground transition-colors cursor-pointer">{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-body text-[10px] font-semibold tracking-[0.3em] uppercase text-foreground/50 mb-4">Newsletter</h4>
            <p className="font-body text-[13px] text-foreground/70 mb-4 leading-relaxed">
              New arrivals & private releases.
            </p>
            <div className="flex border-b border-foreground/30 focus-within:border-foreground transition-colors">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 bg-transparent px-0 py-2 font-body text-[13px] text-foreground placeholder:text-foreground/40 focus:outline-none"
              />
              <button className="font-body text-[11px] font-semibold tracking-[0.25em] uppercase text-foreground hover:text-foreground/70 transition-colors px-2">
                Join →
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="font-body text-[11px] tracking-[0.15em] uppercase text-foreground/40">
            © 2026 Varieties Watch Shop
          </p>
          <p className="font-body text-[11px] tracking-[0.15em] uppercase text-foreground/40">
            varietieswatchshop@gmail.com
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;