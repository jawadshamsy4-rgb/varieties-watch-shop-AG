import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Plus, Pencil, Trash2, Package, X, Upload, Home } from "lucide-react";
import AdminTabNav from "@/components/AdminTabNav";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SITE_CATEGORIES } from "@/data/categories";
import { useBrands } from "@/hooks/useBrands";
import { useAdminGuard } from "@/hooks/useAdminGuard";

interface VariantInput {
  size: string;
  price: number;
  bestFor: string;
}

interface ProductForm {
  name: string;
  brand: string;
  price: number;
  original_price: number | null;
  category: string;
  description: string;
  badge: string;
  tagline: string;
  story: string;
  in_stock: boolean;
  variants: VariantInput[];
  product_images: string[];
  discount_enabled: boolean;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  fragrance_details: {
    type: string;
    notes: { top: string[]; middle: string[]; base: string[] };
    longevity: string;
    sillage: string;
    bestTime: string;
  };
}

const emptyForm: ProductForm = {
  name: "",
  brand: "",
  price: 0,
  original_price: null,
  category: "",
  description: "",
  badge: "",
  tagline: "",
  story: "",
  in_stock: true,
  variants: [{ size: "", price: 0, bestFor: "" }],
  product_images: [],
  discount_enabled: false,
  discount_type: "percentage",
  discount_value: 0,
  fragrance_details: {
    type: "",
    notes: { top: [], middle: [], base: [] },
    longevity: "",
    sillage: "",
    bestTime: "",
  },
};

interface DbProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  original_price: number | null;
  rating: number;
  review_count: number;
  image_url: string;
  category: string;
  description: string;
  badge: string | null;
  tagline: string;
  story: string;
  variants: any;
  fragrance_details: any;
  reviews: any;
  created_at: string;
  in_stock: boolean;
}

