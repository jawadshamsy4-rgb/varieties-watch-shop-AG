import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AdminTabNav from "@/components/AdminTabNav";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Save, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminGuard } from "@/hooks/useAdminGuard";

const AdminDeliveryCharges = () => {
  const [insideAmount, setInsideAmount] = useState(60);
  const [outsideAmount, setOutsideAmount] = useState(120);
  const [insideLabel, setInsideLabel] = useState("Inside Chittagong");
  const [outsideLabel, setOutsideLabel] = useState("Outside Chittagong");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { isAdmin } = useAdminGuard();

  useEffect(() => {
    if (isAdmin) {
      void fetchSettings();
    }
  }, [isAdmin]);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", [
          "delivery_charge_inside",
          "delivery_charge_outside",
          "delivery_label_inside",
          "delivery_label_outside"
        ]);

      if (data) {
        for (const row of data) {
          if (row.key === "delivery_charge_inside") {
            const val = typeof row.value === "number" ? row.value : Number(row.value);
            if (Number.isFinite(val)) setInsideAmount(val);
          }
          if (row.key === "delivery_charge_outside") {
            const val = typeof row.value === "number" ? row.value : Number(row.value);
            if (Number.isFinite(val)) setOutsideAmount(val);
          }
          if (row.key === "delivery_label_inside" && typeof row.value === "string") {
            setInsideLabel(row.value);
          }
          if (row.key === "delivery_label_outside" && typeof row.value === "string") {
            setOutsideLabel(row.value);
          }
        }
      }
    } catch (err: any) {
      toast({ title: "Could not load settings", description: err?.message || "", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (insideAmount < 0 || outsideAmount < 0) {
      toast({ title: "Charges cannot be negative", variant: "destructive" });
      return;
    }
    if (!insideLabel.trim() || !outsideLabel.trim()) {
      toast({ title: "Delivery labels cannot be empty", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const updates = [
        { key: "delivery_charge_inside", value: insideAmount as any, updated_at: new Date().toISOString() },
        { key: "delivery_charge_outside", value: outsideAmount as any, updated_at: new Date().toISOString() },
        { key: "delivery_label_inside", value: insideLabel.trim() as any, updated_at: new Date().toISOString() },
        { key: "delivery_label_outside", value: outsideLabel.trim() as any, updated_at: new Date().toISOString() },
      ];

      for (const item of updates) {
        const { error } = await supabase
          .from("site_settings")
          .upsert(item, { onConflict: "key" });
        if (error) throw error;
      }

      toast({
        title: "Delivery settings updated! ✅",
        description: `${insideLabel.trim()}: ৳${insideAmount} · ${outsideLabel.trim()}: ৳${outsideAmount}`
      });
    } catch (err: any) {
      toast({ title: "Failed to update", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-body text-muted-foreground animate-pulse">Loading…</p>
      </div>
    );
  }

  const inputClass =
    "w-full bg-background border border-border rounded-lg px-4 py-3 font-body text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-foreground">Admin Dashboard</h1>
          <p className="font-body text-[11px] text-muted-foreground">Manage your store</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="outline" size="sm">View Site</Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut size={14} className="mr-1.5" /> Logout
          </Button>
        </div>
      </header>

      <AdminTabNav />

      <div className="px-6 py-8 max-w-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
            <Truck size={20} className="text-gold" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">Delivery Charges & Labels</h2>
            <p className="font-body text-[11px] text-muted-foreground">
              Customize delivery zone names and prices. Changes reflect across the checkout immediately.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Zone 1 (Inside) */}
          <div className="p-5 rounded-xl border border-border bg-card space-y-4">
            <h3 className="font-display text-sm font-semibold text-gold uppercase tracking-wider">Zone 1 (Primary / Local)</h3>
            <div>
              <label className="font-body text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-1.5 block">
                Zone Label / Text
              </label>
              <input
                type="text"
                value={insideLabel}
                onChange={(e) => setInsideLabel(e.target.value)}
                placeholder="e.g. Inside Chittagong"
                className={inputClass}
              />
            </div>
            <div>
              <label className="font-body text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-1.5 block">
                Charge Amount (BDT)
              </label>
              <input
                type="number"
                min={0}
                value={insideAmount}
                onChange={(e) => setInsideAmount(Math.max(0, Number(e.target.value)))}
                className={inputClass}
              />
            </div>
          </div>

          {/* Zone 2 (Outside) */}
          <div className="p-5 rounded-xl border border-border bg-card space-y-4">
            <h3 className="font-display text-sm font-semibold text-gold uppercase tracking-wider">Zone 2 (Secondary / Nationwide)</h3>
            <div>
              <label className="font-body text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-1.5 block">
                Zone Label / Text
              </label>
              <input
                type="text"
                value={outsideLabel}
                onChange={(e) => setOutsideLabel(e.target.value)}
                placeholder="e.g. Outside Chittagong"
                className={inputClass}
              />
            </div>
            <div>
              <label className="font-body text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-1.5 block">
                Charge Amount (BDT)
              </label>
              <input
                type="number"
                min={0}
                value={outsideAmount}
                onChange={(e) => setOutsideAmount(Math.max(0, Number(e.target.value)))}
                className={inputClass}
              />
            </div>
          </div>

          <Button variant="gold" size="lg" onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
            <Save size={14} className="mr-1.5" />
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminDeliveryCharges;
