import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AdminTabNav from "@/components/AdminTabNav";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

interface TrendingProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  image_url: string;
  is_trending: boolean;
}

const MAX_TRENDING = 6;

const AdminTrendingProducts = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<TrendingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/admin"); return; }
      const { data } = await supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" });
      if (!data) navigate("/admin");
    };
    checkAdmin();
  }, [navigate]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("id, name, brand, category, image_url, is_trending")
      .order("name");
    if (error) {
      toast({ title: "Error", description: "Failed to load products", variant: "destructive" });
    } else {
      setProducts((data as TrendingProduct[]) || []);
    }
    setLoading(false);
  };

  const trendingCount = products.filter(p => p.is_trending).length;

  const toggleTrending = (id: string) => {
    setProducts(prev => {
      const product = prev.find(p => p.id === id);
      if (!product) return prev;

      if (!product.is_trending && trendingCount >= MAX_TRENDING) {
        toast({
          title: "Limit reached",
          description: `You can select a maximum of ${MAX_TRENDING} trending products.`,
          variant: "destructive",
        });
        return prev;
      }

      return prev.map(p => p.id === id ? { ...p, is_trending: !p.is_trending } : p);
    });
  };

  const handleSave = async () => {
    const currentTrending = products.filter(p => p.is_trending);
    if (currentTrending.length > MAX_TRENDING) {
      toast({ title: "Error", description: `Maximum ${MAX_TRENDING} products allowed.`, variant: "destructive" });
      return;
    }

    setSaving(true);

    // Set all to false first, then set selected to true
    const { error: resetError } = await supabase
      .from("products")
      .update({ is_trending: false } as any)
      .neq("id", "00000000-0000-0000-0000-000000000000"); // update all

    if (resetError) {
      toast({ title: "Error", description: "Failed to save changes", variant: "destructive" });
      setSaving(false);
      return;
    }

    if (currentTrending.length > 0) {
      const trendingIds = currentTrending.map(p => p.id);
      const { error: setError } = await supabase
        .from("products")
        .update({ is_trending: true } as any)
        .in("id", trendingIds);

      if (setError) {
        toast({ title: "Error", description: "Failed to save changes", variant: "destructive" });
        setSaving(false);
        return;
      }
    }

    toast({ title: "Saved", description: `${currentTrending.length} trending product(s) updated.` });
    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-foreground">Trending Products</h1>
          <p className="font-body text-[12px] text-muted-foreground">Varieties Watch Shop — Admin Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut size={14} className="mr-1.5" /> Logout
          </Button>
        </div>
      </header>

      <AdminTabNav />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground font-body text-sm">
            Select up to {MAX_TRENDING} products to display on the homepage. Currently selected: <span className="font-bold text-foreground">{trendingCount}</span>/{MAX_TRENDING}
          </p>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Check size={16} />
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-12">Loading products…</p>
        ) : products.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No products found in the database.</p>
        ) : (
          <div className="space-y-2">
            {products.map(product => (
              <div
                key={product.id}
                className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                  product.is_trending
                    ? "border-gold/50 bg-gold/5"
                    : "border-border bg-card"
                }`}
              >
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-12 h-12 rounded object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-foreground text-sm truncate">{product.name}</p>
                  <p className="font-body text-xs text-muted-foreground">{product.brand} · {product.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-body text-xs text-muted-foreground">
                    {product.is_trending ? "Trending" : ""}
                  </span>
                  <Switch
                    checked={product.is_trending}
                    onCheckedChange={() => toggleTrending(product.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {trendingCount === 0 && !loading && (
          <div className="mt-6 p-4 rounded-lg bg-muted text-center">
            <p className="text-muted-foreground font-body text-sm">No trending products selected.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminTrendingProducts;