const AdminProducts = () => {
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>({ ...emptyForm });
  const [pendingImageFiles, setPendingImageFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: brandList = [] } = useBrands(false);

  const { loading: authLoading, isAdmin } = useAdminGuard();

  useEffect(() => {
    if (isAdmin) {
      fetchProducts();
    }
  }, [isAdmin]);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products").select("*").order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Failed to load products", description: error.message, variant: "destructive" });
    } else {
      setProducts((data as DbProduct[]) || []);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin");
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm, variants: [{ size: "", price: 0, bestFor: "" }] });
    setPendingImageFiles([]);
    setModalOpen(true);
  };

  const openEdit = (p: DbProduct) => {
    setEditingId(p.id);
    const variants = (p.variants as VariantInput[]) || [{ size: "", price: 0, bestFor: "" }];
    const existingImages = (p as any).product_images as string[] || [];
    setForm({
      name: p.name,
      brand: p.brand,
      price: Number(p.price),
      original_price: p.original_price ? Number(p.original_price) : null,
      category: p.category,
      description: p.description,
      badge: p.badge || "",
      tagline: p.tagline,
      story: p.story,
      in_stock: p.in_stock !== false,
      variants,
      product_images: existingImages.length > 0 ? existingImages : (p.image_url ? [p.image_url] : []),
      discount_enabled: (p as any).discount_enabled ?? false,
      discount_type: ((p as any).discount_type as "percentage" | "fixed") || "percentage",
      discount_value: (p as any).discount_value != null ? Number((p as any).discount_value) : 0,
      fragrance_details: p.fragrance_details || emptyForm.fragrance_details,
    });
    setPendingImageFiles([]);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast({ title: "Product deleted" });
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: "Product name is required", variant: "destructive" });
      return;
    }
    setSubmitting(true);

    try {
      // Upload any pending image files
      const uploadedUrls: string[] = [];
      for (const file of pendingImageFiles) {
        const url = await uploadImage(file);
        uploadedUrls.push(url);
      }
      const allImages = [...form.product_images, ...uploadedUrls];
      const imageUrl = allImages[0] || "";

      // Auto-set price from highest variant
      const mainPrice = form.variants.length > 0
        ? Math.max(...form.variants.map((v) => v.price))
        : form.price;

      const payload = {
        name: form.name.trim(),
        brand: form.brand.trim(),
        price: mainPrice,
        original_price: form.original_price || null,
        image_url: imageUrl,
        product_images: allImages,
        category: form.category.trim(),
        description: form.description.trim(),
        badge: form.badge.trim() || null,
        tagline: form.tagline.trim(),
        story: form.story.trim(),
        in_stock: form.in_stock,
        variants: JSON.parse(JSON.stringify(form.variants.filter((v) => v.size.trim()))),
        fragrance_details: JSON.parse(JSON.stringify(form.fragrance_details)),
        discount_enabled: form.discount_enabled,
        discount_type: form.discount_type,
        discount_value: form.discount_value || 0,
      };

      if (editingId) {
        const { error } = await supabase.from("products").update(payload).eq("id", editingId);
        if (error) throw error;
        toast({ title: "Product updated" });
      } else {
        const { error } = await supabase.from("products").insert([payload]);
        if (error) throw error;
        toast({ title: "Product added" });
      }

      setModalOpen(false);
      await fetchProducts();
    } catch (err: any) {
      toast({ title: "Failed to save product", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const updateVariant = (idx: number, field: keyof VariantInput, value: string | number) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) => (i === idx ? { ...v, [field]: value } : v)),
    }));
  };

  const addVariant = () => {
    setForm((prev) => ({ ...prev, variants: [...prev.variants, { size: "", price: 0, bestFor: "" }] }));
  };

  const removeVariant = (idx: number) => {
    setForm((prev) => ({ ...prev, variants: prev.variants.filter((_, i) => i !== idx) }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-body text-muted-foreground">Loading products…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 md:px-6 py-3 md:py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-0">
        <div className="flex items-center justify-between md:block">
          <div>
            <h1 className="font-display text-lg md:text-2xl text-foreground">Product Management</h1>
            <p className="font-body text-[10px] md:text-[12px] text-muted-foreground">Varieties Watch Shop — Admin Dashboard</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="md:hidden">
            <LogOut size={14} />
          </Button>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <Button asChild variant="ghost" size="sm" className="text-[11px] md:text-sm">
            <Link to="/"><Home size={14} className="mr-1.5" /> Home</Link>
          </Button>
          <Button variant="gold" size="sm" onClick={openAdd} className="text-[11px] md:text-sm flex-1 md:flex-none">
            <Plus size={14} className="mr-1" /> Add New Product
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="hidden md:inline-flex">
            <LogOut size={14} className="mr-1.5" /> Logout
          </Button>
        </div>
      </header>

      {/* Tab Navigation */}
      <AdminTabNav />

      <div className="px-3 md:px-6 py-4 md:py-6">
        {products.length === 0 ? (
          <div className="text-center py-20">
            <Package size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="font-display text-xl text-foreground mb-1">No products yet</p>
            <p className="font-body text-[13px] text-muted-foreground mb-6">Add your first product to get started.</p>
            <Button variant="gold" onClick={openAdd}>
              <Plus size={14} className="mr-1.5" /> Add New Product
            </Button>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="font-body text-[8px] md:text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground text-left px-2 md:px-4 py-2 md:py-3">Image</th>
                    <th className="font-body text-[8px] md:text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground text-left px-2 md:px-4 py-2 md:py-3">Product Name</th>
                    <th className="font-body text-[8px] md:text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground text-left px-2 md:px-4 py-2 md:py-3">Brand</th>
                    <th className="font-body text-[8px] md:text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground text-left px-2 md:px-4 py-2 md:py-3">Status</th>
                    <th className="font-body text-[8px] md:text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground text-left px-2 md:px-4 py-2 md:py-3">Sizes</th>
                    <th className="font-body text-[8px] md:text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground text-left px-2 md:px-4 py-2 md:py-3">Prices</th>
                    <th className="font-body text-[8px] md:text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground text-left px-2 md:px-4 py-2 md:py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const variants = (p.variants as VariantInput[]) || [];
                    return (
                      <tr key={p.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                        <td className="px-2 md:px-4 py-2 md:py-3">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} className="w-8 h-8 md:w-12 md:h-12 rounded-lg object-cover" />
                          ) : (
                            <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg bg-secondary flex items-center justify-center">
                              <Package size={12} className="md:hidden text-muted-foreground" />
                              <Package size={16} className="hidden md:block text-muted-foreground" />
                            </div>
                          )}
                        </td>
                        <td className="font-body text-[11px] md:text-[13px] font-medium text-foreground px-2 md:px-4 py-2 md:py-3">{p.name}</td>
                        <td className="font-body text-[10px] md:text-[12px] text-muted-foreground px-2 md:px-4 py-2 md:py-3">{p.brand}</td>
                        <td className="px-2 md:px-4 py-2 md:py-3">
                          <button
                            onClick={async () => {
                              const newStatus = !(p as any).in_stock !== false ? false : true;
                              const { error } = await supabase.from("products").update({ in_stock: newStatus } as any).eq("id", p.id);
                              if (error) {
                                toast({ title: "Failed to update status", description: error.message, variant: "destructive" });
                              } else {
                                setProducts((prev) => prev.map((prod) => prod.id === p.id ? { ...prod, in_stock: newStatus } as any : prod));
                                toast({ title: newStatus ? "Marked In Stock" : "Marked Out of Stock" });
                              }
                            }}
                            className="flex items-center gap-1.5 cursor-pointer group"
                            title={`Click to mark ${(p as any).in_stock !== false ? 'Out of Stock' : 'In Stock'}`}
                          >
                            <span className={`inline-block w-2.5 h-2.5 rounded-full ${(p as any).in_stock !== false ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className={`font-body text-[10px] md:text-[11px] ${(p as any).in_stock !== false ? 'text-green-600' : 'text-red-500'}`}>
                              {(p as any).in_stock !== false ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </button>
                        </td>
                        <td className="font-body text-[10px] md:text-[12px] text-muted-foreground px-2 md:px-4 py-2 md:py-3">
                          {variants.map((v) => v.size).join(", ") || "—"}
                        </td>
                        <td className="font-body text-[10px] md:text-[12px] text-foreground px-2 md:px-4 py-2 md:py-3">
                          {variants.map((v) => `৳${v.price}`).join(", ") || `৳${Number(p.price)}`}
                        </td>
                        <td className="px-2 md:px-4 py-2 md:py-3">
                          <div className="flex items-center gap-1 md:gap-2">
                            <Button variant="ghost" size="icon" className="h-7 w-7 md:h-9 md:w-9" onClick={() => openEdit(p)}>
                              <Pencil size={12} className="md:hidden" />
                              <Pencil size={14} className="hidden md:block" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 md:h-9 md:w-9 text-destructive hover:text-destructive" onClick={() => handleDelete(p.id)}>
                              <Trash2 size={12} className="md:hidden" />
                              <Trash2 size={14} className="hidden md:block" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Product Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-2xl bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-foreground">
              {editingId ? "Edit Product" : "Add New Product"}
            </DialogTitle>
            <DialogDescription className="font-body text-[13px] text-muted-foreground">
              Fill in the product details below.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {/* Image Upload */}
            <div>
              <label className="font-body text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-1.5 block">
                Product Images (up to 10)
              </label>
              <div className="flex flex-wrap gap-3 mb-3">
                {form.product_images.map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url} alt={`Image ${i + 1}`} className="w-16 h-16 rounded-lg object-cover border border-border" />
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, product_images: prev.product_images.filter((_, idx) => idx !== i) }))}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-0 left-0 right-0 bg-gold/90 text-primary-foreground text-[8px] text-center py-0.5 rounded-b-lg font-body font-semibold">
                        Primary
                      </span>
                    )}
                  </div>
                ))}
                {pendingImageFiles.map((file, i) => (
                  <div key={`pending-${i}`} className="relative group">
                    <img src={URL.createObjectURL(file)} alt={`Pending ${i + 1}`} className="w-16 h-16 rounded-lg object-cover border border-border border-dashed" />
                    <button
                      type="button"
                      onClick={() => setPendingImageFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
              {(form.product_images.length + pendingImageFiles.length) < 10 && (
                <label className="inline-flex items-center gap-2 cursor-pointer bg-secondary hover:bg-muted px-4 py-2.5 rounded-lg font-body text-[12px] text-foreground transition-colors">
                  <Upload size={14} />
                  Add Image
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      const remaining = 10 - form.product_images.length - pendingImageFiles.length;
                      const toAdd = files.slice(0, remaining);
                      if (toAdd.length > 0) setPendingImageFiles((prev) => [...prev, ...toAdd]);
                      if (files.length > remaining) {
                        toast({ title: `Only ${remaining} more image(s) allowed`, variant: "destructive" });
                      }
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-body text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-1.5 block">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 font-body text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
              <div>
                <label className="font-body text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-1.5 block">
                  Brand Name
                </label>
                <select
                  value={
                    brandList.some((b) => b.label === form.brand) || form.brand === ""
                      ? form.brand
                      : "__custom__"
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "__custom__") return;
                    setForm((p) => ({ ...p, brand: v }));
                  }}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 font-body text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-gold/30"
                >
                  <option value="">Select a brand</option>
                  {brandList.map((b) => (
                    <option key={b.id} value={b.label}>{b.label}</option>
                  ))}
                  {form.brand && !brandList.some((b) => b.label === form.brand) && (
                    <option value="__custom__">{form.brand} (custom)</option>
                  )}
                </select>
                <p className="mt-1.5 font-body text-[10px] text-muted-foreground">
                  Manage brands in the Brands tab.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-body text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-1.5 block">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 font-body text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-gold/30"
                >
                  <option value="">Select Category</option>
                  {SITE_CATEGORIES.map((c) => (
                    <option key={c.slug} value={c.label}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-body text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-1.5 block">
                  Badge (optional)
                </label>
                <input
                  type="text"
                  value={form.badge}
                  onChange={(e) => setForm((p) => ({ ...p, badge: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 font-body text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-gold/30"
                  placeholder="e.g. Bestseller, New, Trending"
                />
              </div>
            </div>

            {/* Product Availability Toggle */}
            <div className="flex items-center justify-between bg-background border border-border rounded-lg px-4 py-3">
              <div>
                <label className="font-body text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground block">
                  Product Availability
                </label>
                <p className="font-body text-[11px] text-muted-foreground mt-0.5">
                  {form.in_stock ? "Product is visible and available for purchase" : "Product will show as Out of Stock"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, in_stock: !p.in_stock }))}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ${form.in_stock ? 'bg-green-500' : 'bg-muted'}`}
              >
                <span className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${form.in_stock ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Product Discount */}
            <div className="bg-background border border-border rounded-lg px-4 py-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-body text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground block">
                    Product Discount
                  </label>
                  <p className="font-body text-[11px] text-muted-foreground mt-0.5">
                    {form.discount_enabled
                      ? "Overrides the category discount for this product"
                      : "Disabled — category discount (if any) will apply"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, discount_enabled: !p.discount_enabled }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ${form.discount_enabled ? 'bg-gold' : 'bg-muted'}`}
                >
                  <span className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${form.discount_enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
              {form.discount_enabled && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-body text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-1.5 block">
                      Discount Type
                    </label>
                    <select
                      value={form.discount_type}
                      onChange={(e) => setForm((p) => ({ ...p, discount_type: e.target.value as "percentage" | "fixed" }))}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 font-body text-[12px] text-foreground focus:outline-none focus:ring-2 focus:ring-gold/30"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed (৳)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-body text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-1.5 block">
                      Discount Value
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.discount_value}
                      onChange={(e) => setForm((p) => ({ ...p, discount_value: Number(e.target.value) }))}
                      placeholder={form.discount_type === "percentage" ? "e.g. 10" : "e.g. 200"}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 font-body text-[12px] text-foreground focus:outline-none focus:ring-2 focus:ring-gold/30"
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="font-body text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-1.5 block">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 font-body text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-gold/30 resize-none h-20"
              />
            </div>

            <div>
              <label className="font-body text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-1.5 block">
                Tagline
              </label>
              <input
                type="text"
                value={form.tagline}
                onChange={(e) => setForm((p) => ({ ...p, tagline: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 font-body text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
            </div>

            {/* Variants */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-body text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground">
                  Variants
                </label>
                <Button type="button" variant="ghost" size="sm" onClick={addVariant}>
                  <Plus size={12} className="mr-1" /> Add Variant
                </Button>
              </div>
              <p className="font-body text-[10px] text-muted-foreground mb-2">
                Variant order matches image order — Variant 1 shows Image 1, Variant 2 shows Image 2, etc.
              </p>
              <div className="space-y-2">
                {form.variants.map((v, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="font-body text-[10px] font-bold tracking-wider uppercase text-gold w-12 shrink-0">
                      #{i + 1}
                    </span>
                    <input
                      type="text"
                      value={v.size}
                      onChange={(e) => updateVariant(i, "size", e.target.value)}
                      placeholder="Size (e.g. 5ml)"
                      className="flex-1 bg-background border border-border rounded-lg px-3 py-2 font-body text-[12px] text-foreground focus:outline-none focus:ring-2 focus:ring-gold/30"
                    />
                    <input
                      type="number"
                      value={v.price}
                      onChange={(e) => updateVariant(i, "price", Number(e.target.value))}
                      placeholder="Price"
                      className="w-24 bg-background border border-border rounded-lg px-3 py-2 font-body text-[12px] text-foreground focus:outline-none focus:ring-2 focus:ring-gold/30"
                    />
                    <input
                      type="text"
                      value={v.bestFor}
                      onChange={(e) => updateVariant(i, "bestFor", e.target.value)}
                      placeholder="Best for"
                      className="flex-1 bg-background border border-border rounded-lg px-3 py-2 font-body text-[12px] text-foreground focus:outline-none focus:ring-2 focus:ring-gold/30"
                    />
                    {form.variants.length > 1 && (
                      <button type="button" onClick={() => removeVariant(i)} className="text-destructive hover:text-destructive/80 p-1">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="gold" disabled={submitting}>
                {submitting ? "Saving…" : editingId ? "Update Product" : "Add Product"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProducts;
