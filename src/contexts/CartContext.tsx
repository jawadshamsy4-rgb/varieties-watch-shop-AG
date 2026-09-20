import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";

export interface CartItem {
  product_id: string;
  product_name: string;
  variant: string;
  price: number;
  quantity: number;
  image: string;
  selected_perfumes?: string[];
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addToCart: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeFromCart: (product_id: string, variant: string) => void;
  updateQuantity: (product_id: string, variant: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_KEY = "scent-of-time-cart";
const CART_SCHEMA_VERSION = 2;
const CART_VERSION_KEY = "scent-of-time-cart-version";

const isValidCartItem = (raw: unknown): raw is CartItem => {
  if (!raw || typeof raw !== "object") return false;
  const item = raw as Partial<CartItem>;
  return (
    typeof item.product_id === "string" &&
    typeof item.product_name === "string" &&
    typeof item.variant === "string" &&
    typeof item.price === "number" &&
    Number.isFinite(item.price) &&
    typeof item.quantity === "number" &&
    Number.isFinite(item.quantity) &&
    item.quantity > 0 &&
    typeof item.image === "string"
  );
};

const loadCart = (): CartItem[] => {
  try {
    const storedVersion = Number(localStorage.getItem(CART_VERSION_KEY) || "0");
    if (storedVersion !== CART_SCHEMA_VERSION) {
      // Old/missing schema version — drop the persisted cart entirely so a
      // legacy malformed entry can't crash the app on render.
      localStorage.removeItem(CART_KEY);
      localStorage.setItem(CART_VERSION_KEY, String(CART_SCHEMA_VERSION));
      return [];
    }
    const saved = localStorage.getItem(CART_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    // Filter out any malformed items so a single bad entry can't break the UI.
    return parsed.filter(isValidCartItem);
  } catch {
    try { localStorage.removeItem(CART_KEY); } catch {}
    return [];
  }
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(loadCart);
  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const addToCart = (item: Omit<CartItem, "quantity">, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.product_id === item.product_id && i.variant === item.variant
      );
      if (existing) {
        return prev.map((i) =>
          i.product_id === item.product_id && i.variant === item.variant
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { ...item, quantity }];
    });
    toast({
      title: "Item added to cart successfully.",
      description: `${item.product_name} — ${item.variant}`,
    });
  };

  const removeFromCart = (product_id: string, variant: string) => {
    setItems((prev) => prev.filter((i) => !(i.product_id === product_id && i.variant === variant)));
  };

  const updateQuantity = (product_id: string, variant: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(product_id, variant);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.product_id === product_id && i.variant === variant ? { ...i, quantity } : i
      )
    );
  };

  const clearCart = () => setItems([]);

  return (
    <CartContext.Provider value={{ items, totalItems, totalPrice, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
