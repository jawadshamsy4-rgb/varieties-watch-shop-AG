import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminTabNav from "@/components/AdminTabNav";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Mail, CheckCircle, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminGuard } from "@/hooks/useAdminGuard";

const AdminDashboard = () => {
  const [email, setEmail] = useState("");
  const [savedEmail, setSavedEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAdminGuard();

  useEffect(() => {
    if (isAdmin) {
      fetchSettings();
    }
  }, [isAdmin]);

  const fetchSettings = async () => {
    setLoading(true);
    const { data: setting } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "notification_email")
      .maybeSingle();

    if (setting?.value && typeof setting.value === "object" && "email" in (setting.value as any)) {
      const stored = (setting.value as any).email || "";
      setEmail(stored);
      setSavedEmail(stored);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!email.trim()) {
      toast({ title: "Please enter an email address", variant: "destructive" });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast({ title: "Please enter a valid email address", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: "notification_email", value: { email: email.trim() } }, { onConflict: "key" });

    if (error) {
      toast({ title: "Failed to save email", description: error.message, variant: "destructive" });
    } else {
      setSavedEmail(email.trim());
      toast({ title: "Email saved successfully!", description: "Order notifications will be sent to this address." });
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-body text-muted-foreground">Loading dashboard…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-foreground">Dashboard</h1>
          <p className="font-body text-[12px] text-muted-foreground">Varieties Watch Shop — Admin Dashboard</p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut size={14} className="mr-1.5" /> Logout
        </Button>
      </header>

      <AdminTabNav />

      <div className="px-6 py-6 max-w-2xl">
        {/* Email Notification Settings */}
        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail size={18} className="text-gold" />
            <h2 className="font-display text-lg text-foreground">Order Notification Email</h2>
          </div>
          <p className="font-body text-[12px] text-muted-foreground mb-4">
            Enter a Gmail address to receive order notifications whenever a customer places an order.
          </p>
          <div className="flex gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="yourname@gmail.com"
              className="flex-1 bg-background border border-border rounded-lg px-4 py-2.5 font-body text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
            <Button variant="gold" size="sm" onClick={handleSave} disabled={saving}>
              <Save size={14} className="mr-1.5" />
              {saving ? "Saving…" : "Save Email"}
            </Button>
          </div>
        </div>

        {/* Notification Status */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-display text-sm text-foreground mb-3">Notification Status</h3>
          {savedEmail ? (
            <div className="flex items-start gap-3">
              <CheckCircle size={18} className="text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-body text-[13px] text-foreground font-medium">Email notifications active</p>
                <p className="font-body text-[12px] text-muted-foreground mt-0.5">
                  Notifications will be sent to <span className="font-semibold text-foreground">{savedEmail}</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <Mail size={18} className="text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="font-body text-[13px] text-muted-foreground">No email configured</p>
                <p className="font-body text-[12px] text-muted-foreground mt-0.5">
                  Set an email above to start receiving order notifications.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
