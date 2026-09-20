import { useEffect, useState } from "react";
import { Link, useLocation, Navigate } from "react-router-dom";
import { CheckCircle2, Package, Phone, MapPin, ArrowRight, Home, FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { generateInvoicePDF } from "@/lib/invoiceGenerator";
import { toast } from "sonner";

export interface ConfirmationItem {
  productName: string;
  variant: string;
  quantity: number;
  price: number;
}

export interface OrderConfirmationState {
  orderNumbers: string[];
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  deliveryCharge: number;
  items: ConfirmationItem[];
  orderDate?: string;
}

const OrderConfirmationPage = () => {
  const location = useLocation();
  const state = location.state as OrderConfirmationState | null;
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (state) window.scrollTo(0, 0);
  }, [state]);

  if (!state || !state.orderNumbers?.length) {
    return <Navigate to="/" replace />;
  }

  const subtotal = state.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const total = subtotal + (state.deliveryCharge || 0);

  const handleDownloadInvoice = () => {
    try {
      setDownloading(true);
      generateInvoicePDF(state);
      toast.success("Invoice PDF downloaded successfully!");
    } catch (error) {
      console.error("Failed to generate invoice:", error);
      toast.error("Could not generate invoice. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Navbar />
      <main className="pt-24 pb-16 px-4 sm:px-6 max-w-3xl mx-auto">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/10 mb-4">
            <CheckCircle2 className="w-9 h-9 text-gold" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-foreground mb-2">
            Thank you for your order!
          </h1>
          <p className="font-body text-[13px] text-muted-foreground max-w-md mx-auto">
            Your order has been received. Our team will call you shortly on your provided phone number to confirm delivery.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 mb-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
            <div>
              <p className="font-body text-[10px] uppercase tracking-wider text-muted-foreground">Order ID</p>
              <p className="font-display text-xl font-semibold text-gold">
                {state.orderNumbers.map((n) => `#${n}`).join(", ")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadInvoice}
                disabled={downloading}
                className="border-gold/40 text-gold hover:bg-gold/10 hover:text-gold text-xs h-8 px-3 transition-colors"
                title="Download invoice as PDF"
              >
                {downloading ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <FileDown className="w-3.5 h-3.5 mr-1.5" />
                )}
                Invoice (PDF)
              </Button>
              <div className="text-right">
                <p className="font-body text-[10px] uppercase tracking-wider text-muted-foreground">Total</p>
                <p className="font-body text-2xl font-bold text-foreground">৳{total.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="py-4 space-y-3 border-b border-border">
            {state.items.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <Package className="w-4 h-4 text-muted-foreground mt-1 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-body text-[13px] font-semibold text-foreground truncate">
                    {item.productName}
                  </p>
                  <p className="font-body text-[12px] text-muted-foreground">
                    {item.variant} × {item.quantity}
                  </p>
                </div>
                <p className="font-body text-[13px] font-medium text-foreground shrink-0">
                  ৳{(item.price * item.quantity).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          <div className="py-4 space-y-1.5 border-b border-border">
            <div className="flex justify-between font-body text-[13px]">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">৳{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-body text-[13px]">
              <span className="text-muted-foreground">Delivery Charge</span>
              <span className="text-foreground">৳{(state.deliveryCharge || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="font-body text-[11px] uppercase tracking-wider text-muted-foreground">Total</span>
              <span className="font-body text-lg font-bold text-foreground">৳{total.toLocaleString()}</span>
            </div>
          </div>

          <div className="pt-4 space-y-2">
            <p className="font-body text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Delivery To</p>
            <p className="font-body text-[13px] font-semibold text-foreground">{state.customerName}</p>
            <p className="font-body text-[12px] text-muted-foreground flex items-center gap-2">
              <Phone className="w-3.5 h-3.5" /> {state.customerPhone}
            </p>
            <p className="font-body text-[12px] text-muted-foreground flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {state.customerAddress}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center">
          <Button
            variant="outline"
            size="lg"
            onClick={handleDownloadInvoice}
            disabled={downloading}
            className="w-full sm:w-auto border-gold/40 hover:bg-gold/10 text-foreground font-body gap-2"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin text-gold" />
            ) : (
              <FileDown className="w-4 h-4 text-gold" />
            )}
            Download Invoice (PDF)
          </Button>
          <Link to="/track-order" state={{ phone: state.customerPhone }}>
            <Button variant="gold" size="lg" className="w-full sm:w-auto">
              Track Your Order <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
          <Link to="/">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              <Home className="w-4 h-4 mr-1" /> Continue Shopping
            </Button>
          </Link>
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default OrderConfirmationPage;