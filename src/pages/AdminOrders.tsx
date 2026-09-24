import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AdminTabNav from "@/components/AdminTabNav";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Download, Package, Trash2, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAdminGuard } from "@/hooks/useAdminGuard";

const STATUS_OPTIONS = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"];
const FILTER_TABS = ["All", "Pending", "Processing", "Confirmed", "Shipped", "Delivered", "Cancelled"] as const;
type FilterTab = typeof FILTER_TABS[number];

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
  selected_perfumes: string[] | null;
}

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterTab>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const { isAdmin } = useAdminGuard();

  useEffect(() => {
    if (isAdmin) {
      void fetchOrders();
    }
  }, [isAdmin]);

  const fetchOrders = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders((data as Order[]) || []);
    } catch (err: any) {
      const msg = err?.message || "Something went wrong";
      setLoadError(msg);
      toast({ title: "Failed to load orders", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      toast({ title: "Failed to update status", description: error.message, variant: "destructive" });
      return;
    }

    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    toast({ title: "Status updated", description: `Order status changed to ${newStatus}.` });
  };

  const handleDeleteOrder = async (orderId: string) => {
    const { error } = await supabase.from("orders").delete().eq("id", orderId);
    if (error) {
      toast({ title: "Failed to delete order", description: error.message, variant: "destructive" });
      return;
    }
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    toast({ title: "Item deleted successfully." });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin");
  };

  const exportToCSV = () => {
    if (orders.length === 0) return;
    const headers = ["Order ID", "Name", "Phone", "Address", "Product", "Set Products", "Variant", "Qty", "Total", "Delivery", "Status", "Date"];
    const rows = orders.map((o) => [
      "#" + o.order_number, o.name, o.phone, `"${(o.address || "Address not provided").replace(/"/g, '""')}"`,
      o.product, `"${(o.selected_perfumes || []).join(", ")}"`,
      o.variant, o.quantity, o.total_price,
      o.delivery_charge, o.status,
      new Date(o.created_at).toLocaleString(),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Orders exported!", description: `${orders.length} orders downloaded as CSV.` });
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "Pending": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "Confirmed": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "Processing": return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "Shipped": return "bg-cyan-500/10 text-cyan-600 border-cyan-500/20";
      case "Delivered": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "Cancelled": return "bg-red-500/10 text-red-600 border-red-500/20";
      default: return "bg-secondary text-muted-foreground";
    }
  };

  const statusCounts = STATUS_OPTIONS.reduce<Record<string, number>>((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s).length;
    return acc;
  }, {});
  const statusRevenue = STATUS_OPTIONS.reduce<Record<string, number>>((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s).reduce((sum, o) => sum + Number(o.total_price || 0), 0);
    return acc;
  }, {});
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_price || 0), 0);
  const filteredOrders = statusFilter === "All" ? orders : orders.filter((o) => o.status === statusFilter);
  const displayOrders = filteredOrders.filter((o) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      o.order_number.toLowerCase().includes(q) ||
      o.phone.toLowerCase().includes(q)
    );
  });
  const tabAccent = (s: FilterTab) => {
    switch (s) {
      case "Pending": return "text-yellow-500";
      case "Confirmed": return "text-blue-400";
      case "Processing": return "text-purple-400";
      case "Shipped": return "text-cyan-400";
      case "Delivered": return "text-green-500";
      case "Cancelled": return "text-red-500";
      default: return "text-gold";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="font-body text-muted-foreground">Loading orders…</p>
          <Button variant="cta-outline" size="sm" onClick={() => window.location.reload()}>
            Taking too long? Reload
          </Button>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm px-6">
          <p className="font-display text-xl text-foreground">Could not load orders</p>
          <p className="font-body text-[13px] text-muted-foreground">{loadError}</p>
          <Button variant="cta-outline" size="sm" onClick={() => void fetchOrders()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-foreground">Order Management</h1>
          <p className="font-body text-[12px] text-muted-foreground">Varieties Watch Shop — Admin Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="cta-outline" size="sm" onClick={exportToCSV} disabled={orders.length === 0}>
            <Download size={14} className="mr-1.5" /> Export CSV
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut size={14} className="mr-1.5" /> Logout
          </Button>
        </div>
      </header>

      <AdminTabNav />

      <div className="px-6 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="font-body text-[10px] uppercase tracking-wider text-muted-foreground">Total Orders</p>
            <p className="font-display text-3xl font-semibold text-foreground">{orders.length}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="font-body text-[10px] uppercase tracking-wider text-muted-foreground">Total Revenue</p>
            <p className="font-display text-3xl font-semibold text-foreground">
              ৳{orders.reduce((sum, o) => sum + Number(o.total_price), 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="font-body text-[10px] uppercase tracking-wider text-muted-foreground">Today's Orders</p>
            <p className="font-display text-3xl font-semibold text-foreground">
              {orders.filter((o) => new Date(o.created_at).toDateString() === new Date().toDateString()).length}
            </p>
          </div>
        </div>

        {/* Search + Status filter tabs */}
        <div className="mb-4">
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order ID or Phone Number..."
              className="w-full bg-card border border-border rounded-xl pl-10 pr-10 py-3 font-body text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 md:gap-3">
          {FILTER_TABS.map((tab) => {
            const count = tab === "All" ? orders.length : (statusCounts[tab] || 0);
            const revenue = tab === "All" ? totalRevenue : (statusRevenue[tab] || 0);
            const isActive = statusFilter === tab;
            return (
              <button
                key={tab}
                onClick={() => setStatusFilter((prev) => (prev === tab && tab !== "All" ? "All" : tab))}
                className={`group relative text-left rounded-xl border px-3 py-3 md:px-4 md:py-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/40 ${
                  isActive
                    ? "bg-gold/10 border-gold/50 shadow-[0_0_0_1px_hsl(var(--gold)/0.3)]"
                    : "bg-card border-border"
                }`}
              >
                <p className={`font-body text-[9px] md:text-[10px] uppercase tracking-[0.15em] ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                  {tab === "All" ? "All Orders" : tab}
                </p>
                <p className={`font-display text-xl md:text-2xl font-semibold mt-1 ${isActive ? tabAccent(tab) : "text-foreground"}`}>
                  {count}
                  <span className="font-body text-[10px] md:text-[11px] text-muted-foreground ml-1.5 font-normal normal-case tracking-normal">Orders</span>
                </p>
                <p className="font-body text-[11px] md:text-[12px] text-muted-foreground mt-1 font-normal normal-case tracking-normal">
                  ৳{revenue.toLocaleString()}
                </p>
              </button>
            );
          })}
        </div>

        {displayOrders.length === 0 ? (
          <div className="text-center py-20">
            {searchQuery ? (
              <>
                <Search size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="font-display text-xl text-foreground mb-1">
                  No matching orders found
                </p>
                <p className="font-body text-[13px] text-muted-foreground">
                  Try adjusting your search or filter.
                </p>
              </>
            ) : (
              <>
                <Package size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="font-display text-xl text-foreground mb-1">
                  {orders.length === 0 ? "No orders yet" : `No ${statusFilter} orders`}
                </p>
                <p className="font-body text-[13px] text-muted-foreground">
                  {orders.length === 0 ? "Orders will appear here when customers place them." : "Try selecting a different status."}
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                     <th className="font-body text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground text-left px-4 py-3">Order ID</th>
                     <th className="font-body text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground text-left px-4 py-3">Name</th>
                     <th className="font-body text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground text-left px-4 py-3">Phone</th>
                     <th className="font-body text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground text-left px-4 py-3">Address</th>
                     <th className="font-body text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground text-left px-4 py-3">Product</th>
                     <th className="font-body text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground text-left px-4 py-3">Set Products</th>
                     <th className="font-body text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground text-left px-4 py-3">Variant</th>
                     <th className="font-body text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground text-left px-4 py-3">Qty</th>
                     <th className="font-body text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground text-left px-4 py-3">Total</th>
                     <th className="font-body text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground text-left px-4 py-3">Delivery</th>
                     <th className="font-body text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground text-left px-4 py-3">Status</th>
                     <th className="font-body text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground text-left px-4 py-3">Date</th>
                     <th className="font-body text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground text-left px-4 py-3">Delete</th>
                   </tr>
                 </thead>
                 <tbody>
                   {displayOrders.map((order, idx) => (
                     <tr key={order.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                       <td className="font-body text-[12px] font-semibold text-foreground px-4 py-3">#{order.order_number}</td>
                       <td className="font-body text-[13px] font-medium text-foreground px-4 py-3">{order.name}</td>
                       <td className="font-body text-[13px] text-foreground px-4 py-3">{order.phone}</td>
                       <td className="font-body text-[12px] text-muted-foreground px-4 py-3 max-w-[250px] break-words">{order.address || "Address not provided"}</td>
                        <td className="font-body text-[13px] font-medium text-foreground px-4 py-3">{order.product}</td>
                         <td className="font-body text-[12px] text-muted-foreground px-4 py-3 max-w-[250px]">
                           {order.selected_perfumes && order.selected_perfumes.length > 0
                             ? order.selected_perfumes.map((p, i) => (
                                 <div key={i} className="whitespace-nowrap">{i + 1}. {p}</div>
                               ))
                             : <span className="text-muted-foreground">—</span>}
                         </td>
                        <td className="font-body text-[12px] text-muted-foreground px-4 py-3">{order.variant}</td>
                        <td className="font-body text-[13px] text-foreground px-4 py-3">{order.quantity}</td>
                        <td className="font-display text-[14px] font-semibold text-foreground px-4 py-3">৳{Number(order.total_price).toLocaleString()}</td>
                         <td className="font-body text-[12px] text-muted-foreground px-4 py-3">৳{Number(order.delivery_charge || 0).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className={`font-body text-[11px] font-semibold rounded-lg border px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-gold/30 cursor-pointer ${statusColor(order.status)}`}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="font-body text-[12px] text-muted-foreground px-4 py-3 whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString()}<br />
                        <span className="text-[10px]">{new Date(order.created_at).toLocaleTimeString()}</span>
                      </td>
                      <td className="px-4 py-3">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                              <Trash2 size={14} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-card border-border">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="font-display text-foreground">Are you sure you want to delete this item?</AlertDialogTitle>
                              <AlertDialogDescription className="font-body text-muted-foreground">This action cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="font-body">Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteOrder(order.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-body">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
