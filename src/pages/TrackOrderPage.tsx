import { useState } from "react";
import { Search, Package, MapPin, Phone, User, Clock, XCircle, CheckCircle2, FileDown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDeliveryCharges } from "@/hooks/useDeliveryCharges";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { generateInvoicePDF } from "@/lib/invoiceGenerator";

const STAGES = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered"] as const;

interface Order {
  id: string;
  order_number: string;
  name: string;
  phone: string;
  address: string;
  product: string;
  variant: string;
  quantity: number;
  total_price: number;
  delivery_charge: number;
  status: string;
  created_at: string;
}

const TrackOrderPage = () => {
  const [phone, setPhone] = useState("");
  const [orderId, setOrderId] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const { toast } = useToast();
  const { data: charges } = useDeliveryCharges();

  const handleDownloadInvoice = (order: Order) => {
    try {
      setDownloadingId(order.id);
      const deliveryCharge = Number(order.delivery_charge) || 0;
      const totalAmount = Number(order.total_price) || 0;
      const itemSubtotal = Math.max(0, totalAmount - deliveryCharge);
      const qty = Math.max(1, Number(order.quantity) || 1);
      const unitPrice = Math.round(itemSubtotal / qty);

      generateInvoicePDF({
        orderNumbers: [order.order_number],
        customerName: order.name,
        customerPhone: order.phone,
        customerAddress: order.address,
        deliveryCharge,
        items: [
          {
            productName: order.product,
            variant: order.variant,
            quantity: qty,
            price: unitPrice,
          },
        ],
        orderDate: order.created_at,
      });

      toast({ title: "Invoice downloaded successfully!" });
    } catch (err) {
      console.error("Failed to generate invoice:", err);
      toast({ title: "Could not generate invoice", description: "Please try again.", variant: "destructive" });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneVal = phone.trim();
    const orderVal = orderId.trim();
    if (!phoneVal) {
      toast({ title: "Please enter your phone number", variant: "destructive" });
      return;
    }
    if (!/^01\d{9}$/.test(phoneVal)) {
      toast({ title: "Enter a valid 11-digit phone number", description: "Example: 01890080280", variant: "destructive" });
      return;
    }
    setLoading(true);
    setSelectedOrder(null);

    try {
      let result;
      if (orderVal) {
        // Normalize order number: accept #VW000001, VW000001, or 123456
        let orderNum = orderVal.toUpperCase().replace(/^#/, "");
        if (/^\d{1,6}$/.test(orderNum)) {
          orderNum = "VW" + orderNum.padStart(6, "0");
        }
        result = await supabase.rpc("track_order_by_number", {
          p_order_number: orderNum,
          p_phone: phoneVal,
        });
      } else {
        result = await supabase.rpc("track_orders_by_phone", {
          p_phone: phoneVal,
        });
      }

      if (result.error) throw result.error;

      const data = (result.data as Order[]) || [];
      setOrders(data);
      setSearched(true);

      if (data.length === 1) {
        setSelectedOrder(data[0]);
      } else if (data.length === 0) {
        toast({ title: "No orders found", description: "Please double-check your phone number and order ID.", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Search failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const isCancelled = selectedOrder?.status === "Cancelled";
  const currentStageIndex = isCancelled ? -1 : STAGES.indexOf(selectedOrder?.status as any);

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-10 max-w-[1440px] mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-foreground mb-2">
            Track My Order
          </h1>
          <p className="font-body text-[13px] text-muted-foreground max-w-md mx-auto">
            Enter your phone number to find your orders. Add an Order ID to find a specific one.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="max-w-lg mx-auto mb-10">
          <div className="space-y-2">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number (01XXXXXXXXX) — required"
              className="w-full bg-card border border-border rounded-lg px-4 py-3 font-body text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Order ID (optional, e.g. VW000123)"
                className="flex-1 bg-card border border-border rounded-lg px-4 py-3 font-body text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
              <Button type="submit" variant="gold" size="lg" disabled={loading}>
                <Search size={16} className="mr-1.5" />
                {loading ? "Searching…" : "Track"}
              </Button>
            </div>
          </div>
        </form>

        {/* Multiple orders list */}
        {searched && orders.length > 1 && !selectedOrder && (
          <div className="max-w-2xl mx-auto mb-10">
            <p className="font-body text-[12px] font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-3">
              {orders.length} orders found — select one to view details
            </p>
            <div className="space-y-2">
              {orders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="w-full text-left bg-card border border-border rounded-xl p-4 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-body text-[13px] font-medium text-foreground">{order.product}</p>
                      <p className="font-body text-[11px] text-muted-foreground flex items-center gap-1.5 flex-wrap">
                        <span className="text-[12px] font-semibold text-foreground">{order.variant}</span>
                        <span className="text-[12px] font-semibold text-foreground">× {order.quantity}</span>
                        <span>·</span>
                        <span>{new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-[14px] font-semibold text-foreground">৳{Number(order.total_price).toLocaleString()}</p>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selected order detail */}
        {selectedOrder && (
          <div className="max-w-5xl mx-auto">
            {orders.length > 1 && (
              <button
                onClick={() => setSelectedOrder(null)}
                className="font-body text-[12px] text-gold hover:text-gold/80 mb-4 flex items-center gap-1 transition-colors"
              >
                ← Back to all orders
              </button>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* LEFT — Order Info + Timeline */}
              <div className="lg:col-span-2 space-y-6">
                {/* Order Summary Card */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
                    <div>
                      <p className="font-body text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1">Order Number</p>
                      <p className="font-body text-[14px] font-bold text-foreground">#{selectedOrder.order_number}</p>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadInvoice(selectedOrder)}
                        disabled={downloadingId === selectedOrder.id}
                        className="border-gold/40 text-gold hover:bg-gold/10 hover:text-gold text-xs h-8 px-3 gap-1.5 transition-colors font-body"
                        title="Download invoice as PDF"
                      >
                        {downloadingId === selectedOrder.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <FileDown className="w-3.5 h-3.5" />
                        )}
                        Invoice (PDF)
                      </Button>
                      <StatusBadge status={selectedOrder.status} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <InfoItem label="Product" value={selectedOrder.product} />
                    <InfoItem label="Variant" value={selectedOrder.variant} />
                    <InfoItem label="Quantity" value={String(selectedOrder.quantity)} />
                    <InfoItem label="Total Price" value={`৳${Number(selectedOrder.total_price).toLocaleString()}`} />
                  </div>

                  <div className="mt-3 pt-3 border-t border-border flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock size={13} />
                      <span className="font-body text-[11px]">
                        Ordered {new Date(selectedOrder.created_at).toLocaleDateString()} at{" "}
                        {new Date(selectedOrder.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    {selectedOrder.delivery_charge > 0 && (
                      <span className="font-body text-[11px] text-muted-foreground">
                        Delivery: ৳{Number(selectedOrder.delivery_charge).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <p className="font-body text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-6">
                    Order Progress
                  </p>

                  {isCancelled ? (
                    <CancelledTimeline />
                  ) : (
                    <div className="overflow-x-auto pb-2">
                      <div className="flex items-center min-w-[500px]">
                        {STAGES.map((stage, i) => {
                          const isCompleted = i <= currentStageIndex;
                          const isCurrent = i === currentStageIndex;
                          return (
                            <div key={stage} className="flex items-center flex-1 last:flex-none">
                              {/* Node */}
                              <div className="flex flex-col items-center">
                                <div
                                  className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                                    isCompleted
                                      ? "bg-gold border-gold text-primary-foreground"
                                      : "bg-secondary border-border text-muted-foreground"
                                  } ${isCurrent ? "ring-4 ring-gold/20" : ""}`}
                                >
                                  {isCompleted ? (
                                    <CheckCircle2 size={16} />
                                  ) : (
                                    <span className="font-body text-[11px] font-bold">{i + 1}</span>
                                  )}
                                </div>
                                <p
                                  className={`font-body text-[10px] mt-2 font-medium tracking-wide text-center ${
                                    isCompleted ? "text-foreground" : "text-muted-foreground"
                                  }`}
                                >
                                  {stage}
                                </p>
                              </div>

                              {/* Connector line */}
                              {i < STAGES.length - 1 && (
                                <div className="flex-1 h-0.5 mx-1.5">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      i < currentStageIndex ? "bg-gold" : "bg-border"
                                    }`}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT — Delivery Info */}
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-xl p-6">
                  <p className="font-body text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-5">
                    Delivery Information
                  </p>

                  <div className="space-y-4">
                    <DeliveryRow icon={<User size={15} />} label="Customer Name" value={selectedOrder.name} />
                    <DeliveryRow icon={<MapPin size={15} />} label="Delivery Address" value={selectedOrder.address} />
                    <DeliveryRow icon={<Phone size={15} />} label="Phone Number" value={selectedOrder.phone} />
                    <DeliveryRow
                      icon={<Package size={15} />}
                      label="Delivery Method"
                      value={
                        charges && Number(selectedOrder.delivery_charge) === charges.inside
                          ? charges.insideLabel || "Inside Chittagong"
                          : charges && Number(selectedOrder.delivery_charge) === charges.outside
                          ? charges.outsideLabel || "Outside Chittagong"
                          : "Standard Delivery"
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!searched && (
          <div className="text-center py-16">
            <Package size={48} className="mx-auto text-muted-foreground/40 mb-4" />
            <p className="font-body text-[13px] text-muted-foreground">
              Enter your phone number or order ID above to get started.
            </p>
          </div>
        )}
      </div>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

/* Sub-components */

const StatusBadge = ({ status }: { status: string }) => {
  const colorMap: Record<string, string> = {
    Pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    Confirmed: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    Processing: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    Shipped: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
    Delivered: "bg-green-500/10 text-green-600 border-green-500/20",
    Cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
  };
  return (
    <span className={`font-body text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-lg border ${colorMap[status] || "bg-secondary text-muted-foreground"}`}>
      {status}
    </span>
  );
};

const InfoItem = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="font-body text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-0.5">{label}</p>
    <p className="font-body text-[13px] font-medium text-foreground">{value}</p>
  </div>
);

const DeliveryRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex gap-3">
    <div className="text-gold mt-0.5">{icon}</div>
    <div>
      <p className="font-body text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-0.5">{label}</p>
      <p className="font-body text-[13px] text-foreground">{value}</p>
    </div>
  </div>
);

const CancelledTimeline = () => (
  <div className="flex items-center gap-4 p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
    <div className="w-10 h-10 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center">
      <XCircle size={20} className="text-red-500" />
    </div>
    <div>
      <p className="font-body text-[13px] font-semibold text-red-600">Order Cancelled</p>
      <p className="font-body text-[11px] text-red-500/70">This order has been cancelled and is no longer being processed.</p>
    </div>
  </div>
);

export default TrackOrderPage;
