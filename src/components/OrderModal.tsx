import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Minus, Plus } from "lucide-react";
import { trackPurchase } from "@/lib/tracking";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useDeliveryCharges } from "@/hooks/useDeliveryCharges";
import { useCategoryDiscounts, getProductDiscountedPrice } from "@/hooks/useCategoryDiscounts";
import type { ProductVariant } from "@/hooks/useProducts";

interface OrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  variants: ProductVariant[];
  selectedVariant: number;
  selectedWatches?: string[];
  category: string;
  productDiscount?: {
    discount_enabled?: boolean;
    discount_type?: "percentage" | "fixed";
    discount_value?: number;
  };
}

const OrderModal = ({ open, onOpenChange, productName, variants, selectedVariant, selectedWatches, category, productDiscount }: OrderModalProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: charges } = useDeliveryCharges();
  const { data: discounts } = useCategoryDiscounts();
  const insideCharge = charges?.inside ?? 60;
  const outsideCharge = charges?.outside ?? 120;
  const insideLabel = charges?.insideLabel ?? "Inside Chittagong";
  const outsideLabel = charges?.outsideLabel ?? "Outside Chittagong";

  // Single source of truth: effective (discounted) price for a variant index
  const getEffectivePrice = (idx: number): number => {
    const base = variants[idx]?.price ?? 0;
    const discounted = getProductDiscountedPrice(
      base,
      { category, ...(productDiscount || {}) },
      discounts,
    );
    return discounted !== null ? discounted : base;
  };

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    variant: selectedVariant,
    quantity: 1 as number | "",
    delivery: "" as "" | "inside" | "outside",
  });

  useEffect(() => {
    setForm((prev) => ({ ...prev, variant: selectedVariant }));
  }, [selectedVariant]);
  const [submitting, setSubmitting] = useState(false);

  const update = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = typeof form.quantity === "number" && form.quantity >= 1 ? form.quantity : 1;
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    if (!/^01\d{9}$/.test(form.phone.trim())) {
      toast({ title: "Enter a valid 11-digit Bangladeshi phone number", description: "Example: 01890080280", variant: "destructive" });
      return;
    }
    if (!form.delivery) {
      toast({ title: "Please select a delivery zone", variant: "destructive" });
      return;
    }
    setSubmitting(true);

    const variantSize = variants[form.variant].size;
    const basePrice = variants[form.variant].price;
    const effectivePrice = getEffectivePrice(form.variant);
    const deliveryCharge = form.delivery === "inside" ? insideCharge : outsideCharge;
    const totalPrice = effectivePrice * qty + deliveryCharge;

    try {
      let orderNumbers: string[] = [];
      const orderPayload = {
        customerName: form.name.trim(),
        customerPhone: form.phone.trim(),
        customerAddress: form.address.trim(),
        deliveryCharge,
        items: [{
          productName,
          variant: variantSize,
          quantity: qty,
          price: effectivePrice,
          ...(selectedWatches?.length ? { selectedWatches } : {}),
        }],
      };

      try {
        const { data, error } = await supabase.functions.invoke("place-order-gmail", {
          body: orderPayload,
        });
        if (error || !data?.success) {
          throw new Error(error?.message || data?.error || "Edge function failed");
        }
        orderNumbers = data.orderNumbers ?? [];
      } catch (fnErr) {
        console.warn("place-order-gmail function unavailable, placing order via database RPC:", fnErr);
        const { data: orderNum, error: rpcErr } = await supabase.rpc("place_order", {
          p_name: orderPayload.customerName,
          p_phone: orderPayload.customerPhone,
          p_address: orderPayload.customerAddress,
          p_product: productName,
          p_variant: variantSize,
          p_quantity: qty,
          p_total_price: totalPrice,
          p_delivery_charge: deliveryCharge,
          p_selected_perfumes: selectedWatches?.length ? selectedWatches : null,
        });

        if (rpcErr) throw rpcErr;
        if (orderNum) orderNumbers = [orderNum];
      }

      trackPurchase({
        product_name: productName,
        quantity: qty,
        total_price: totalPrice,
        currency: "BDT",
        order_id: orderNumbers[0],
      });

      onOpenChange(false);
      setForm({ name: "", phone: "", address: "", variant: selectedVariant, quantity: 1, delivery: "" });
      navigate("/order-confirmation", {
        state: {
          orderNumbers: orderNumbers,
          customerName: form.name.trim(),
          customerPhone: form.phone.trim(),
          customerAddress: form.address.trim(),
          deliveryCharge,
          items: [{
            productName,
            variant: variantSize,
            quantity: qty,
            price: effectivePrice,
          }],
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Please try again.";
      toast({ title: "Failed to place order", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const qtyForTotal = typeof form.quantity === "number" && form.quantity >= 1 ? form.quantity : 1;
  const effectivePrice = getEffectivePrice(form.variant);
  const basePrice = variants[form.variant].price;
  const productTotal = effectivePrice * qtyForTotal;
  const deliveryCharge = form.delivery === "inside" ? insideCharge : form.delivery === "outside" ? outsideCharge : 0;
  const selectedPrice = productTotal + deliveryCharge;

  const inputClass = "w-full bg-background border border-border rounded-lg px-4 py-2.5 font-body text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-foreground">Place Your Order</DialogTitle>
          <DialogDescription className="font-body text-[13px] text-muted-foreground">
            Complete the form below to order <span className="font-semibold text-gold">{productName}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="font-body text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-1.5 block">Full Name *</label>
            <input type="text" required value={form.name} onChange={(e) => update("name", e.target.value)} className={inputClass} placeholder="Your full name" />
          </div>

          <div>
            <label className="font-body text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-1.5 block">Phone Number *</label>
            <input type="tel" required maxLength={11} value={form.phone} onChange={(e) => update("phone", e.target.value.replace(/\D/g, "").slice(0, 11))} className={inputClass} placeholder="01XXXXXXXXX" />
          </div>

          <div>
            <label className="font-body text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-1.5 block">Full Address *</label>
            <textarea required value={form.address} onChange={(e) => update("address", e.target.value)} className={`${inputClass} resize-none h-20`} placeholder="Street, City, Country" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-body text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-1.5 block">Variant</label>
              <select value={form.variant} onChange={(e) => update("variant", Number(e.target.value))} className={inputClass}>
                {variants.map((v, i) => (
                  <option key={v.size} value={i}>{v.size} — ৳{getEffectivePrice(i)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-body text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-1.5 block">Quantity</label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const current = typeof form.quantity === "number" ? form.quantity : 1;
                    update("quantity", Math.max(1, current - 1));
                  }}
                  className="shrink-0 h-[42px] w-[42px] flex items-center justify-center rounded-lg border border-border bg-background text-foreground hover:border-gold/50 active:scale-95 transition"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={form.quantity}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    if (raw === "") {
                      update("quantity", "");
                      return;
                    }
                    const n = Math.min(10, Math.max(1, Number(raw)));
                    update("quantity", n);
                  }}
                  onBlur={() => {
                    if (typeof form.quantity !== "number" || form.quantity < 1) {
                      update("quantity", 1);
                    }
                  }}
                  className={`${inputClass} text-center`}
                />
                <button
                  type="button"
                  onClick={() => {
                    const current = typeof form.quantity === "number" ? form.quantity : 1;
                    update("quantity", Math.min(10, current + 1));
                  }}
                  className="shrink-0 h-[42px] w-[42px] flex items-center justify-center rounded-lg border border-border bg-background text-foreground hover:border-gold/50 active:scale-95 transition"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="font-body text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-1.5 block">Delivery Zone *</label>
            <select value={form.delivery} onChange={(e) => update("delivery", e.target.value)} className={inputClass}>
              <option value="" disabled>Select delivery zone</option>
              <option value="inside">{insideLabel} — ৳{insideCharge}</option>
              <option value="outside">{outsideLabel} — ৳{outsideCharge}</option>
            </select>
          </div>

          <div className="pt-2 border-t border-border space-y-1">
            <div className="flex justify-between">
              <p className="font-body text-[11px] text-muted-foreground">Product Total</p>
              <p className="font-body text-[13px] font-medium text-foreground">৳{productTotal}</p>
            </div>
            {form.delivery && (
              <div className="flex justify-between">
                <p className="font-body text-[11px] text-muted-foreground">Delivery Charge</p>
                <p className="font-body text-[13px] font-medium text-foreground">৳{deliveryCharge}</p>
              </div>
            )}
            <div className="flex items-center justify-between pt-1">
              <div>
                <p className="font-body text-[10px] uppercase tracking-wider text-muted-foreground">Total</p>
                <p className="font-body text-xl sm:text-2xl font-bold text-foreground">৳{selectedPrice}</p>
              </div>
              <Button type="submit" variant="gold" size="lg" disabled={submitting}>
                {submitting ? "Placing Order…" : "Place Order"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OrderModal;
