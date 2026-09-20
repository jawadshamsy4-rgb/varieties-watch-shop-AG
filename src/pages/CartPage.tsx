import { useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { trackInitiateCheckout } from "@/lib/tracking";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import CheckoutModal from "@/components/CheckoutModal";
import { cdnImage } from "@/lib/cdnImage";

const CartPage = () => {
  const { items, totalPrice, updateQuantity, removeFromCart, clearCart } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Navbar />
      <div className="pt-24 pb-16 px-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 font-body text-[12px] font-medium tracking-wide text-muted-foreground hover:text-foreground transition-colors mb-4">
              <ArrowLeft size={14} /> Continue Shopping
            </Link>
            <h1 className="font-display text-3xl lg:text-4xl font-semibold text-foreground">
              Your Cart
            </h1>
          </div>
          {items.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearCart} className="text-muted-foreground hover:text-destructive">
              Clear Cart
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20 bg-card border border-border rounded-xl">
            <ShoppingBag size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="font-display text-xl text-foreground mb-2">Your cart is empty.</p>
            <p className="font-body text-[13px] text-muted-foreground mb-6">
              Browse our collection and add items to your cart.
            </p>
            <Link to="/">
              <Button variant="gold">Browse Collection</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div
                  key={`${item.product_id}-${item.variant}`}
                  className="flex gap-4 bg-card border border-border rounded-xl p-4 animate-fade-in"
                >
                  <Link to={`/product/${item.product_id}`} className="shrink-0">
                    <img
                      src={cdnImage(item.image, { width: 200 })}
                      alt={item.product_name}
                      loading="lazy"
                      decoding="async"
                      className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${item.product_id}`}>
                      <h3 className="font-display text-base font-semibold text-foreground hover:text-gold transition-colors truncate">
                        {item.product_name}
                      </h3>
                    </Link>
                    <p className="font-body text-[12px] text-muted-foreground mb-2">{item.variant}</p>
                    <p className="font-body text-base sm:text-lg font-bold text-foreground">৳{item.price}</p>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button
                      aria-label="Remove item"
                      onClick={() => removeFromCart(item.product_id, item.variant)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="flex items-center gap-2 bg-secondary rounded-lg">
                      <button
                        aria-label="Decrease quantity"
                        onClick={() => updateQuantity(item.product_id, item.variant, item.quantity - 1)}
                        className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="font-body text-[13px] font-semibold text-foreground w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        aria-label="Increase quantity"
                        onClick={() => updateQuantity(item.product_id, item.variant, item.quantity + 1)}
                        className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-xl p-6 sticky top-24">
                <h2 className="font-display text-xl font-semibold text-foreground mb-6">Order Summary</h2>
                <div className="space-y-3 mb-6">
                  {items.map((item) => (
                    <div key={`${item.product_id}-${item.variant}`} className="flex justify-between font-body text-[13px]">
                      <span className="text-muted-foreground truncate mr-2">
                        {item.product_name} ({item.variant}) × {item.quantity}
                      </span>
                      <span className="text-foreground font-bold shrink-0">৳{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border pt-4 mb-6">
                  <div className="flex justify-between">
                    <span className="font-body text-[11px] uppercase tracking-wider text-muted-foreground">Total</span>
                    <span className="font-body text-xl sm:text-2xl font-bold text-foreground">৳{totalPrice.toLocaleString()}</span>
                  </div>
                </div>
<Button variant="gold" size="lg" className="w-full" onClick={() => {
                  trackInitiateCheckout({
                    value: totalPrice,
                    num_items: items.reduce((s, i) => s + i.quantity, 0),
                    content_ids: items.map((i) => i.product_id),
                  });
                  setCheckoutOpen(true);
                }}>
                  Proceed to Checkout
                </Button>
                <CheckoutModal open={checkoutOpen} onOpenChange={setCheckoutOpen} />
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default CartPage;
