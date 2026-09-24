import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminTabNav from "@/components/AdminTabNav";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategoryDiscounts, useUpdateCategoryDiscount, type CategoryDiscount } from "@/hooks/useCategoryDiscounts";
import { toast } from "@/hooks/use-toast";
import { LogOut, Save, Percent, BadgeDollarSign } from "lucide-react";
import { useAdminGuard } from "@/hooks/useAdminGuard";

const AdminDiscounts = () => {
  const navigate = useNavigate();
  useAdminGuard();
  const { data: discounts, isLoading } = useCategoryDiscounts();
  const updateDiscount = useUpdateCategoryDiscount();
  const [edits, setEdits] = useState<Record<string, Partial<CategoryDiscount>>>({});

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin");
  };

  const getEdited = (d: CategoryDiscount) => ({ ...d, ...edits[d.id] });

  const setField = (id: string, field: string, value: any) => {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const handleSave = async (d: CategoryDiscount) => {
    const edited = getEdited(d);
    try {
      await updateDiscount.mutateAsync({
        id: d.id,
        discount_type: edited.discount_type,
        discount_value: Number(edited.discount_value),
        enabled: edited.enabled,
      });
      setEdits((prev) => {
        const copy = { ...prev };
        delete copy[d.id];
        return copy;
      });
      toast({ title: `${d.category} discount updated` });
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  };

  const handleQuickToggle = async (d: CategoryDiscount) => {
    try {
      await updateDiscount.mutateAsync({ id: d.id, enabled: !d.enabled });
      toast({ title: `${d.category} discount ${!d.enabled ? "enabled" : "disabled"}` });
    } catch {
      toast({ title: "Failed to toggle", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-light text-foreground">Category Discounts</h1>
            <p className="font-body text-xs text-muted-foreground italic mt-1">Varieties Watch Shop — Admin Dashboard</p>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 font-body text-xs text-muted-foreground hover:text-foreground transition-colors">
            <LogOut size={16} /> Logout
          </button>
        </div>

        <AdminTabNav />

        <div className="mt-6 bg-card border border-border rounded-lg overflow-hidden">
          {isLoading ? (
            <p className="p-8 text-center text-muted-foreground font-body text-sm">Loading discounts…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left font-body text-[10px] md:text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground px-4 md:px-6 py-3">Category</th>
                    <th className="text-left font-body text-[10px] md:text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground px-4 md:px-6 py-3">Type</th>
                    <th className="text-left font-body text-[10px] md:text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground px-4 md:px-6 py-3">Value</th>
                    <th className="text-center font-body text-[10px] md:text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground px-4 md:px-6 py-3">Status</th>
                    <th className="text-center font-body text-[10px] md:text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground px-4 md:px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(discounts || []).map((d) => {
                    const edited = getEdited(d);
                    const hasChanges = !!edits[d.id];
                    return (
                      <tr key={d.id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                        <td className="px-4 md:px-6 py-4">
                          <span className="font-body text-sm font-semibold text-foreground">{d.category}</span>
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <Select
                            value={edited.discount_type}
                            onValueChange={(v) => setField(d.id, "discount_type", v)}
                          >
                            <SelectTrigger className="w-[140px] h-9 font-body text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">
                                <span className="flex items-center gap-1.5"><Percent size={12} /> Percentage (%)</span>
                              </SelectItem>
                              <SelectItem value="fixed">
                                <span className="flex items-center gap-1.5"><BadgeDollarSign size={12} /> Fixed (৳)</span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={0}
                              value={edited.discount_value}
                              onChange={(e) => setField(d.id, "discount_value", e.target.value)}
                              className="w-24 h-9 font-body text-sm"
                            />
                            <span className="font-body text-xs text-muted-foreground">
                              {edited.discount_type === "percentage" ? "%" : "৳"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Switch
                              checked={edited.enabled}
                              onCheckedChange={(v) => {
                                if (!hasChanges) {
                                  handleQuickToggle(d);
                                } else {
                                  setField(d.id, "enabled", v);
                                }
                              }}
                            />
                            <span className={`font-body text-[10px] font-semibold tracking-wider uppercase ${edited.enabled ? "text-green-600" : "text-muted-foreground"}`}>
                              {edited.enabled ? "Active" : "Off"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4 text-center">
                          <Button
                            size="sm"
                            variant={hasChanges ? "default" : "outline"}
                            disabled={!hasChanges || updateDiscount.isPending}
                            onClick={() => handleSave(d)}
                            className="gap-1.5 font-body text-[11px] tracking-wider uppercase"
                          >
                            <Save size={14} /> Save
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDiscounts;
